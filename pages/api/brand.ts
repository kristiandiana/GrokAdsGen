import type { NextApiRequest, NextApiResponse } from "next";
import { getLatestMentions } from "../../lib/twitterClient";
import { scoreTweets } from "../../lib/analysis";
import { ScoredMention, BrandVoiceTweet } from "../../lib/types/tweet";

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<{
    public_mentions: ScoredMention[];
    brand_voice: BrandVoiceTweet[];
  }>
) {
  const limit = Number(req.query.limit) || 30;

  const mentionsRaw = getLatestMentions(limit);
  const scored = scoreTweets(mentionsRaw);

  res.status(200).json({
    public_mentions: scored,
    brand_voice: [] // streaming still MVP — can be added later
  });
}
