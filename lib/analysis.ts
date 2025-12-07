import { PublicMentionTweet, ScoredMention } from "./types/tweet";

export function scoreTweets(tweets: PublicMentionTweet[]): ScoredMention[] {
  return tweets.map((t) => {
    const m = t.public_metrics;
    const score = m
      ? (m.like_count ?? 0) +
        (m.reply_count ?? 0) * 2 +
        (m.quote_count ?? 0) * 2 +
        (m.retweet_count ?? 0) * 3
      : 0;
    return { ...t, engagement_score: score };
  });
}
