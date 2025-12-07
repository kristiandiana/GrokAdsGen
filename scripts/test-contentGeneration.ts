// scripts/test-contentgen.ts
import { generateAdIdeas } from '../lib/contentGeneration';
import type { Suggestion, BrandVoiceTweet } from '../lib/types/tweet';

const mockSuggestion: Suggestion = {
  id: 'test-s1',
  title: 'Address FSD Beta Pricing Concerns',
  rationale: 'High negative sentiment (72%) around FSD subscription costs vs value. Users want more flexible options.',
  topic: 'pricing',
  priority: 'high',
  suggested_copy: 'FSD capability keeps evolving. We’re listening to your feedback on access options. More flexibility coming soon?',
  tone: 'straightforward',
};

const mockVoiceSamples: BrandVoiceTweet[] = [
  { id: 'v1', text: 'Tesla Model Y is the best-selling car in the world.', created_at: new Date().toISOString() },
  { id: 'v2', text: 'FSD Beta 12.3 is mind-blowing.', created_at: new Date().toISOString() },
  { id: 'v3', text: 'Production is hard, prototypes are easy.', created_at: new Date().toISOString() },
  { id: 'v4', text: 'New Supercharger locations open in Europe.', created_at: new Date().toISOString() },
  { id: 'v5', text: 'Cybertruck deliveries ramping up.', created_at: new Date().toISOString() },
];

async function testContentGen() {
  console.log('🚀 Generating 4 ad ideas + images for the suggestion...\n');

  const { ads, images } = await generateAdIdeas({
    suggestion: mockSuggestion,
    voice_samples: mockVoiceSamples,
    brand_handle: 'Tesla',
  });

  if (ads.length === 0) {
    console.log('❌ No ads generated. Check console for errors.');
    return;
  }

  console.log(`✅ Successfully generated ${ads.length} ad ideas!\n`);

  ads.forEach((ad, index) => {
    const img = images.find(i => i.ad_idea_id === ad.id);
    console.log(`${index + 1}. [${ad.objective.toUpperCase()}] ${ad.headline}`);
    console.log(`   Objective: ${ad.objective}`);
    console.log(`   Body: ${ad.body}`);
    console.log(`   CTA: ${ad.call_to_action} ${ad.hashtags.join(' ')}`);
    console.log(`   Tweet preview:\n   "${ad.suggested_tweet_text}"`);
    console.log(`   Image: ${img ? img.image_url : 'Failed to generate'}`);
    if (img) {
      console.log(`     Revised prompt: ${img.prompt_used}`);
    }
    console.log('---\n');
  });

  console.log(`Total images generated: ${images.length}`);
}

testContentGen().catch(err => {
  console.error('Test failed:', err);
});