import { TwitterApi } from "twitter-api-v2";
import "dotenv/config";

const appKey = process.env.TWITTER_CONSUMER_KEY || process.env.X_CONSUMER_KEY || "";
const appSecret = process.env.TWITTER_CONSUMER_SECRET || process.env.X_CONSUMER_SECRET || "";
const accessToken = process.env.TWITTER_ACCESS_TOKEN || process.env.X_ACCESS_TOKEN || "";
const accessSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET || process.env.X_ACCESS_TOKEN_SECRET || "";
const adsAccountId = process.env.TWITTER_ADS_ACCOUNT_ID || process.env.X_ADS_ACCOUNT_ID || "";

if (!appKey || !appSecret || !accessToken || !accessSecret) {
  console.warn("⚠️ Missing Twitter OAuth 1.0a credentials in .env. Ads API will not work.");
}

const twitterClient = new TwitterApi({
  appKey,
  appSecret,
  accessToken,
  accessSecret,
});

export async function getMe() {
  return twitterClient.v2.me();
}

/**
 * Creates a new Campaign in the X Ads API.
 * Docs: https://developer.twitter.com/en/docs/twitter-ads/campaigns/api-reference/campaigns
 */
export async function createCampaign(name: string, dailyBudgetMicros: number, totalBudgetMicros?: number) {
  if (!adsAccountId) throw new Error("Missing TWITTER_ADS_ACCOUNT_ID");

  console.log(`Creating campaign '${name}' for account ${adsAccountId}...`);

  const endpoint = `https://ads-api.twitter.com/12/accounts/${adsAccountId}/campaigns`;
  
  const body = {
    name,
    funding_instrument_id: process.env.TWITTER_FUNDING_INSTRUMENT_ID,
    daily_budget_amount_local_micro: dailyBudgetMicros,
    start_time: new Date().toISOString(),
    entity_status: "PAUSED",
  };

  if (totalBudgetMicros) {
    Object.assign(body, { total_budget_amount_local_micro: totalBudgetMicros });
  }

  // Workaround: Use v2.post which normally prepends standard base URL.
  // We use `prefix: ''` and pass absolute URL if supported, or rely on internal _requestMaker if accessible.
  // Actually, twitter-api-v2 exposes .get(), .post() etc on v1/v2 clients.
  // But they enforce domains.
  
  // The only reliable way with this library version to hit a custom domain without hacking
  // is to use the undocumented `_requestMaker` property if available or `request` if public.
  // Since `client.request` didn't work, let's try `(client as any)._requestMaker.send`.
  // This is internal but often stable.
  
  try {
    const result = await (twitterClient as any)._requestMaker.send({
      method: 'POST',
      url: endpoint,
      body,
      headers: { 'Content-Type': 'application/json' }
    });
    return result;
  } catch (e: any) {
    // If _requestMaker is invalid, we might fallback or fail.
    console.error("Internal request failed", e);
    throw e;
  }
}

/**
 * Creates a Line Item (Ad Group) within a Campaign.
 */
export async function createLineItem(
  campaignId: string, 
  name: string, 
  bidAmountMicros?: number,
  bidStrategy: 'AUTO' | 'MAX' | 'TARGET' = 'AUTO'
) {
  if (!adsAccountId) throw new Error("Missing TWITTER_ADS_ACCOUNT_ID");
  
  const endpoint = `https://ads-api.twitter.com/12/accounts/${adsAccountId}/line_items`;
  
  const body: any = {
    campaign_id: campaignId,
    name,
    product_type: "PROMOTED_TWEETS",
    placements: ["ALL_ON_TWITTER"],
    objective: "AWARENESS", // This should ideally be passed in too, but sticking to simple refactor first
    entity_status: "PAUSED",
    bid_strategy: bidStrategy
  };

  if (bidStrategy !== 'AUTO' && bidAmountMicros) {
    body.bid_amount_local_micro = bidAmountMicros;
  }

  const result = await (twitterClient as any)._requestMaker.send({
    method: 'POST',
    url: endpoint,
    body,
    headers: { 'Content-Type': 'application/json' }
  });

  return result;
}

export async function checkAdsAccountAccess() {
  if (!adsAccountId) {
    console.error("❌ No TWITTER_ADS_ACCOUNT_ID found in environment.");
    return false;
  }
  
  try {
    const endpoint = `https://ads-api.twitter.com/12/accounts/${adsAccountId}`;
    
    // Using internal request maker to bypass base URL restriction
    const result = await (twitterClient as any)._requestMaker.send({
      method: 'GET',
      url: endpoint
    });
    
    // Result from send is usually { data: ..., headers: ... } or the raw body depending on config
    // Let's assume it returns the parsed body
    console.log("✅ Ads Account Access Confirmed:", result.data?.name || result.name || result.data);
    return true;
  } catch (err: any) {
    console.error("❌ Failed to access Ads Account:", err.message || err);
    if (err.code === 401) console.error("   Reason: Unauthorized. Check OAuth keys.");
    if (err.code === 403) console.error("   Reason: Forbidden. Check permissions for this account.");
    return false;
  }
}

export async function listFundingInstruments() {
  if (!adsAccountId) throw new Error("Missing TWITTER_ADS_ACCOUNT_ID");
  
  const endpoint = `https://ads-api.twitter.com/12/accounts/${adsAccountId}/funding_instruments`;
  
  try {
    const result = await (twitterClient as any)._requestMaker.send({
      method: 'GET',
      url: endpoint
    });
    return result.data || [];
  } catch (err) {
    console.error("Failed to list funding instruments:", err);
    return [];
  }
}
