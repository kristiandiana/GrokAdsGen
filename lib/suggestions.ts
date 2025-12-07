import { callGrok } from "./grokClient";
import type { TopicSummary, BrandVoiceTweet, Suggestion } from "./types/tweet";
import { getSuggestionHistory, addToHistory } from "./suggestionHistory";

interface GenerateSuggestionsInput {
    topicSummaries: TopicSummary[];
    generalSentiment: { score: number; label: string };
    voice_samples: BrandVoiceTweet[];
    brand_handle: string;
}

export async function generateSuggestions(
    input: GenerateSuggestionsInput
): Promise<Suggestion[]> {
    const { topicSummaries, generalSentiment, voice_samples, brand_handle } = input;

    if (topicSummaries.length === 0) {
        return [];
    }

    // Load History
    const history = getSuggestionHistory();
    const recentTopics = new Set(history.recentTopics.map(t => t.toLowerCase().trim()));

    // Filter out recently suggested topics
    // We filter BEFORE picking top 10, so we get the "next best" 10.
    const availableTopics = topicSummaries
        .filter(t => !recentTopics.has(t.topic.toLowerCase().trim()))
        .sort((a, b) => b.total - a.total);

    // If we filtered out everything (rare), fall back to original list
    const pool = availableTopics.length > 0 ? availableTopics : topicSummaries;
    
    if (availableTopics.length === 0) {
        console.warn("[Suggestions] All topics were in recent history. Falling back to all topics.");
    }

    const topTopics = pool.slice(0, 10);

    const highPriorityTopics = topTopics
    .map(t => ({
      ...t,
      priorityScore: (100 - t.positive_pct) * 0.7 + (t.intensity_breakdown.high / Math.max(t.total, 1)) * 30
    }))
    .sort((a, b) => b.priorityScore - a.priorityScore);

    const positiveTopics = topTopics.filter(t => t.positive_pct > 70);
    const neutralTopics = topTopics.filter(t => t.positive_pct > 30 && t.positive_pct < 70);
    const negativeTopics = topTopics.filter(t => t.positive_pct < 30);

    const voiceContext = voice_samples.length > 0 ? 
        `These are the brand's recent tweets (for tone reference only): \n${voice_samples.map(tweet => `- ${tweet.text}`).join('\n')}\n` : '';
    
    const sentimentContext = `Overall brand sentiment: ${generalSentiment.score}/100 – ${generalSentiment.label}`;

    const topicsContext = [
        'TOP TOPICS BY VOLUME (focus suggestions here):',
        ...topTopics.map(t => 
          `- ${t.topic}: ${t.total} mentions, ${t.positive_pct}% positive, high intensity: ${t.intensity_breakdown.high}`
        ),
        '',
        'HIGH PRIORITY (negative or intense):',
        ...highPriorityTopics.slice(0, 5).map(t => `- ${t.topic}`),
        '',
        'POSITIVE TOPICS TO AMPLIFY:',
        ...positiveTopics.map(t => `- ${t.topic}`)
      ].join('\n');

    const prompt = `${voiceContext}
        ${topicsContext}
        
        You are a senior social media strategist for ${brand_handle}.
        Generate exactly 3 concrete, actionable suggestions based on the data above.

        Rules:
        - Prioritize fixing high-priority topics (negative sentiment or high intensity)
        - Amplify strong positive topics
        - Every suggestion must include a ready-to-post tweet (≤280 chars) in the brand's exact voice
        - Tone must match the brand's tweets above
        - Be specific, tactical, and realistic
        - **IMPORTANT: Do NOT make suggestions about specific Twitter users or handles (e.g. "Reply to @user"). Focus on broader themes, product features, or customer sentiment patterns.**

        Return ONLY a JSON object with this exact structure:
        {
          "suggestions": [
            {
              "id": string,
              "title": string,
              "rationale": string,
              "topic": string,
              "priority": "high" | "medium" | "low",
              "suggested_copy": string,
              "tone": "empathetic" | "funny" | "promotional" | "straightforward"
            },
            ... (exactly 3 items total)
          ]
        }`;

    try {
        const result = await callGrok(prompt, 'grok-4-1-fast-reasoning', true, 0.2);

        console.log('--- Raw Suggestions Response ---');
        console.log(JSON.stringify(result, null, 2));
        console.log('--------------------------------');

        let rawList: any[] = [];
        if (Array.isArray(result)) {
            rawList = result;
        } else if (result && typeof result === 'object') {
             // check for { suggestions: [...] } or { result: [...] } wrapper
            if ('suggestions' in result && Array.isArray((result as any).suggestions)) {
                rawList = (result as any).suggestions;
            } else {
                rawList = [result];
            }
        }

        const suggestions: Suggestion[] = rawList;
        
        // Save topics to history
        const usedTopics = suggestions
            .map(s => s.topic)
            .filter(t => typeof t === 'string' && t.length > 0);
            
        if (usedTopics.length > 0) {
            addToHistory(usedTopics);
            console.log(`[Suggestions] Added ${usedTopics.length} topics to exclusion history.`);
        }

        return suggestions
            .filter(s => {
                const isValid = s && 
                    typeof s.title === 'string' &&
                    typeof s.rationale === 'string' &&
                    typeof s.suggested_copy === 'string' && s.suggested_copy.length <= 280 &&
                    typeof s.topic === 'string' &&
                    ['high', 'medium', 'low'].includes(s.priority) &&
                    typeof s.tone === 'string';
                
                if (!isValid) console.log('Invalid suggestion item:', s);
                return isValid;
            })
            .map((s, i) => ({
            ...s,
            id: s.id || `sug-${i + 1}`,
            }));
        } catch (error) {
            console.error('Suggestion generation failed:', error);
            return [];
        }
    

    
}