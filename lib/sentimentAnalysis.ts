import { PublicMentionTweet, BrandVoiceTweet, AnnotatedMention, TopicSummary } from "./types/tweet";
import * as vader from 'vader-sentiment';
import keyword_extractor from 'keyword-extractor';
import { callGrok } from "./grokClient";

// Blacklist for noise reduction
const STOPWORDS = new Set([
    'https', 'http', 't.co', 'www', 'com', 'org', 'net',
    'status', 'tweet', 'twitter', 'post', 'reply',
    'one', 'two', 'new', 'day', 'time', 'year', 'week',
    'today', 'tomorrow', 'yesterday', 'now', 'just',
    'get', 'got', 'go', 'going', 'make', 'made',
    'people', 'thing', 'way', 'im', 'dont', 'cant',
    'tesla', 'elon', 'musk' // Brand names often too generic for "topic" unless specific feature
]);

export interface Analysis {
    annotated: AnnotatedMention[];
    topicSummaries: TopicSummary[];
    generalSentiment: {
        score: number; //0-100
        label: 'very negative' | 'negative' | 'neutral' | 'positive' | 'very positive';
    };
}

export function buildAnalysisFromAnnotations(annotated: AnnotatedMention[]): Analysis {
    if (annotated.length === 0) {
        return {
            annotated: [],
            topicSummaries: [],
            generalSentiment: { score: 50, label: 'neutral'},
        };
    }

    const topicMap = new Map<string, TopicSummary>();

    for(const annotation of annotated) {
        const topics = annotation.topics.length > 0 ? annotation.topics : ['general'];

        for(const topic of topics) {
            // Normalize topic (lowercase) to ensure clustering
            const normalizedTopic = topic.toLowerCase().trim();
            
            if(!topicMap.has(normalizedTopic)) {
                topicMap.set(normalizedTopic, {
                    topic: normalizedTopic,
                    total: 0,
                    positive: 0,
                    neutral: 0,
                    negative: 0,
                    positive_pct: 0,
                    sample_tweet_ids: [],
                    intensity_breakdown: {
                        low: 0,
                        medium: 0,
                        high: 0,
                    },
                });
            }
            
            const summary = topicMap.get(normalizedTopic);
            if (summary) {
                summary.total++;
                summary[annotation.sentiment] += 1;
                summary.intensity_breakdown[annotation.intensity]++;
                if (summary.sample_tweet_ids.length < 3) {
                    summary.sample_tweet_ids.push(annotation.tweet_id);
                }
            }
        }
    }

    const topicSummaries: TopicSummary[] = Array.from(topicMap.values())
    .map(summary => ({
      ...summary,
      positive_pct: summary.total > 0 ? Math.round((summary.positive / summary.total) * 100) : 0
    }))
    .sort((a, b) => b.total - a.total);

    let weightedSum = 0;
    let totalWeight = 0;
    for (const annotation of annotated) {
        let score = annotation.sentiment === 'positive' 
        ? annotation.sentiment_score 
        : annotation.sentiment === 'negative' 
            ? 1 - annotation.sentiment_score  // optional: mirror negative
            : 0.5;
        if (annotation.is_sarcasm) score = 1 - score;

        const weight = annotation.intensity === 'high' ? 2 : annotation.intensity === 'medium' ? 1.3 : 1;
        weightedSum += score * weight;
        totalWeight += weight;
    }

    const generalScore = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) : 50;
    const generalLabel = 
        generalScore >= 80 ? 'very positive' :
        generalScore >= 60 ? 'positive' :
        generalScore >= 40 ? 'neutral' :
        generalScore >= 20 ? 'negative' :
        'very negative';

    return {
        annotated,
        topicSummaries,
        generalSentiment: { score: generalScore, label: generalLabel },
    };
}

async function consolidateTopics(rawKeywords: string[]): Promise<Map<string, string>> {
    // Count frequencies
    const freq = new Map<string, number>();
    rawKeywords.forEach(k => freq.set(k, (freq.get(k) || 0) + 1));

    // Get top 60 keywords
    const topKeywords = Array.from(freq.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 60)
        .map(e => `${e[0]} (${e[1]})`);

    if (topKeywords.length === 0) return new Map();

    const prompt = `
    You are a data analyst. I have a list of raw extracted keywords from social media tweets about a brand.
    Your job is to cluster them into exactly 5-8 distinct, high-level business topics (e.g. "Customer Support", "Product Quality", "Shipping", "Pricing", "User Experience").

    Rules:
    1. IGNORE usernames (starting with @), URLs, or generic noise words if any slipped through.
    2. Group specific items under broader themes (e.g. "brakes", "engine", "tires" -> "Vehicle Performance").
    3. Return a JSON object mapping the RAW KEYWORD to the HIGH-LEVEL TOPIC.
    4. Only map the keywords provided.

    Raw Keywords:
    ${topKeywords.join(', ')}

    Return format:
    {
      "mapping": {
        "raw_keyword_1": "High Level Topic A",
        "raw_keyword_2": "High Level Topic B"
      }
    }
    `;

    try {
        const result = await callGrok(prompt, 'grok-4-1-fast-reasoning', true, 0.7); // Increased temperature slightly to 0.7 for variance
        if (result && result.mapping) {
            return new Map(Object.entries(result.mapping));
        }
    } catch (err) {
        console.error("Topic consolidation failed:", err);
    }
    return new Map();
}

export async function analyzeMentions(
    mentions: PublicMentionTweet[],
    voice_samples: BrandVoiceTweet[] = []
    ): Promise<Analysis> {
        if (mentions.length === 0) {
            return {
                annotated: [],
                topicSummaries: [],
                generalSentiment: { score: 50, label: 'neutral'},
            }
        }

        console.log(`[VADER] Starting fast sentiment analysis on ${mentions.length} tweets...`);
        
        // Phase 1: Local Analysis & Keyword Extraction
        const tempAnnotated: { 
            tweet_id: string; 
            sentiment: 'positive'|'neutral'|'negative'; 
            sentiment_score: number;
            intensity: 'low'|'medium'|'high';
            raw_keywords: string[];
        }[] = [];

        const allRawKeywords: string[] = [];

        for (const mention of mentions) {
            try {
                // VADER Sentiment
                const result = vader.SentimentIntensityAnalyzer.polarity_scores(mention.text);
                const compound = result.compound;
                
                let sentiment: 'positive' | 'neutral' | 'negative';
                if (compound >= 0.05) sentiment = 'positive';
                else if (compound <= -0.05) sentiment = 'negative';
                else sentiment = 'neutral';

                const absScore = Math.abs(compound);
                let intensity: 'low' | 'medium' | 'high' = 'low';
                if (absScore > 0.6) intensity = 'high';
                else if (absScore > 0.3) intensity = 'medium';

                const normalizedScore = (compound + 1) / 2;

                // Keyword Extraction
                // Manually clean text first to remove @mentions and URLs
                const cleanText = mention.text
                    .replace(/@\w+/g, '') // remove mentions
                    .replace(/https?:\/\/\S+/g, '') // remove links
                    .replace(/[^a-zA-Z\s]/g, ''); // remove special chars

                const extractionResult = keyword_extractor.extract(cleanText, {
                    language: "english",
                    remove_digits: true,
                    return_changed_case: true,
                    remove_duplicates: true,
                });

                // Filter stopwords
                const filteredKeywords = extractionResult.filter(k => 
                    k.length > 2 && !STOPWORDS.has(k.toLowerCase())
                );

                tempAnnotated.push({
                    tweet_id: mention.id,
                    sentiment,
                    sentiment_score: normalizedScore,
                    intensity,
                    raw_keywords: filteredKeywords
                });

                allRawKeywords.push(...filteredKeywords);

            } catch (err) {
                console.error(`[VADER] Error analyzing tweet ${mention.id}:`, err);
            }
        }

        // Phase 2: Topic Consolidation (Grok)
        console.log(`[Topics] Consolidating ${allRawKeywords.length} keywords...`);
        const topicMapping = await consolidateTopics(allRawKeywords);
        console.log(`[Topics] Mapped to ${new Set(topicMapping.values()).size} distinct themes.`);

        // Phase 3: Final Annotation Construction
        const annotated: AnnotatedMention[] = tempAnnotated.map(item => {
            // Map raw keywords to high-level topics
            const highLevelTopics = new Set<string>();
            item.raw_keywords.forEach(k => {
                const mapped = topicMapping.get(k);
                if (mapped) highLevelTopics.add(mapped);
            });

            const finalTopics = Array.from(highLevelTopics);
            // If no mapped topic found, use "General Brand Sentiment" or skip
            if (finalTopics.length === 0) finalTopics.push('General Chatter');

            return {
                tweet_id: item.tweet_id,
                sentiment: item.sentiment,
                sentiment_score: item.sentiment_score,
                topics: finalTopics,
                key_phrase: item.raw_keywords[0] || null, // Keep raw keyword as key phrase context
                is_sarcasm: false,
                intensity: item.intensity,
                analyzed_at: Date.now()
            };
        });

        console.log(`[VADER] Completed analysis. Annotated ${annotated.length} tweets.`);
        return buildAnalysisFromAnnotations(annotated);
    }
