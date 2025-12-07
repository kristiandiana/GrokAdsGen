import { callGrok } from "./grokClient";
import { PublicMentionTweet, BrandVoiceTweet, AnnotatedMention, TopicSummary } from "./types/tweet";

const ALLOWED_TOPICS = [
    'pricing',
    'support',
    'ux',
    'performance',
    'features',
    'billing',
    'onboarding',
    'reliability',
    'speed',
    'bugs',
    'customer service',
    'value',
    'competition',
    'updates',
  ] as const;

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
        const topics = annotation.topics.length > 0 ? annotation.topics : ['other'];

        for(const topic of topics) {
            if(!topicMap.has(topic)) {
                topicMap.set(topic, {
                    topic,
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
            
            const summary = topicMap.get(topic);
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

        const batchSize = 25;
        const annotated: AnnotatedMention[] = [];

        const voiceContext = voice_samples.length > 0 ? 
            `These are the brand's recent tweets (for tone reference only): \n${voice_samples.map(tweet => `- ${tweet.text}`).join('\n')}\n` : '';
        
        for (let i = 0; i < mentions.length; i += batchSize) {
            const batch = mentions.slice(i, i + batchSize);

            const prompt = `${voiceContext}You are an expert social-media sentiment analyst for brands.
                Analyze the following ${batch.length} public mentions of a brand.
                
                CRITICAL INSTRUCTION: You MUST return a JSON object containing an array under the key "mentions".
                The array MUST have exactly ${batch.length} objects, one for each input tweet.
                Do not skip any tweets.

                For each mention, return an object with these exact fields:
                {
                "tweet_id": string,
                "sentiment": "positive" | "neutral" | "negative",
                "sentiment_score": number (0.00 to 1.00, higher = more positive),
                "topics": string[] (1–2 topics max, lowercase, choose ONLY from: ${ALLOWED_TOPICS.join(', ')}),
                "key_phrase": string | null (short quote ≤8 words that triggered the label),
                "is_sarcasm": boolean,
                "intensity": "low" | "medium" | "high"
                }

                Mentions to analyze:
                ${batch.map((m) => `ID: ${m.id}
                Text: "${m.text}"`).join('\n\n')}

                Return valid JSON only. Structure: { "mentions": [...] }`;

            const result = await callGrok(prompt, 'grok-4-1-fast-reasoning', true, 0);

            console.log('--- Raw Grok Response ---');
            console.log(JSON.stringify(result, null, 2));
            console.log('-------------------------');

            // Handle new structure { mentions: [...] } or fallback to array/single object
            let rawList: any[] = [];
            if (result && typeof result === 'object') {
                if ('mentions' in result && Array.isArray((result as any).mentions)) {
                    rawList = (result as any).mentions;
                } else if (Array.isArray(result)) {
                    rawList = result;
                } else {
                    rawList = [result];
                }
            }

            const batchAnnotated: AnnotatedMention[] = rawList;

            //for validation
            // made the decision not to add malformed items from grok
            for (const item of batchAnnotated) {
                const isValid =
                  item &&
                  typeof item.tweet_id === 'string' &&
                  ['positive', 'neutral', 'negative'].includes(item.sentiment) &&
                  typeof item.sentiment_score === 'number' &&
                  item.sentiment_score >= 0 && item.sentiment_score <= 1 &&
                  Array.isArray(item.topics) &&
                  item.topics.every((t: string) => ALLOWED_TOPICS.includes(t as any)) &&
                  ['low', 'medium', 'high'].includes(item.intensity);
          
                if (isValid) {
                  annotated.push({
                    tweet_id: item.tweet_id,
                    sentiment: item.sentiment,
                    sentiment_score: item.sentiment_score,
                    topics: item.topics,
                    analyzed_at: Date.now(),
                    key_phrase: item.key_phrase ?? null,
                    is_sarcasm: !!item.is_sarcasm,
                    intensity: item.intensity,
                  });
                }
            }
        }

        return buildAnalysisFromAnnotations(annotated);


        


    }
