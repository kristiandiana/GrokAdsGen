import {
  PublicMentionTweet,
  BrandVoiceTweet
} from "./types/tweet";

import { buildQuery } from "./queryStrategies";

const BEARER_TOKEN = process.env.X_BEARER_TOKEN;

const BASE_URL = "https://api.twitter.com/2/tweets/search/recent";

export async function searchPublicMentions(brand: string, limit = 20) {
  const query = buildQuery(brand);
  const url = `${BASE_URL}?tweet.fields=author_id,public_metrics,created_at&max_results=${limit}&query=${encodeURIComponent(
    query
  )}`;

  return fetchTweets<PublicMentionTweet>(url);
}

// 🔥 NEW: Fetch tweets *by the brand itself*
export async function searchBrandVoiceTweets(brand: string, limit = 20) {
  const brandVoiceQuery = `from:${brand} -is:retweet lang:en`;
  const url = `${BASE_URL}?tweet.fields=public_metrics,created_at&max_results=${limit}&query=${encodeURIComponent(
    brandVoiceQuery
  )}`;

  return fetchTweets<BrandVoiceTweet>(url);
}

// Shared fetch helper
async function fetchTweets<T>(url: string): Promise<T[]> {
  if (!BEARER_TOKEN) throw new Error("Missing X_BEARER_TOKEN");

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${BEARER_TOKEN}` }
  });

  if (!res.ok) {
    console.error(await res.text());
    throw new Error("Twitter API call failed");
  }

  const json = await res.json();
  return (json.data || []) as T[];
}
