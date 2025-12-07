import { PublicMentionTweet } from "./tweets";
import { BRAND_STREAM_RULES } from "./queryStrategies";

const BEARER_TOKEN = process.env.X_BEARER_TOKEN;
const STREAM_URL =
  "https://api.twitter.com/2/tweets/search/stream?tweet.fields=author_id,public_metrics,created_at";

let mentionBuffer: (PublicMentionTweet & { _received_at: number })[] = [];

// Retention: 3 hours
const MAX_AGE_MS = 3 * 60 * 60 * 1000;

// Hard limit: prevent memory explosion if brand goes viral
const MAX_BUFFER_SIZE = 1200;

//--------------------------------------
// TTL Cleanup
//--------------------------------------
function cleanupBuffer() {
  const cutoff = Date.now() - MAX_AGE_MS;
  mentionBuffer = mentionBuffer.filter((t) => t._received_at > cutoff);

  if (mentionBuffer.length > MAX_BUFFER_SIZE) {
    mentionBuffer = mentionBuffer.slice(0, MAX_BUFFER_SIZE);
  }
}

//--------------------------------------
// Apply Filtered Stream Rules
//--------------------------------------
async function applyStreamRules(brand: string) {
  const rules = BRAND_STREAM_RULES(brand);

  await fetch("https://api.twitter.com/2/tweets/search/stream/rules", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${BEARER_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ add: rules }),
  });
}

//--------------------------------------
// Streaming Ingest
//--------------------------------------
export async function startPublicMentionStream(brand: string) {
  if (!BEARER_TOKEN) {
    console.error("❌ Missing X_BEARER_TOKEN. Streaming disabled.");
    return;
  }

  await applyStreamRules(brand);

  const res = await fetch(STREAM_URL, {
    headers: { Authorization: `Bearer ${BEARER_TOKEN}` },
  });

  if (!res.ok || !res.body) {
    console.error("❌ Stream failed:", await res.text());
    return;
  }

  console.log(`📡 Starting public mention stream for ${brand}`);

  const reader = res.body.getReader();
  let buffer = "";

  async function read() {
    const { done, value } = await reader.read();
    if (done) {
      console.warn("⚠️ Stream closed. Reconnecting in 3s…");
      setTimeout(() => startPublicMentionStream(brand), 3000);
      return;
    }

    buffer += new TextDecoder().decode(value);
    const parts = buffer.split("\r\n");
    buffer = parts.pop() || "";

    for (const part of parts) {
      if (!part.trim()) continue;

      try {
        const json = JSON.parse(part);
        const tweet = json.data as PublicMentionTweet;
        mentionBuffer.unshift({ ...tweet, _received_at: Date.now() });
        cleanupBuffer();
      } catch {
        // ignore parsing fragments
      }
    }

    read();
  }

  read();
}

//--------------------------------------
// Read-only Access to Buffer
//--------------------------------------
export function getLatestMentions(limit = 50): PublicMentionTweet[] {
  return mentionBuffer.slice(0, limit).map(({ _received_at, ...t }) => t);
}

export function getMentionCount() {
  return mentionBuffer.length;
}
