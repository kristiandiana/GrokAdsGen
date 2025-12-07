import type { NextApiRequest, NextApiResponse } from "next";
import { buildBrandInsights } from "../../lib/sentimentPipeline";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const brand = (req.query.brand as string) || "tesla";

  try {
    const insights = await buildBrandInsights(brand);
    return res.status(200).json(insights);
  } catch (err: any) {
    console.error("[api/insights] Failed to build insights:", err);
    return res.status(500).json({ error: err?.message || "Unknown error" });
  }
}
