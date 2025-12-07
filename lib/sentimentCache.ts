import { AnnotatedMention } from "./types/tweet";

const MAX_AGE_MS = 3 * 60 * 60 * 1000; // 3 hours
export const tweetSentimentCache = new Map<string, AnnotatedMention>();

export function cleanupSentimentCache() {
  const cutoff = Date.now() - MAX_AGE_MS;
  for (const [id, entry] of tweetSentimentCache) {
    if (entry.analyzed_at < cutoff) {
      tweetSentimentCache.delete(id);
    }
  }
}

export function storeBatch(results: AnnotatedMention[]) {
  results.forEach((r) => tweetSentimentCache.set(r.tweet_id, r));
}

export function getUnanalyzedTweets(tweetIds: string[]): string[] {
  return tweetIds.filter((id) => !tweetSentimentCache.has(id));
}
