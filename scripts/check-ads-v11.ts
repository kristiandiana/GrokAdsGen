import { TwitterApi } from "twitter-api-v2";
import "dotenv/config";

async function checkAdsAccessV11() {
  console.log("🚀 Testing Ads API Access (v11 Endpoint)...");

  const appKey = process.env.TWITTER_CONSUMER_KEY || process.env.X_CONSUMER_KEY;
  const appSecret = process.env.TWITTER_CONSUMER_SECRET || process.env.X_CONSUMER_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN || process.env.X_ACCESS_TOKEN;
  const accessSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET || process.env.X_ACCESS_TOKEN_SECRET;
  const adsAccountId = process.env.TWITTER_ADS_ACCOUNT_ID || process.env.X_ADS_ACCOUNT_ID;

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
    // Try v11 endpoint for accounts
    // Endpoint: https://ads-api.twitter.com/11/accounts/{account_id}
    const endpoint = `https://ads-api.twitter.com/11/accounts/${adsAccountId}`;
    console.log(`📡 Hitting: ${endpoint}`);
    
    const result = await (client as any)._requestMaker.send({
        method: 'GET',
        url: endpoint,
    });

    console.log("✅ SUCCESS (v11)!", result.data?.name || result.data);

  } catch (err: any) {
    console.error("\n❌ FAILED (v11).");
    console.error("   Error Code:", err.code);
    if (err.code === 403) {
        console.error("   Reason: 403 Forbidden");
    } else {
        console.error("   Message:", err.message);
    }
  }
}

checkAdsAccessV11();

