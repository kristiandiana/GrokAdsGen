import { tweetSentimentCache, cleanupSentimentCache, getUnanalyzedTweets, storeBatch } from "./sentimentCache";
import { AnnotatedMention, ScoredMention } from "./types/tweet";
import { scoreTweets } from "./analysis";

let isRunning = false;

export async function runSentimentWorker() {
  if (isRunning) return;
  isRunning = true;

  const res = await fetch("http://localhost:3000/api/brand");
  const data = await res.json();

  const scored: ScoredMention[] = scoreTweets(data.public_mentions);

  const newTweetIds = getUnanalyzedTweets(scored.map((t) => t.id));
  const newTweets = scored.filter((t) => newTweetIds.includes(t.id));

  if (newTweets.length > 0) {
    // const batchResults = await analyzeSentimentBatch(newTweets);
    // storeBatch(batchResults);
  }

  cleanupSentimentCache();
  isRunning = false;
}
