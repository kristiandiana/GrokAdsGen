import type { NextApiRequest, NextApiResponse } from "next";
import {
  searchPublicMentions,
  searchBrandVoiceTweets
} from "../../lib/twitterClient";
import { scoreTweets } from "../../lib/analysis";
import {
  ScoredMention,
  BrandVoiceTweet
} from "../../lib/types/tweet";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{
    public_mentions: ScoredMention[];
    brand_voice: BrandVoiceTweet[];
  }>
) {
  try {
    const brand = (req.query.brand as string) || "tesla";
    const [publicTweets, brandTweets] = await Promise.all([
      searchPublicMentions(brand),
      searchBrandVoiceTweets(brand)
    ]);

    const scored = scoreTweets(publicTweets);

    res.status(200).json({
      public_mentions: scored,
      brand_voice: brandTweets
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
