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

export async function searchBrandVisualPosts(brand: string, limit = 20) {
  const query = `from:${brand} (has:images OR has:videos) -is:retweet lang:en`;
  const url = `${BASE_URL}?` +
    `query=${encodeURIComponent(query)}` +
    `&max_results=${limit}` +
    `&tweet.fields=public_metrics,created_at,attachments` +
    `&expansions=attachments.media_keys` +
    `&media.fields=type,url,preview_image_url,alt_text,width,height,duration_ms,variants`;

  return fetchTweetsWithMedia(url);
}

export async function searchBrandContext(brand: string, limitPerType = 15) {
  const [mentions, visualPosts] = await Promise.all([
    searchPublicMentions(brand, limitPerType),
    searchBrandVisualPosts(brand, limitPerType),
  ]);

  return {
    publicMentions: mentions,
    brandVisualPosts: visualPosts,
  };
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

async function fetchTweetsWithMedia(url: string): Promise<BrandVoiceTweet[]> {
  if (!BEARER_TOKEN) throw new Error("Missing X_BEARER_TOKEN");

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${BEARER_TOKEN}` },
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Twitter API error:", errorText);
    throw new Error("Twitter API call failed");
  }

  const json = await res.json();

  const tweets: BrandVoiceTweet[] = json.data || [];
  const mediaMap = new Map<string, any>();

  // Build media lookup map from expansions
  if (json.includes?.media) {
    json.includes.media.forEach((media: any) => {
      mediaMap.set(media.media_key, {
        type: media.type,
        url: media.url || media.preview_image_url,
        alt_text: media.alt_text || null,
        width: media.width,
        height: media.height,
        duration_ms: media.duration_ms,
        variants: media.variants,
      });
    });
  }

  // Attach media to tweets
  tweets.forEach((tweet: any) => {
    if (tweet.attachments?.media_keys) {
      tweet.media = tweet.attachments.media_keys.map((key: string) => mediaMap.get(key)!).filter(Boolean);
    } else {
      tweet.media = [];
    }
  });

  return tweets;
}