import { PublicMentionTweet } from "./types/tweet";
import { ScoredMention } from "./types/tweet";
const computeEngagementScore = (tweet: PublicMentionTweet): number => {
    const m = tweet.public_metrics;
    if (!m) return 0;

    return (
        (m.like_count || 0) +
        (m.reply_count || 0) * 2 +
        (m.quote_count || 0) * 2 +
        (m.retweet_count || 0) * 3
    );
};

// Convert raw tweets → scored tweets
export function scoreTweets(tweets: PublicMentionTweet[]): ScoredMention[] {
    return tweets.map((t) => ({
        ...t,
        engagement_score: computeEngagementScore(t),
    }));
}

// Sorting helpers
export function sortByEngagement(tweets: ScoredMention[]): ScoredMention[] {
    return [...tweets].sort((a, b) => b.engagement_score - a.engagement_score);
}

export function sortByRecency(tweets: ScoredMention[]): ScoredMention[] {
    return [...tweets].sort(
        (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
}
