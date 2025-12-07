import { generateSuggestions } from '../lib/suggestions';
import type { TopicSummary, BrandVoiceTweet } from '../lib/types/tweet';

const mockTopicSummaries: TopicSummary[] = [
  {
    topic: 'pricing',
    total: 68,
    positive: 19,
    neutral: 12,
    negative: 37,
    positive_pct: 28,
    sample_tweet_ids: ['1', '2', '3'],
    intensity_breakdown: { low: 10, medium: 18, high: 40 },
  },
  {
    topic: 'support', // Service Centers
    total: 42,
    positive: 15,
    neutral: 5,
    negative: 22,
    positive_pct: 35,
    sample_tweet_ids: ['4', '5', '6'],
    intensity_breakdown: { low: 5, medium: 20, high: 17 },
  },
  {
    topic: 'performance', // FSD/Acceleration
    total: 85,
    positive: 75,
    neutral: 5,
    negative: 5,
    positive_pct: 88,
    sample_tweet_ids: ['7', '8', '9'],
    intensity_breakdown: { low: 20, medium: 30, high: 35 },
  },
];

const mockVoiceSamples: BrandVoiceTweet[] = [
  { id: 'v1', text: 'Giga Berlin hits 4k/week production rate', created_at: new Date().toISOString() },
  { id: 'v2', text: 'Tesla AI Day scheduled for Sept 30', created_at: new Date().toISOString() },
  { id: 'v3', text: 'Supercharger network is open to non-Tesla EVs in select countries', created_at: new Date().toISOString() },
];

async function testSuggestions() {
  console.log('🚀 Testing generateSuggestions...\n');

  const suggestions = await generateSuggestions({
    topicSummaries: mockTopicSummaries,
    generalSentiment: { score: 65, label: 'positive' },
    voice_samples: mockVoiceSamples,
    brand_handle: 'Tesla',
  });

  if (suggestions.length === 0) {
    console.log('❌ No suggestions returned. Check logs for errors.');
    return;
  }

  console.log(`✅ Generated ${suggestions.length} suggestions:\n`);

  suggestions.forEach((s, i) => {
    console.log(`${i + 1}. [${s.priority.toUpperCase()}] ${s.title}`);
    console.log(`   Topic: ${s.topic}`);
    console.log(`   Rationale: ${s.rationale}`);
    console.log(`   Tone: ${s.tone}`);
    console.log(`   Suggested tweet:\n   "${s.suggested_copy}"\n`);
  });
}

testSuggestions().catch(console.error);