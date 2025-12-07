import { searchPublicMentions, searchBrandVoiceTweets } from "./twitterClient";
import { scoreTweets } from "./analysis";
import { analyzeMentions, buildAnalysisFromAnnotations, Analysis } from "./sentimentAnalysis";
import { generateSuggestions } from "./suggestions";
import { generateAdIdeas, generateVideoAdIdeas } from "./contentGeneration";
import {
  cleanupSentimentCache,
  getUnanalyzedTweets,
  storeBatch,
  tweetSentimentCache,
} from "./sentimentCache";
import { AnnotatedMention, BrandVoiceTweet, ScoredMention, Suggestion, AdIdea, GeneratedImage, AdGroup, VideoAdIdea } from "./types/tweet";

export type BrandInsights = {
  brand: string;
  public_mentions: ScoredMention[];
  brand_voice: BrandVoiceTweet[];
  analysis: Analysis;
  suggestions: Suggestion[];
  generated_ads?: AdIdea[];
  generated_ad_groups?: AdGroup[];
  generated_images?: GeneratedImage[];
  generated_video_ads?: VideoAdIdea[];
  generated_videos?: Array<{
    ad_idea_id: string;
    video_id: string;
    video_url?: string;
    status: "pending" | "processing" | "completed" | "failed";
    thumbnail_url?: string;
  }>;
};

export async function analyzeAndCacheMentions(
  mentions: ScoredMention[],
  voice_samples: BrandVoiceTweet[]
): Promise<AnnotatedMention[]> {
  console.log(`[sentimentPipeline] Analyzing mentions: total=${mentions.length}`);
  const newTweetIds = getUnanalyzedTweets(mentions.map((t) => t.id));
  const newTweets = mentions.filter((t) => newTweetIds.includes(t.id));

  if (newTweets.length === 0) {
    console.log("[sentimentPipeline] No new tweets to analyze (cache hit).");
    return [];
  }

  console.log(`[sentimentPipeline] Sending ${newTweets.length} new tweets to Grok for sentiment.`);
  const { annotated } = await analyzeMentions(newTweets, voice_samples);
  storeBatch(annotated);
  console.log(`[sentimentPipeline] Stored ${annotated.length} annotations in cache.`);
  return annotated;
}

export async function buildBrandInsights(brand: string): Promise<BrandInsights> {
  console.log(`[sentimentPipeline] Building insights for brand=${brand}`);
  const [public_mentions, brand_voice] = await Promise.all([
    searchPublicMentions(brand, 1000),
    searchBrandVoiceTweets(brand),
  ]);

  const scoredMentions = scoreTweets(public_mentions);

  cleanupSentimentCache();
  await analyzeAndCacheMentions(scoredMentions, brand_voice);

  const annotated: AnnotatedMention[] = scoredMentions
    .map((t) => tweetSentimentCache.get(t.id))
    .filter((m): m is AnnotatedMention => Boolean(m));

  console.log(
    `[sentimentPipeline] Cached annotations available: ${annotated.length}/${scoredMentions.length}`
  );

  const analysis = buildAnalysisFromAnnotations(annotated);

  const suggestions = await generateSuggestions({
    topicSummaries: analysis.topicSummaries,
    generalSentiment: analysis.generalSentiment,
    voice_samples: brand_voice,
    brand_handle: brand,
  });

  console.log(`[sentimentPipeline] Generated ${suggestions.length} suggestions.`);

  // Optionally generate creative assets (best-effort, won't fail pipeline)
  let generatedAds: AdIdea[] = [];
  let generatedAdGroups: AdGroup[] = [];
  let generatedImages: GeneratedImage[] = [];
  let generatedVideoAds: VideoAdIdea[] = [];
  let generatedVideos:
    | Array<{
        ad_idea_id: string;
        video_id: string;
        video_url?: string;
        status: "pending" | "processing" | "completed" | "failed";
        thumbnail_url?: string;
      }>
    | [] = [];

  // Log identified keywords/topics
  const topTopics = analysis.topicSummaries.slice(0, 8);
  console.log("\n🔑 Decided Topics/Keywords:");
  topTopics.forEach(t => console.log(`   - ${t.topic} (${t.total} mentions)`));

  // Generate ads for top 5-8 topics (suggestions)
  // Ensure we have enough suggestions first
  const suggestionsToProcess = suggestions.slice(0, 8);

  for (const suggestion of suggestionsToProcess) {
    console.log(`\n🎨 Generating Ad Ideas for Topic: "${suggestion.topic}"`);
    try {
      const adResult = await generateAdIdeas({
        suggestion: suggestion,
        voice_samples: brand_voice,
        brand_handle: brand,
      });
      
      generatedAds.push(...adResult.ads);
      if (adResult.adGroup) {
        generatedAdGroups.push(adResult.adGroup);
      }
      generatedImages.push(...adResult.images);
      
      console.log(
        `   ✅ Generated ${adResult.ads.length} ads for "${suggestion.topic}"`
      );
    } catch (err) {
      console.warn(`[sentimentPipeline] Failed to generate ads for ${suggestion.topic}`, err);
    }

    // Video generation paused per user request
    /*
    try {
      const videoResult = await generateVideoAdIdeas({
        suggestion: suggestion,
        voice_samples: brand_voice,
        brand_handle: brand,
        waitForCompletion: true,
      });
      generatedVideoAds.push(...videoResult.ads);
      generatedVideos.push(...videoResult.videos);
      console.log(
        `   🎥 Generated ${videoResult.ads.length} video ads for "${suggestion.topic}" (status only)`
      );
      console.log(
        "[sentimentPipeline] Video assets:",
        generatedVideos.map((v) => ({
          ad: v.ad_idea_id,
          status: v.status,
          url: v.video_url,
        }))
      );
    } catch (err) {
      console.warn(`[sentimentPipeline] Failed to generate video ads for ${suggestion.topic}`, err);
    }
    */
  }

  return {
    brand,
    public_mentions: scoredMentions,
    brand_voice,
    analysis,
    suggestions,
    generated_ads: generatedAds,
    generated_ad_groups: generatedAdGroups,
    generated_images: generatedImages,
    generated_video_ads: generatedVideoAds,
    generated_videos: generatedVideos,
  };
}
