// Test script for video ad generation
import "dotenv/config";
import { generateVideoAdIdeas } from "../lib/contentGeneration";
import type { Suggestion, BrandVoiceTweet } from "../lib/types/tweet";

async function testVideoAdGeneration() {
  console.log("🎬 Testing Video Ad Generation\n");

  // Mock suggestion
  const mockSuggestion: Suggestion = {
    id: "test-suggestion-1",
    title: "Address Shipping Concerns",
    rationale: "68 high-intensity negative tweets about shipping speed",
    topic: "shipping",
    priority: "high",
    suggested_copy: "We hear you! We're working hard to improve shipping times. Your feedback drives us forward. 🚀",
    tone: "empathetic",
  };

  // Mock brand voice tweets
  const mockVoiceSamples: BrandVoiceTweet[] = [
    {
      id: "voice-1",
      text: "Excited to announce our new collection! Check it out 👀",
      created_at: "2024-01-15T10:00:00Z",
      public_metrics: {
        like_count: 120,
        retweet_count: 45,
        reply_count: 12,
        quote_count: 8,
      },
    },
    {
      id: "voice-2",
      text: "Thank you for your patience as we work to improve! Your feedback means everything 💙",
      created_at: "2024-01-14T15:30:00Z",
      public_metrics: {
        like_count: 89,
        retweet_count: 23,
        reply_count: 15,
        quote_count: 5,
      },
    },
  ];

  const brandHandle = "@testbrand";

  console.log("Input:");
  console.log("  Suggestion:", mockSuggestion.title);
  console.log("  Brand Handle:", brandHandle);
  console.log("  Voice Samples:", mockVoiceSamples.length);
  console.log("");

  // Test 1: Generate video ads (async - don't wait for completion)
  console.log("Test 1: Generating video ad ideas (async mode)...");
  try {
    const result = await generateVideoAdIdeas({
      suggestion: mockSuggestion,
      voice_samples: mockVoiceSamples,
      brand_handle: brandHandle,
      waitForCompletion: false, // Start generation but don't wait
    });

    console.log("✅ Video ad generation started!");
    console.log(`   Generated ${result.ads.length} video ad ideas`);
    console.log(`   Started ${result.videos.length} video generations`);
    console.log("");

    result.ads.forEach((ad, index) => {
      console.log(`   Ad ${index + 1}:`);
      console.log(`     Headline: ${ad.headline}`);
      console.log(`     Objective: ${ad.objective}`);
      console.log(`     Format: ${ad.format}`);
      console.log(`     Video Status: ${ad.video_status || "unknown"}`);
      console.log(`     Video ID: ${ad.video_id || "N/A"}`);
      console.log(`     Video URL: ${ad.video_url || "Processing..."}`);
      console.log("");
    });

    result.videos.forEach((video, index) => {
      console.log(`   Video ${index + 1}:`);
      console.log(`     Status: ${video.status}`);
      console.log(`     Video ID: ${video.video_id}`);
      console.log(`     Video URL: ${video.video_url || "Not ready yet"}`);
      console.log(`     Thumbnail: ${video.thumbnail_url || "Not available"}`);
      console.log("");
    });

    console.log("\n💡 Tip: Use getVideoStatus() from pikaClient to poll for completion");
    console.log("   Or set waitForCompletion: true to wait automatically");

  } catch (error) {
    console.error("❌ Test failed:", error);
    if (error instanceof Error) {
      console.error("   Error message:", error.message);
    }
    process.exit(1);
  }

  // Test 2: Generate and wait for completion (optional - uncomment to test)
  /*
  console.log("\nTest 2: Generating video ads (waiting for completion)...");
  console.log("⚠️  This will take several minutes - videos need time to generate\n");
  
  try {
    const result = await generateVideoAdIdeas({
      suggestion: mockSuggestion,
      voice_samples: mockVoiceSamples,
      brand_handle: brandHandle,
      waitForCompletion: true, // Wait for all videos to complete
    });

    console.log("✅ Video ad generation completed!");
    console.log(`   Generated ${result.ads.length} video ad ideas`);
    console.log(`   Completed ${result.videos.filter(v => v.status === 'completed').length} videos`);
    console.log("");

    result.ads.forEach((ad, index) => {
      console.log(`   Ad ${index + 1}:`);
      console.log(`     Headline: ${ad.headline}`);
      console.log(`     Video URL: ${ad.video_url || "Failed"}`);
      console.log(`     Status: ${ad.video_status}`);
      console.log("");
    });

  } catch (error) {
    console.error("❌ Test failed:", error);
    if (error instanceof Error) {
      console.error("   Error message:", error.message);
    }
  }
  */

  console.log("\n✨ Test completed!");
}

// Run tests
testVideoAdGeneration()
  .then(() => {
    console.log("\n✅ Test script finished");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ Test script error:", err);
    process.exit(1);
  });

