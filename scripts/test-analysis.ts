import { analyzeMentions } from '../lib/sentimentAnalysis';
import type { PublicMentionTweet, BrandVoiceTweet } from '../lib/types/tweet';

const mentions: PublicMentionTweet[] = [
  { id: '1', text: 'Absolutely love my new Cybertruck, it drives like a tank but smoother!', author_id: 'u1', created_at: new Date().toISOString() },
  { id: '2', text: 'Why does FSD cost so much now? Feeling priced out.', author_id: 'u2', created_at: new Date().toISOString() },
  { id: '3', text: 'Service center fixed my door alignment in 5 minutes — legends!', author_id: 'u3', created_at: new Date().toISOString() },
  { id: '4', text: 'oh great another phantom braking incident nice work guys', author_id: 'u4', created_at: new Date().toISOString() }, // sarcasm
  { id: '5', text: 'MY SCREEN IS BLACK AND CAR WONT START FIX IT NOW', author_id: 'u5', created_at: new Date().toISOString() }, // high intensity
  { id: '6', text: 'supercharger works fine i guess', author_id: 'u6', created_at: new Date().toISOString() }, // neutral/low
  { id: '7', text: 'Model 3 pricing is totally fair for the value', author_id: 'u7', created_at: new Date().toISOString() },
  { id: '8', text: 'Regen braking was confusing at first but got it', author_id: 'u8', created_at: new Date().toISOString() },
  { id: '9', text: 'Keep getting panel gaps on delivery, very frustrating', author_id: 'u9', created_at: new Date().toISOString() },
  { id: '10', text: 'Best roadside assistance service I’ve ever had', author_id: 'u10', created_at: new Date().toISOString() },
];

const voice_samples: BrandVoiceTweet[] = [
  { id: 'v1', text: 'FSD Beta 12.3 rolling out to employees this weekend', created_at: new Date().toISOString() },
  { id: 'v2', text: 'Model Y is the best-selling car in the world', created_at: new Date().toISOString() },
];

async function test() {
  console.log('Testing analysis...\n');
  const result = await analyzeMentions(mentions, voice_samples);

  console.log(`GENERAL SENTIMENT: ${result.generalSentiment.score}/100 (${result.generalSentiment.label})\n`);
  
  console.log('TOP TOPICS:');
  result.topicSummaries.slice(0, 6).forEach(t => {
    console.log(`  • ${t.topic}: ${t.total} mentions | ${t.positive_pct}% positive | intensity H:${t.intensity_breakdown.high} M:${t.intensity_breakdown.medium} L:${t.intensity_breakdown.low}`);
  });

  console.log('\nSARCASM & INTENSITY CHECK:');
  const interesting = result.annotated.filter(a => a.is_sarcasm || a.intensity === 'high');
  interesting.forEach(a => {
    const text = mentions.find(m => m.id === a.tweet_id)?.text;
    console.log(`  "${text}" → ${a.sentiment} (sarcasm: ${a.is_sarcasm}, intensity: ${a.intensity})`);
  });
}

test().catch(console.error);