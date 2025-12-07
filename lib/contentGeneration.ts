import { callGrok, generateImage } from "./grokClient";
import { generateVideo } from "./pikaClient";
import { analyzeBrandVisuals } from "./visionAnalysis"; 
import type {
  Suggestion,
  BrandVoiceTweet,
  AdIdea,
  GeneratedImage,
  VideoAdIdea
} from "./types/tweet";

interface GenerateAdsInput {
  suggestion: Suggestion;
  voice_samples: BrandVoiceTweet[];
  brand_handle: string;
}

export async function generateAdIdeas(input: GenerateAdsInput): Promise<{
  ads: AdIdea[];
  images: GeneratedImage[];
}> {
  const { suggestion, voice_samples, brand_handle } = input;

  // 1. Analyze Visual Style (if any voice samples have images)
  const allMedia = voice_samples.flatMap(v => v.media || []);
  const visualAnalysis = await analyzeBrandVisuals(allMedia);
  const visualStyleContext = visualAnalysis.consolidatedStyle 
    ? `\nVISUAL STYLE GUIDE (Must match this aesthetic): ${visualAnalysis.consolidatedStyle}\n`
    : '';

  const voiceContext =
    voice_samples.length > 0
      ? `Brand's exact tone and style from recent tweets (MUST MATCH THIS VOICE):\n${voice_samples
          .slice(0, 10)
          .map((v) => `- "${v.text}"`)
          .join("\n")}\n\n`
      : "";

  const suggestionContext = `ACTION TO TAKE:\nTitle: ${suggestion.title}\nRationale: ${suggestion.rationale}\nTopic: ${suggestion.topic}\nPriority: ${suggestion.priority}\nTone: ${suggestion.tone}\nExample tweet: "${suggestion.suggested_copy}"`;

  const prompt = `${voiceContext}
        ${visualStyleContext} 
        ${suggestionContext}

        You are a world-class X/Twitter ad strategist and copywriter for ${brand_handle}.
        Generate exactly 2 promotable ad ideas that directly address the suggestion above.

        Rules:
        - Match the brand's voice 100% from the tweets
        - Match the brand's VISUAL STYLE for image prompts
        - Vary objectives: one awareness, one engagement (or conversions)
        - Format: single_image (1024x1024)
        - Include punchy headline, compelling body, clear CTA, 2–4 relevant hashtags
        - Image prompt must be **PHOTOREALISTIC**, cinematic, and high-fidelity. 
        - AVOID: "AI sheen", "cartoonish", "over-saturated", "generic illustration".
        - Image prompt must ALIGN with the Visual Style Guide provided above (lighting, color, mood)
        - If Visual Style Guide says "grainy/film", explicitly ask for "film grain, shot on 35mm".
        - If Visual Style Guide says "minimalist", explicitly ask for "clean composition, negative space".
        
        New: Visual Variety Requirements (Must be distinct for each ad):
        - Ad 1: Macro/Close-up product shot (high detail)
        - Ad 2: Wide environmental/lifestyle shot (context)
        
        New: Copy Adherence Requirement:
        - The image prompt MUST include the key noun/subject from the headline.
        - Example: If headline mentions "CyberTruck", image prompt must specify "CyberTruck".
        
        New: Visual Balance Requirements:
        - HERO OBJECT: The main product (e.g. car, phone, drink) must be the clear focal point (60% of frame).
        - BACKGROUND: Must subtly reflect the Copywriting theme. 
          * Example: If headline says "Freedom", background is open road/sky.
          * Example: If headline says "Precision", background is clean/geometric studio.
        - STYLE: Must be 80% based on the "Visual Style Guide" provided above, and 20% creative adaptation to the new copy.
        
        New: Recommend a bidding strategy and target bid (in micro-currency).
        - bid_strategy: 'AUTO' | 'MAX' | 'TARGET'
        - Logic:
          * Use 'AUTO' for Awareness objectives (lowest cost).
          * Use 'MAX' for Engagement/Conversions (get volume).
          * Use 'TARGET' only if you want to control CPA strictly.
        - target_bid: number (e.g. 500000 for $0.50). Set to 0 if AUTO.
        
        New: Recommend basic targeting criteria.
        - targeting: { keywords: string[], interests: string[] }

        Return ONLY a JSON object with this exact structure:
        {
          "ads": [
            {
              "headline": string,
              "body": string,
              "call_to_action": string,
              "hashtags": string[],
              "objective": "awareness" | "engagement" | "conversions",
              "image_prompt": string (detailed, high-quality visual description matching style guide),
              "bid_strategy": "AUTO" | "MAX" | "TARGET",
              "target_bid": number,
              "targeting": {
                "keywords": string[],
                "interests": string[]
              }
            },
            ... (exactly 2 items)
          ]
        }

        No extra text.`;

  try {
    const result = await callGrok(prompt, "grok-4-1-fast-reasoning", true, 0.7); // Higher temp for creativity

    let rawAds: any[] = [];
    if (result && typeof result === "object") {
      if ("ads" in result && Array.isArray((result as any).ads)) {
        rawAds = (result as any).ads;
      } else if (Array.isArray(result)) {
        rawAds = result;
      } else {
        rawAds = [result];
      }
    }

    const validAds: AdIdea[] = rawAds
      .filter(
        (ad) =>
          ad &&
          typeof ad.headline === "string" &&
          typeof ad.body === "string" &&
          typeof ad.call_to_action === "string" &&
          Array.isArray(ad.hashtags) &&
          ["awareness", "engagement", "conversions", "retention"].includes(
            ad.objective
          ) &&
          typeof ad.image_prompt === "string" &&
          ad.image_prompt.length > 50
      )
      .slice(0, 2)
      .map((ad, i) => ({
        id: `ad-${suggestion.id}-${i + 1}`,
        headline: ad.headline.trim(),
        body: ad.body.trim(),
        call_to_action: ad.call_to_action.trim(),
        hashtags: ad.hashtags,
        format: "single_image",
        objective: ad.objective,
        image_prompt: ad.image_prompt.trim(),
        suggested_tweet_text: `${ad.headline}\n\n${ad.body}\n\n${
          ad.call_to_action
        } ${ad.hashtags.join(" ")}`.trim(),
        bid_strategy: ad.bid_strategy || 'AUTO',
        target_bid: ad.target_bid || 1000000,
        targeting: ad.targeting || { keywords: [], interests: [] }
      }));

    const images: GeneratedImage[] = [];
    for (const ad of validAds) {
      try {
        const imageData = await generateImage(ad.image_prompt);

        images.push({
          ...imageData,
          ad_idea_id: ad.id,
        });
        if (imageData?.image_url) {
          console.log(
            "[BrandPulse][ads] image generated",
            ad.id,
            "url:",
            imageData.image_url
          );
        }
      } catch (err) {
        console.error(`Failed to generate image for ad ${ad.id}:`, err);
        // Continue with next ad
      }
    }

    return {
      ads: validAds,
      images,
    };
  } catch (err) {
    console.error("Failed to generate ad ideas:", err);
    return {
      ads: [],
      images: [],
    };
  }
}

interface GenerateVideoAdsInput {
  suggestion: Suggestion;
  voice_samples: BrandVoiceTweet[];
  brand_handle: string;
  waitForCompletion?: boolean; // If true, waits for video generation to complete
}

/**
 * Generate video ad ideas with video generation using Pika Labs
 * @param input - Input containing suggestion, voice samples, and brand handle
 * @returns Promise with video ad ideas and their generated videos
 */
export async function generateVideoAdIdeas(
  input: GenerateVideoAdsInput
): Promise<{
  ads: VideoAdIdea[];
  videos: Array<{
    ad_idea_id: string;
    video_id: string;
    video_url?: string;
    status: "pending" | "processing" | "completed" | "failed";
    thumbnail_url?: string;
  }>;
}> {
  const {
    suggestion,
    voice_samples,
    brand_handle,
    waitForCompletion = false,
  } = input;

  // 1. Analyze Visual Style (if any voice samples have images)
  const allMedia = voice_samples.flatMap(v => v.media || []);
  const visualAnalysis = await analyzeBrandVisuals(allMedia);
  const visualStyleContext = visualAnalysis.consolidatedStyle 
    ? `\nVISUAL STYLE GUIDE (Must match this aesthetic): ${visualAnalysis.consolidatedStyle}\n`
    : '';

  // First generate ad ideas (similar to generateAdIdeas but for video format)
  const voiceContext =
    voice_samples.length > 0
      ? `Brand's exact tone and style from recent tweets (MUST MATCH THIS VOICE):\n${voice_samples
          .slice(0, 10)
          .map((v) => `- "${v.text}"`)
          .join("\n")}\n\n`
      : "";

  const suggestionContext = `ACTION TO TAKE:\nTitle: ${suggestion.title}\nRationale: ${suggestion.rationale}\nTopic: ${suggestion.topic}\nPriority: ${suggestion.priority}\nTone: ${suggestion.tone}\nExample tweet: "${suggestion.suggested_copy}"`;

  const prompt = `${voiceContext}
        ${visualStyleContext}
        ${suggestionContext}

        You are a world-class X/Twitter ad strategist and copywriter for ${brand_handle}.
        Generate exactly 2 video ad ideas that directly address the suggestion above.

        Rules:
        - Match the brand's voice 100% from the tweets
        - Match the brand's VISUAL STYLE for video prompts
        - Vary objectives: one awareness, one engagement (or conversions)
        - Format: video (16:9 aspect ratio recommended)
        - Include punchy headline, compelling body, clear CTA, 2–4 relevant hashtags
        - Video prompt must be detailed, cinematic, and describe motion/action
        - Video prompts should be 2-3 sentences describing the visual narrative
        - Video prompts must ALIGN with the Visual Style Guide provided above
        
        New: Recommend a bidding strategy and target bid (in micro-currency).
        - bid_strategy: 'AUTO' | 'MAX' | 'TARGET'
        - Logic:
          * Use 'AUTO' for Awareness objectives.
          * Use 'MAX' for Engagement/Conversions.
        - target_bid: number (e.g. 500000 for $0.50). Set to 0 if AUTO.
        
        New: Recommend basic targeting criteria.
        - targeting: { keywords: string[], interests: string[] }

        Return ONLY a JSON object with this exact structure:
        {
          "ads": [
            {
              "headline": string,
              "body": string,
              "call_to_action": string,
              "hashtags": string[],
              "objective": "awareness" | "engagement" | "conversions",
              "video_prompt": string (detailed, cinematic video description with motion matching style guide),
              "bid_strategy": "AUTO" | "MAX" | "TARGET",
              "target_bid": number,
              "targeting": {
                "keywords": string[],
                "interests": string[]
              }
            },
            ... (exactly 2 items)
          ]
        }

        No extra text.`;

  try {
    const result = await callGrok(prompt, "grok-4-1-fast-reasoning", true, 0.7);

    let rawAds: any[] = [];
    if (result && typeof result === "object") {
      if ("ads" in result && Array.isArray((result as any).ads)) {
        rawAds = (result as any).ads;
      } else if (Array.isArray(result)) {
        rawAds = result;
      } else {
        rawAds = [result];
      }
    }

    const validAds: VideoAdIdea[] = rawAds
      .filter(
        (ad) =>
          ad &&
          typeof ad.headline === "string" &&
          typeof ad.body === "string" &&
          typeof ad.call_to_action === "string" &&
          Array.isArray(ad.hashtags) &&
          ["awareness", "engagement", "conversions"].includes(ad.objective) &&
          typeof ad.video_prompt === "string" &&
          ad.video_prompt.length > 50
      )
      .slice(0, 2)
      .map((ad, i) => ({
        id: `video-ad-${suggestion.id}-${i + 1}`,
        headline: ad.headline.trim(),
        body: ad.body.trim(),
        call_to_action: ad.call_to_action.trim(),
        hashtags: ad.hashtags,
        format: "video",
        objective: ad.objective,
        image_prompt: ad.video_prompt.trim(), // Store video prompt in image_prompt field for compatibility
        video_prompt: ad.video_prompt.trim(),
        suggested_tweet_text: `${ad.headline}\n\n${ad.body}\n\n${
          ad.call_to_action
        } ${ad.hashtags.join(" ")}`.trim(),
        video_status: "pending" as const,
        bid_strategy: ad.bid_strategy || 'AUTO',
        target_bid: ad.target_bid || 1000000,
        targeting: ad.targeting || { keywords: [], interests: [] }
      }));

    // Generate videos for each ad
    const videos: Array<{
      ad_idea_id: string;
      video_id: string;
      video_url?: string;
      status: "pending" | "processing" | "completed" | "failed";
      thumbnail_url?: string;
    }> = [];

    for (const ad of validAds) {
      try {
        if (waitForCompletion) {
          // Wait for video to complete
          const result = await generateVideo(ad.image_prompt, {
            aspect_ratio: "16:9",
            resolution: "720p",
            duration: 5,
          });

          ad.video_url = result.video_url;
          ad.video_status = "completed";

          if (result?.video_url) {
            console.log(
              "[BrandPulse][ads] video generated",
              ad.id,
              "url:",
              result.video_url
            );
          }
          videos.push({
            ad_idea_id: ad.id,
            video_id: result.video_id,
            video_url: result.video_url,
            status: "completed",
          });
        } else {
          // Start generation and return immediately (async)
          const { generateVideoAsync } = await import("./pikaClient");
          const videoResponse = await generateVideoAsync(ad.image_prompt, {
            aspect_ratio: "16:9",
            resolution: "720p",
            duration: 5,
          });

          ad.video_id = videoResponse.video_id;
          ad.video_status = videoResponse.status;

          videos.push({
            ad_idea_id: ad.id,
            video_id: videoResponse.video_id,
            status: videoResponse.status,
          });

          if (videoResponse?.video_id) {
            console.log(
              "[BrandPulse][ads] video async generated",
              ad.id,
              "id:",
              videoResponse.video_id
            );
          }
        }
      } catch (err) {
        console.error(`Failed to generate video for ad ${ad.id}:`, err);
        ad.video_status = "failed";

        videos.push({
          ad_idea_id: ad.id,
          video_id: ad.id,
          status: "failed",
        });
      }
    }

    return {
      ads: validAds,
      videos,
    };
  } catch (err) {
    console.error("Failed to generate video ad ideas:", err);
    return {
      ads: [],
      videos: [],
    };
  }
}
