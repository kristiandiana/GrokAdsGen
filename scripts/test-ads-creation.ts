import "dotenv/config";
import { checkAdsAccountAccess, listFundingInstruments, createCampaign, createLineItem } from "../lib/adsClient";

async function testAdsCreation() {
  console.log("🚀 Testing Twitter Ads API Integration...");

  // 1. Check Access
  const hasAccess = await checkAdsAccountAccess();
  if (!hasAccess) {
    console.error("❌ Aborting test due to access failure.");
    return;
  }

  // 2. List Funding Instruments (Need one to create a campaign)
  console.log("\n💳 Fetching Funding Instruments...");
  const fundingInstruments = await listFundingInstruments();
  console.log(`   Found ${fundingInstruments.length} instruments.`);
  fundingInstruments.forEach((fi: any) => {
    console.log(`   - ID: ${fi.id} | Type: ${fi.type} | Status: ${fi.entity_status} | Description: ${fi.description || 'None'}`);
  });

  if (fundingInstruments.length === 0) {
    console.warn("⚠️ No funding instruments found. Cannot proceed to create campaign.");
    return;
  }

  const fundingId = process.env.TWITTER_FUNDING_INSTRUMENT_ID || fundingInstruments[0].id;
  console.log(`\nℹ️ Using Funding Instrument ID: ${fundingId}`);

  // ASK USER CONFIRMATION BEFORE CREATING REAL CAMPAIGNS?
  // For a script, we'll just log what we WOULD do unless a flag is passed, or try to create a paused one.
  // Let's try to create a PAUSED campaign as a safe test.
  
  if (process.argv.includes('--create')) {
    try {
      console.log("\n🆕 Attempting to create a PAUSED test campaign...");
      const campaignName = `GrokAdsGen Test ${new Date().toISOString()}`;
      const dailyBudget = 1000000; // 1.00 Currency Unit (micros)
      
      // Temporarily set the env var if not set, for the function to use
      process.env.TWITTER_FUNDING_INSTRUMENT_ID = fundingId;

      const campaign = await createCampaign(campaignName, dailyBudget);
      console.log("✅ Campaign Created:", campaign.data?.id, campaign.data?.name);

      if (campaign.data?.id) {
        console.log("\n🆕 Attempting to create a PAUSED test ad group (Line Item)...");
        const lineItemName = `GrokAdsGen Group ${new Date().toISOString()}`;
        const bidAmount = 100000; // 0.10 Currency Unit

        const lineItem = await createLineItem(campaign.data.id, lineItemName, bidAmount);
        console.log("✅ Line Item Created:", lineItem.data?.id, lineItem.data?.name);
      }

    } catch (err: any) {
      console.error("❌ Failed to create entities:", err.message || err);
      if (err.data) console.error("   API Error Data:", JSON.stringify(err.data, null, 2));
    }
  } else {
    console.log("\n⚠️ Run with --create to actually create a test campaign & ad group.");
  }
}

testAdsCreation();

