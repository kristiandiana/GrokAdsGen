import "dotenv/config";
import { TwitterApi } from 'twitter-api-v2';

async function checkRateLimits() {
  console.log('🚀 Checking Rate Limits & Access...');

  // Use the library which handles auth headers automatically
  const client = new TwitterApi(process.env.TWITTER_BEARER_TOKEN!);

  try {
    // This endpoint returns your current status for all rate limits
    // https://api.twitter.com/1.1/application/rate_limit_status.json
    const rateLimits = await client.v1.rateLimitStatus();
    
    console.log('✅ Access Confirmed! Here are your search limits:');
    
    const searchLimits = rateLimits.resources.search;
    console.log(JSON.stringify(searchLimits, null, 2));

  } catch (err: any) {
    console.error('❌ Failed to check limits:', err);
    if (err.data) console.error('   API Error Data:', JSON.stringify(err.data, null, 2));
  }
}

checkRateLimits();

