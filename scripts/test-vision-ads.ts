import "dotenv/config";
import { generateAdIdeas } from '../lib/contentGeneration';
import type { Suggestion, BrandVoiceTweet } from '../lib/types/tweet';

// Mock Data with IMAGES
const mockSuggestion: Suggestion = {
  id: 'vision-test-1',
  title: 'Showcase Cybertruck Off-Road Capabilities',
  rationale: 'High interest in durability and off-road performance.',
  topic: 'performance',
  priority: 'high',
  suggested_copy: 'Built for any planet. Cybertruck tackles the toughest terrain with ease. #Cybertruck #OffRoad',
  tone: 'straightforward',
};

const mockVoiceSamples: BrandVoiceTweet[] = [
  { 
    id: 'v1', 
    text: 'Cybertruck in its natural habitat.', 
    created_at: new Date().toISOString(),
    media: [
      {
        type: 'photo',
        url: 'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Cybertruck-Main-Hero-Desktop.jpg', // Real Tesla image URL
        alt_text: 'Cybertruck driving on dirt terrain'
      }
    ]
  },
  { 
    id: 'v2', 
    text: 'Minimalist interior design.', 
    created_at: new Date().toISOString(),
    media: [
      {
        type: 'photo',
        url: 'https://digitalassets.tesla.com/tesla-contents/image/upload/h_1800,w_2880,c_fit,f_auto,q_auto:best/Model-3-Interior-Hero-Desktop-LHD', 
        alt_text: 'Model 3 interior white seats'
      }
    ]
  },
  { 
    id: 'v3', 
    text: 'Supercharging at sunset.', 
    created_at: new Date().toISOString(),
    // No media for this one
  }
];

async function testVisionAds() {
  console.log('🚀 Testing Multimodal Ad Generation (Vision + Text)...');
  console.log('   Input: 2 Tesla images + Voice Tweets');

  const { ads, images } = await generateAdIdeas({
    suggestion: mockSuggestion,
    voice_samples: mockVoiceSamples,
    brand_handle: 'Tesla',
  });

  if (ads.length === 0) {
    console.log('❌ No ads generated.');
    return;
  }

  console.log(`\n✅ Generated ${ads.length} Ad Ideas based on Visual Style:\n`);
  
  ads.forEach((ad, i) => {
    console.log(`${i+1}. [${ad.objective}] ${ad.headline}`);
    console.log(`   Image Prompt: ${ad.image_prompt}`);
    console.log(`   Resulting Image URL: ${images.find(img => img.ad_idea_id === ad.id)?.image_url || 'pending/failed'}`);
    console.log('---');
  });
}

testVisionAds().catch(console.error);

