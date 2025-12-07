import {
  PublicMentionTweet,
  BrandVoiceTweet
} from "./types/tweet";

import { buildQuery } from "./queryStrategies";

const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN || process.env.X_BEARER_TOKEN;

const BASE_URL = "https://api.twitter.com/2/tweets/search/recent";

export async function searchPublicMentions(brand: string, limit = 50) {
  const query = buildQuery(brand);
  
  // We'll fetch in batches of 100 (max allowed per request)
  // And keep fetching until we have `targetFilteredCount` items or hit a safety limit.
  
  let allFilteredTweets: PublicMentionTweet[] = [];
  let nextToken: string | undefined = undefined;
  let requestCount = 0;
  
  // 100 requests * 100 tweets = 10,000 max raw tweets
  const MAX_REQUESTS = 100; 

  console.log(`[TwitterClient] Searching mentions for '${brand}'... Target: ${targetFilteredCount} HQ tweets.`);

  do {
    let url = `${BASE_URL}?` + 
      `query=${encodeURIComponent(query)}` + 
      `&max_results=100` + // Max allowed per page
      `&tweet.fields=author_id,public_metrics,created_at` +
      `&expansions=author_id` + 
      `&user.fields=public_metrics,username`;
    
    if (nextToken) {
        url += `&next_token=${nextToken}`;
    }

    try {
        const { tweets, next_token: newNextToken } = await fetchTweetsAndFilterChunk(url);
        
        allFilteredTweets = [...allFilteredTweets, ...tweets];
        nextToken = newNextToken;
        requestCount++;

        console.log(`[TwitterClient] Batch ${requestCount}: Found ${tweets.length} HQ tweets. Total: ${allFilteredTweets.length}`);

        if (allFilteredTweets.length >= targetFilteredCount) break;
        if (!nextToken) break;
        
        // Safety pause to avoid hitting rate limits too fast (1s delay)
        await new Promise(r => setTimeout(r, 1000));

    } catch (err) {
        console.error("Pagination error:", err);
        break;
    }

  } while (requestCount < MAX_REQUESTS);

  return allFilteredTweets;
}

// 🔥 NEW: Fetch tweets *by the brand itself*
export async function searchBrandVoiceTweets(brand: string, limit = 50) {
  const brandVoiceQuery = `from:${brand} -is:retweet lang:en`;
  const url = `${BASE_URL}?` +
    `query=${encodeURIComponent(brandVoiceQuery)}` +
    `&max_results=${limit}` + // For brand voice, we usually don't need 1000s, just enough for tone
    `&tweet.fields=public_metrics,created_at,attachments` +
    `&expansions=attachments.media_keys` +
    `&media.fields=type,url,preview_image_url,alt_text,width,height,duration_ms,variants`;

  return fetchTweetsWithMedia(url);
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
  // If user requested massive scale, we'll try to get 10,000 raw tweets (which yields fewer filtered)
  // Or we can set targetFilteredCount to 1000 if we want 1000 *good* tweets.
  const targetCount = 10000; 
  
  const [mentions, visualPosts] = await Promise.all([
    searchPublicMentions(brand, targetCount), 
    searchBrandVisualPosts(brand, limitPerType),
  ]);

  return {
    publicMentions: mentions,
    brandVisualPosts: visualPosts,
  };
}

// Helper to filter by follower count for ONE chunk
async function fetchTweetsAndFilterChunk(url: string): Promise<{ tweets: PublicMentionTweet[], next_token?: string }> {
  if (!BEARER_TOKEN) throw new Error("Missing X_BEARER_TOKEN");

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${BEARER_TOKEN}` }
  });

  if (!res.ok) {
    if (res.status === 429) {
        console.warn("⚠️ Rate limit hit! Waiting 60s...");
        await new Promise(r => setTimeout(r, 60000));
        // Retry once
        return fetchTweetsAndFilterChunk(url);
    }
    throw new Error(`Twitter API call failed: ${res.status}`);
  }

  const json = await res.json();
  const tweets = json.data || [];
  const users = json.includes?.users || [];
  const next_token = json.meta?.next_token;

  // Create a map of User ID -> Follower Count
  const userMap = new Map<string, number>();
  users.forEach((u: any) => {
    userMap.set(u.id, u.public_metrics?.followers_count || 0);
  });

  // Filter tweets where author has > 1000 followers
  const filteredTweets = tweets.filter((t: any) => {
    const followers = userMap.get(t.author_id) || 0;
    return followers >= 1000;
  });

  return { tweets: filteredTweets as PublicMentionTweet[], next_token };
}

// Shared fetch helper for simple/media tweets
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
