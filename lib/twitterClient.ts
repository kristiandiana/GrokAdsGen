import { PublicMentionTweet, BrandVoiceTweet } from "./types/tweet";
import { getBrandQueryStrategies } from "./queryStrategies";

const BEARER_TOKEN = process.env.X_BEARER_TOKEN;

// ----------------------------------------
// 1️⃣ Fetch Public Mentions (Holistic Sweep)
// ----------------------------------------
export async function fetchPublicMentions(
  brand: string,
  limit: number = 40
): Promise<PublicMentionTweet[]> {
  if (!BEARER_TOKEN) {
    console.warn("⚠️ Missing X_BEARER_TOKEN — returning empty.");
    return [];
  }

  const strategies = getBrandQueryStrategies(brand);
  const allResults = new Map<string, PublicMentionTweet>();

  for (const strategy of strategies) {
    const encodedQuery = encodeURIComponent(strategy);
    const url = `https://api.x.com/2/tweets/search/recent?query=${encodedQuery}&tweet.fields=author_id,public_metrics,created_at&max_results=10`;

    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${BEARER_TOKEN}` },
      });

      if (!res.ok) {
        console.error(`Query failed (${strategy}):`, await res.text());
        continue;
      }

      const data = await res.json();
      const tweets = (data.data || []) as PublicMentionTweet[];

      tweets.forEach((t) => allResults.set(t.id, t));

    } catch (err) {
      console.error(`Error in strategy "${strategy}":`, err);
    }
  }

  return Array.from(allResults.values()).slice(0, limit);
}

// ----------------------------------------
// 2️⃣ Fetch Brand Voice Tweets (Timeline)
// ----------------------------------------
async function fetchUserIdForBrand(brand: string): Promise<string | null> {
  const url = `https://api.x.com/2/users/by/username/${brand}`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${BEARER_TOKEN}` },
    });

    if (!res.ok) {
      console.error("User lookup failed:", await res.text());
      return null;
    }

    const data = await res.json();
    return data.data?.id || null;
  } catch (err) {
    console.error("User lookup error:", err);
    return null;
  }
}

export async function fetchBrandVoice(
  brand: string,
  limit = 20
): Promise<BrandVoiceTweet[]> {
  if (!BEARER_TOKEN) {
    console.warn("⚠️ Missing X_BEARER_TOKEN — returning empty.");
    return [];
  }

  const userId = await fetchUserIdForBrand(brand);
  if (!userId) return [];

  const url = `https://api.x.com/2/users/${userId}/tweets?tweet.fields=public_metrics,created_at&max_results=${limit}`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${BEARER_TOKEN}` },
    });

    if (!res.ok) {
      console.error("Brand voice fetch failed:", await res.text());
      return [];
    }

    const data = await res.json();
    return (data.data || []) as BrandVoiceTweet[];

  } catch (err) {
    console.error("Fetch brand voice error:", err);
    return [];
  }
}
