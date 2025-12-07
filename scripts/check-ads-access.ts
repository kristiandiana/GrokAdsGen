import "dotenv/config";
import { TwitterApi } from "twitter-api-v2";

async function checkAdsAccessBroadly() {
  console.log("🚀 Testing Broad Ads API Access...");

  const appKey = process.env.TWITTER_CONSUMER_KEY || process.env.X_CONSUMER_KEY;
  const appSecret = process.env.TWITTER_CONSUMER_SECRET || process.env.X_CONSUMER_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN || process.env.X_ACCESS_TOKEN;
  const accessSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET || process.env.X_ACCESS_TOKEN_SECRET;

  if (!appKey || !appSecret || !accessToken || !accessSecret) {
    console.error("❌ Missing keys in .env");
    return;
  }

  const client = new TwitterApi({
    appKey,
    appSecret,
    accessToken,
    accessSecret,
  });

  try {
    // Try to list accounts associated with the user
    // Endpoint: https://ads-api.twitter.com/12/accounts
    console.log("📡 Attempting to list ALL accessible Ad Accounts...");
    
    const result = await (client as any)._requestMaker.send({
        method: 'GET',
        url: 'https://ads-api.twitter.com/12/accounts',
    });

    if (result.data && Array.isArray(result.data)) {
        console.log(`\n✅ SUCCESS! You HAVE access to ${result.data.length} ad accounts.`);
        result.data.forEach((acc: any) => {
            console.log(`   - Account: ${acc.name} (ID: ${acc.id})`);
            // Check if this matches your .env
            if (acc.id === process.env.TWITTER_ADS_ACCOUNT_ID) {
                console.log("     (Matches your .env ID!)");
            }
        });
    } else {
        console.log("⚠️ Response received but format unexpected:", JSON.stringify(result));
    }

  } catch (err: any) {
    console.error("\n❌ FAILED. You likely do NOT have Ads API access yet.");
    console.error("   Error Code:", err.code);
    if (err.code === 403) {
        console.error("   Reason: 403 Forbidden (UNAUTHORIZED_CLIENT_APPLICATION)");
        console.error("   The app itself is not whitelisted for Ads API.");
    } else {
        console.error("   Message:", err.message);
    }
  }
}

checkAdsAccessBroadly();

