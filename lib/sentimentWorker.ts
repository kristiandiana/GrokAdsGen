import { cleanupSentimentCache } from "./sentimentCache";
import { ScoredMention } from "./types/tweet";
import { analyzeAndCacheMentions } from "./sentimentPipeline";
import { scoreTweets } from "./analysis";

let isRunning = false;

export async function runSentimentWorker(brand = "tesla") {
  if (isRunning) return;
  isRunning = true;

  try {
    const res = await fetch(`http://localhost:3000/api/brand?brand=${encodeURIComponent(brand)}`);
    const data = await res.json();

    const scored: ScoredMention[] = scoreTweets(data.public_mentions);

    cleanupSentimentCache();
    await analyzeAndCacheMentions(scored, data.brand_voice || []);

  } catch (err) {
    console.error("Sentiment worker failed:", err);
  } finally {
    isRunning = false;
  }
}
