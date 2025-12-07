import "dotenv/config";
import fs from "fs";
import path from "path";
import { buildBrandInsights } from "../lib/sentimentPipeline";
import { generateAdIdeas } from "../lib/contentGeneration";

async function runTeslaPipeline() {
  const BRAND = "Tesla";
  console.log(`🚀 Starting Full Pipeline for: ${BRAND}`);

  try {
    // 1. Build Insights (Fetch -> Analyze -> Suggest)
    console.log("\n📡 Phase 1: Fetching & Analyzing Data (Target: 1000 HQ Tweets)...");
    const insights = await buildBrandInsights(BRAND);
    
    if (!insights.suggestions || insights.suggestions.length === 0) {
        console.error("❌ No suggestions generated.");
        return;
    }

    const topSuggestion = insights.suggestions[0];
    console.log(`\n💡 Top Suggestion: "${topSuggestion.title}"`);
    console.log(`   Rationale: ${topSuggestion.rationale}`);

    // 2. Generate Content & Strategy
    console.log("\n🧠 Phase 2: Generating Content & Ad Strategy...");
    const creativeResult = await generateAdIdeas({
        suggestion: topSuggestion,
        voice_samples: insights.brand_voice,
        brand_handle: BRAND
    });

    // 3. Output the Resulting Data Model
    console.log("\n✅ Phase 3: Generated Ad Group Models:");
    
    const outputData: any = {
        timestamp: new Date().toISOString(),
        brand: BRAND,
        suggestion: topSuggestion,
        ads: []
    };

    creativeResult.ads.forEach((ad, i) => {
        // Construct the full API data model
        const apiModel = {
            campaign: {
                name: `[GrokAds] ${ad.headline}`,
                daily_budget_micros: 1000000,
                objective: ad.objective === 'awareness' ? 'AWARENESS' : 'TWEET_ENGAGEMENTS',
                entity_status: 'PAUSED'
            },
            line_item: {
                name: `Targeting: ${ad.targeting?.keywords?.slice(0,2).join(' ')}`,
                product_type: "PROMOTED_TWEETS",
                placements: ['ALL_ON_TWITTER'],
                objective: ad.objective === 'awareness' ? 'AWARENESS' : 'TWEET_ENGAGEMENTS',
                bid_strategy: ad.bid_strategy,
                bid_amount_micros: ad.bid_strategy === 'AUTO' ? null : ad.target_bid,
                entity_status: 'PAUSED',
                targeting_criteria: ad.targeting
            },
            creative: {
                headline: ad.headline,
                body: ad.body,
                media_url: creativeResult.images.find(img => img.ad_idea_id === ad.id)?.image_url,
                prompt_used: ad.image_prompt
            }
        };
        
        outputData.ads.push(apiModel);

        console.log(`\n--- Ad Idea #${i + 1} ---`);
        console.log(JSON.stringify(apiModel, null, 2));
    });

    // Save to file
    const outputPath = path.resolve(process.cwd(), "ad_strategy_output.json");
    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
    console.log(`\n💾 Full output saved to: ${outputPath}`);

  } catch (err) {
    console.error("❌ Pipeline Failed:", err);
  }
}

runTeslaPipeline();
