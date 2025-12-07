import type { NextApiRequest, NextApiResponse } from "next";
import {
  searchPublicMentions,
  searchBrandVoiceTweets
} from "../../lib/twitterClient";
import { scoreTweets } from "../../lib/analysis";
import {
  ScoredMention,
  BrandVoiceTweet,
  PublicMentionTweet
} from "../../lib/types/tweet";

function filterSpam(tweets: PublicMentionTweet[]): PublicMentionTweet[] {
  return tweets.filter((t) => {
    const text = t.text.toLowerCase();

    const hashtagCount = (t.text.match(/#/g) || []).length;
    if (hashtagCount >= 5) return false;

    const urlCount = (t.text.match(/https?:\/\/\S+/gi) || []).length;
    if (urlCount >= 2) return false;

    const spamKeywords = [
      "giveaway",
      "free",
      "win",
      "contest",
      "promo",
      "discount",
      "coupon",
      "retweet to win",
      "rt to win",
      "follow back", 
      "FOLLOW ME", 
      "message me"
    ];
    if (spamKeywords.some((k) => text.includes(k))) return false;

    const metrics = t.public_metrics;
    if (
      hashtagCount >= 3 &&
      metrics &&
      (metrics.like_count ?? 0) === 0 &&
      (metrics.retweet_count ?? 0) === 0 &&
      (metrics.reply_count ?? 0) === 0
    ) {
      return false;
    }

    return true;
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  try {
    const brand = (req.query.brand as string) || "tesla";
    const [publicTweets, brandTweets] = await Promise.all([
      searchPublicMentions(brand),
      searchBrandVoiceTweets(brand)
    ]);

    const filteredTweets = filterSpam(publicTweets);

    const scored = scoreTweets(filteredTweets);

    res.status(200).json({
      public_mentions: scored,
      brand_voice: brandTweets
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
