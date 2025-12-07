import { PublicMentionTweet, BrandVoiceTweet, AnnotatedMention, TopicSummary } from "./types/tweet";
import * as vader from 'vader-sentiment';
import keyword_extractor from 'keyword-extractor';

// Removing fixed ALLOWED_TOPICS to allow dynamic clustering
// const ALLOWED_TOPICS = [...]

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
        const annotated: AnnotatedMention[] = [];

        for (const mention of mentions) {
            try {
                // 1. Calculate Sentiment using VADER
                // VADER returns { neg, neu, pos, compound }
                const result = vader.SentimentIntensityAnalyzer.polarity_scores(mention.text);
                const compound = result.compound; // -1.0 to 1.0

                // Determine Sentiment Label
                let sentiment: 'positive' | 'neutral' | 'negative';
                if (compound >= 0.05) sentiment = 'positive';
                else if (compound <= -0.05) sentiment = 'negative';
                else sentiment = 'neutral';

                // Determine Intensity
                // 0.05 - 0.3 = low
                // 0.3 - 0.6 = medium
                // 0.6+ = high
                // For neutral, we can use the 'neu' score or just default to low
                const absScore = Math.abs(compound);
                let intensity: 'low' | 'medium' | 'high' = 'low';
                if (absScore > 0.6) intensity = 'high';
                else if (absScore > 0.3) intensity = 'medium';

                // Normalize Score to 0-1 for our internal format
                // VADER is -1 to 1. 
                // If we want 0-1 where 1 is "very positive" and 0 is "very negative", we could do (compound + 1) / 2
                // BUT our type says: sentiment_score: number (0.00 to 1.00)
                // And usage usually implies "confidence in the label" or "positivity".
                // Let's use (compound + 1) / 2 for a global positivity index, 
                // OR use Math.abs(compound) if it represents "strength of current sentiment".
                // Looking at `buildAnalysisFromAnnotations`:
                // let score = annotation.sentiment === 'positive' ? annotation.sentiment_score : annotation.sentiment === 'negative' ? 1 - annotation.sentiment_score ...
                // This implies sentiment_score is a "magnitude of match" or "probability".
                // Let's stick to mapping VADER compound directly to a 0-1 positivity scale:
                const normalizedScore = (compound + 1) / 2;

                // 2. Extract Topics using Keyword Extractor
                // This is a naive extraction but fast.
                const extractionResult = keyword_extractor.extract(mention.text, {
                    language: "english",
                    remove_digits: true,
                    return_changed_case: true,
                    remove_duplicates: true,
                });

                // Take top 2 keywords as topics, exclude common brand names if needed (not implementing blacklist here yet)
                const topics = extractionResult.slice(0, 2);
                if (topics.length === 0) topics.push('general');

                // 3. Construct AnnotatedMention
                annotated.push({
                    tweet_id: mention.id,
                    sentiment,
                    sentiment_score: normalizedScore, // 0.0 (neg) to 1.0 (pos)
                    topics,
                    key_phrase: topics[0] || null,
                    is_sarcasm: false, // VADER doesn't detect sarcasm reliably
                    intensity,
                    analyzed_at: Date.now(),
                });

            } catch (err) {
                console.error(`[VADER] Error analyzing tweet ${mention.id}:`, err);
            }
        }

        console.log(`[VADER] Completed analysis. Annotated ${annotated.length} tweets.`);
        return buildAnalysisFromAnnotations(annotated);
    }
