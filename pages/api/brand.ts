import type { NextApiRequest, NextApiResponse } from "next";
import { fetchPublicMentions, fetchBrandVoice } from "../../lib/twitterClient";
import { scoreTweets, sortByEngagement } from "../../lib/analysis";
import { ScoredMention, BrandVoiceTweet } from "../../lib/types/tweet";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{
    public_mentions: ScoredMention[];
    brand_voice: BrandVoiceTweet[];
  }>
) {
  const brand = (req.query.brand as string) || "tesla";
  const limit = Number(req.query.limit) || 30;
  const sort = (req.query.sort as string) || "engagement";

  // Fetch raw data from X API
  const publicMentionsRaw = await fetchPublicMentions(brand, limit);
  const brandVoiceTweets = await fetchBrandVoice(brand, limit);

  // Score & sort public mentions
  let scoredMentions = scoreTweets(publicMentionsRaw);
  scoredMentions =
    sort === "recent"
      ? scoredMentions.sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        )
      : sortByEngagement(scoredMentions);

  res.status(200).json({
    public_mentions: scoredMentions,
    brand_voice: brandVoiceTweets,
  });
}
