import { searchPublicMentions, searchBrandVoiceTweets } from "./twitterClient";
import { scoreTweets } from "./analysis";
import { analyzeMentions, buildAnalysisFromAnnotations, Analysis } from "./sentimentAnalysis";
import { generateSuggestions } from "./suggestions";
import {
  cleanupSentimentCache,
  getUnanalyzedTweets,
  storeBatch,
  tweetSentimentCache,
} from "./sentimentCache";
import { AnnotatedMention, BrandVoiceTweet, ScoredMention, Suggestion } from "./types/tweet";

export type BrandInsights = {
  brand: string;
  public_mentions: ScoredMention[];
  brand_voice: BrandVoiceTweet[];
  analysis: Analysis;
  suggestions: Suggestion[];
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
    searchPublicMentions(brand),
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

  return {
    brand,
    public_mentions: scoredMentions,
    brand_voice,
    analysis,
    suggestions,
  };
}
