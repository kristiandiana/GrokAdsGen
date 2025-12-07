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
    // Note: Content generation is now handled inside buildBrandInsights (in Phase 1) to support multiple topics.
    // We just need to check the results.
    console.log(`\n🧠 Phase 2: Content Generated (Ads: ${insights.generated_ads?.length || 0}, Images: ${insights.generated_images?.length || 0})`);

    // 3. Output the Resulting Data Model
    console.log("\n✅ Phase 3: Generated Ad Group Models:");
    
    // Log the actual keywords that triggered the generation
    if (insights.analysis && insights.analysis.topicSummaries) {
        console.log("\n🔑 Consolidate Keywords Used:");
        insights.analysis.topicSummaries.slice(0, 8).forEach(t => {
            console.log(`   - ${t.topic} (Count: ${t.total})`);
        });
    }

    const outputData: any = {
        timestamp: new Date().toISOString(),
        brand: BRAND,
        strategies: []
    };

    if (insights.generated_ad_groups && insights.generated_ad_groups.length > 0) {
        insights.generated_ad_groups.forEach((adGroup) => {
             // Find matching suggestion
             const suggestion = insights.suggestions.find(s => s.id === adGroup.suggestion_id) || insights.suggestions[0];

             // Find ads for this group
             const groupAds = insights.generated_ads?.filter(ad => adGroup.ads.some(ga => ga.id === ad.id)) || [];

             const strategyModel = {
                suggestion_topic: suggestion.topic,
                suggestion_title: suggestion.title,
                campaign: {
                    name: `[GrokAds] ${suggestion.topic}`,
                    daily_budget_micros: 1000000,
                    objective: 'AWARENESS',
                    entity_status: 'PAUSED'
                },
                line_item: {
                    name: adGroup.name,
                    product_type: "PROMOTED_TWEETS",
                    placements: ['ALL_ON_TWITTER'],
                    objective: 'AWARENESS',
                    bid_strategy: adGroup.bid_strategy,
                    bid_amount_micros: adGroup.bid_strategy === 'AUTO' ? null : adGroup.target_bid,
                    entity_status: 'PAUSED',
                    targeting_criteria: adGroup.targeting
                },
                creatives: groupAds.map(ad => ({
                    headline: ad.headline,
                    body: ad.body,
                    media_url: insights.generated_images?.find(img => img.ad_idea_id === ad.id)?.image_url,
                    prompt_used: ad.image_prompt,
                    call_to_action: ad.call_to_action
                }))
            };
            outputData.strategies.push(strategyModel);
        });
    }

    console.log(JSON.stringify(outputData, null, 2));

    // Save to file
    const outputPath = path.resolve(process.cwd(), "ad_strategy_output.json");
    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
    console.log(`\n💾 Full output saved to: ${outputPath}`);

  } catch (err) {
    console.error("❌ Pipeline Failed:", err);
  }
}

runTeslaPipeline();
