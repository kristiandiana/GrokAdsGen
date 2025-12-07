import { NextApiRequest, NextApiResponse } from "next";
import { createCampaignFromAdIdea } from "../../../lib/campaignAutomation";
import { AdIdea } from "../../../lib/types/tweet";

/**
 * API Endpoint to Create a Campaign + Ad Group from an Ad Idea.
 * POST /api/campaign/create
 * Body: { adIdea: AdIdea, dailyBudgetMicros?: number }
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { adIdea, dailyBudgetMicros } = req.body;

  if (!adIdea || !adIdea.headline) {
    return res.status(400).json({ error: "Missing valid AdIdea object" });
  }

  try {
    console.log(`[API] Received request to create campaign for: "${adIdea.headline}"`);

    // Call the automation logic
    const result = await createCampaignFromAdIdea(
      adIdea as AdIdea,
      undefined, // Image handling can be added later if we pass image data
      dailyBudgetMicros || 1000000 // Default 1.00 currency unit
    );

    if (result.success) {
      return res.status(200).json({
        success: true,
        data: {
          campaignId: result.campaignId,
          lineItemId: result.lineItemId,
          message: result.message
        }
      });
    } else {
      // Logic failure (e.g. API error that wasn't mocked)
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error: any) {
    console.error("[API] Campaign creation failed:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal Server Error"
    });
  }
}

