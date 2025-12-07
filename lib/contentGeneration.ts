import { callGrok, generateImage } from "./grokClient";
import type { Suggestion, BrandVoiceTweet, AdIdea, GeneratedImage } from "./types/tweet";

interface GenerateAdsInput {
    suggestion: Suggestion;
    voice_samples: BrandVoiceTweet[];
    brand_handle: string;
}

export async function generateAdIdeas(
    input: GenerateAdsInput
): Promise<{
    ads: AdIdea[];
    images: GeneratedImage[];
}> {
    const { suggestion, voice_samples, brand_handle } = input;

    const voiceContext = voice_samples.length > 0
    ? `Brand's exact tone and style from recent tweets (MUST MATCH THIS VOICE):\n${voice_samples
        .slice(0, 10)
        .map(v => `- "${v.text}"`)
        .join('\n')}\n\n`
    : '';

    const suggestionContext = `ACTION TO TAKE:\nTitle: ${suggestion.title}\nRationale: ${suggestion.rationale}\nTopic: ${suggestion.topic}\nPriority: ${suggestion.priority}\nTone: ${suggestion.tone}\nExample tweet: "${suggestion.suggested_copy}"`;

    const prompt = `${voiceContext}
        ${suggestionContext}

        You are a world-class X/Twitter ad strategist and copywriter for ${brand_handle}.
        Generate exactly 4 promotable ad ideas that directly address the suggestion above.

        Rules:
        - Match the brand's voice 100% from the tweets
        - Vary objectives: one awareness, one engagement, one conversions, one retention
        - Format: single_image (1024x1024)
        - Include punchy headline, compelling body, clear CTA, 2–4 relevant hashtags
        - Image prompt must be impactful, realistic, clean/sleek, and with copywriting

        Return ONLY a JSON object with this exact structure:
        {
          "ads": [
            {
              "headline": string,
              "body": string,
              "call_to_action": string,
              "hashtags": string[],
              "objective": "awareness" | "engagement" | "conversions" | "retention",
              "image_prompt": string (detailed, high-quality visual description)
            },
            ... (exactly 4 items)
          ]
        }

        No extra text.`;

    try {
        const result = await callGrok(prompt, 'grok-4-1-fast-reasoning', true, 0.7); // Higher temp for creativity
        
        let rawAds: any[] = [];
        if (result && typeof result === 'object') {
            if ('ads' in result && Array.isArray((result as any).ads)) {
                rawAds = (result as any).ads;
            } else if (Array.isArray(result)) {
                rawAds = result;
            } else {
                rawAds = [result];
            }
        }

        const validAds: AdIdea[] = rawAds
            .filter(ad => 
                ad &&
                typeof ad.headline === 'string' &&
                typeof ad.body === 'string' &&
                typeof ad.call_to_action === 'string' &&
                Array.isArray(ad.hashtags) &&
                ['awareness', 'engagement', 'conversions', 'retention'].includes(ad.objective) &&
                typeof ad.image_prompt === 'string' && ad.image_prompt.length > 50
            )
            .slice(0, 4)
            .map((ad, i) => ({
                id: `ad-${suggestion.id}-${i + 1}`,
                headline: ad.headline.trim(),
                body: ad.body.trim(),
                call_to_action: ad.call_to_action.trim(),
                hashtags: ad.hashtags,
                format: 'single_image',
                objective: ad.objective,
                image_prompt: ad.image_prompt.trim(),
                suggested_tweet_text: `${ad.headline}\n\n${ad.body}\n\n${ad.call_to_action} ${ad.hashtags.join(' ')}`.trim(),
            }));

        const images: GeneratedImage[] = [];
        for (const ad of validAds) {
            try {
              const imageData = await generateImage(ad.image_prompt);
          
              images.push({
                ...imageData,
                ad_idea_id: ad.id,
              });
            } catch (err) {
              console.error(`Failed to generate image for ad ${ad.id}:`, err);
              // Continue with next ad
            }
        }

        return {
            ads: validAds,
            images,
        }
    } catch(err) {
        console.error('Failed to generate ad ideas:', err);
        return {
            ads: [],
            images: [],
        }
    }
    
}