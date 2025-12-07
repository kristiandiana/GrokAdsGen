import "dotenv/config";
import { createCampaignFromAdIdea } from "../lib/campaignAutomation";
import { AdIdea } from "../lib/types/tweet";

async function testCampaignAutomation() {
  console.log("🚀 Testing Campaign Automation Logic...");

  // Mock Ad Idea (what Grok would generate)
  const mockAdIdea: AdIdea = {
    id: "test-ad-123",
    headline: "Experience the Future Today",
    body: "Our new AI-driven solution changes everything. Join the revolution.",
    call_to_action: "Sign Up",
    hashtags: ["#FutureIsNow", "#AI"],
    image_prompt: "Futuristic city skyline with glowing blue nodes connected",
    format: "single_image",
    objective: "awareness",
    suggested_tweet_text: "Experience the Future Today. #FutureIsNow",
    bid_strategy: "AUTO",
    target_bid: 1500000,
    targeting: {
        keywords: ["AI", "Tech", "Future"],
        interests: ["Technology", "Startups"]
    }
  };

  console.log("📝 Mock Ad Idea:", JSON.stringify(mockAdIdea, null, 2));

  // Verify Environment
  if (!process.env.TWITTER_ADS_ACCOUNT_ID) {
    console.warn("\n⚠️  No TWITTER_ADS_ACCOUNT_ID found.");
    console.warn("   Forcing mock execution with a placeholder ID for demo purposes.");
    process.env.TWITTER_ADS_ACCOUNT_ID = "18ce54d4"; // Mock ID
  }

  // Attempt creation
  console.log("\nAttempting to create campaign structure...");
  const result = await createCampaignFromAdIdea(mockAdIdea);
  
  if (result.success) {
      console.log("\n✅ SUCCESS: Automated structure creation worked!");
      console.log("   (If this was a mock run, the ID will start with 'mock-')");
      console.log(`   Campaign ID: ${result.campaignId}`);
      console.log(`   Line Item ID: ${result.lineItemId}`);
  } else {
      console.log("\n❌ RESULT: Creation failed.");
      console.log("   Error:", result.error);
  }
}

testCampaignAutomation();
