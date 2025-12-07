import type { NextApiRequest, NextApiResponse } from "next";
import { startPublicMentionStream } from "../../../lib/twitterClient";

let currentBrand: string | null = null;

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ ok: boolean; brand?: string; message: string }>
) {
  const brand = req.query.brand as string;

  if (!brand) {
    return res.status(400).json({ ok: false, message: "Missing brand query param" });
  }

  if (currentBrand === brand) {
    return res.status(200).json({ ok: true, brand, message: "Stream already running" });
  }

  console.log(`🔄 Switching stream to brand: ${brand}`);
  currentBrand = brand;
  startPublicMentionStream(brand);

  return res.status(200).json({ ok: true, brand, message: "Stream started" });
}
