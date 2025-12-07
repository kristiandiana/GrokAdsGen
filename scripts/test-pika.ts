// Test script for Pika Labs video generation
import "dotenv/config";
import {
  generateVideo,
  getVideoStatus,
  waitForVideoCompletion,
  generateVideoAndWait,
} from "../lib/pikaClient";
import { generateVideoAdIdeas } from "../lib/contentGeneration";
import type { Suggestion, BrandVoiceTweet } from "../lib/types/tweet";

async function testPikaClient() {
  console.log("🎬 Testing Pika Labs Video Generation\n");

  // Check for API key
  const apiKey = process.env.FAL_KEY || process.env.PIKA_API_KEY;
  if (!apiKey) {
    console.error(
      "❌ FAL_KEY or PIKA_API_KEY environment variable is not set!"
    );
    console.log("\nTo fix this:");
    console.log(
      "1. Create a .env file in the project root (if it doesn't exist)"
    );
    console.log("2. Add: FAL_KEY=your_fal_api_key_here");
    console.log("3. Get your API key from: https://fal.ai/");
    console.log("\nNote: Pika's official API is provided through Fal.ai");
    console.log(
      "You can sign up and get your API key at https://fal.ai/dashboard/keys\n"
    );
    process.exit(1);
  }

  console.log("✅ API key found in environment");
  console.log(
    `   API Base URL: ${process.env.PIKA_API_BASE || "https://fal.run"}\n`
  );

  // Test 0: Generate video ad ideas for Tesla (using generateVideoAdIdeas)
  console.log(
    "Test 0: Generating Tesla short-form ad videos using generateVideoAdIdeas...\n"
  );
  try {
    const teslaSuggestion: Suggestion = {
      id: "test-tesla-video-1",
      title: "Create engaging short-form video ads for Tesla electric vehicles",
      rationale:
        "Generate cinematic video ads showcasing Tesla electric cars, Model Y, Model 3, Cybertruck, and Tesla's innovation in electric vehicle technology",
      topic: "brand_awareness",
      priority: "high",
      suggested_copy:
        "Experience the future of driving with Tesla. Electric. Powerful. Sustainable. 🚗⚡",
      tone: "promotional",
    };

    const teslaVoiceSamples: BrandVoiceTweet[] = [
      {
        id: "voice-1",
        text: "Model Y is the best-selling car in the world. Production is hard, prototypes are easy.",
        created_at: new Date().toISOString(),
        public_metrics: {
          like_count: 50000,
          retweet_count: 12000,
          reply_count: 3000,
          quote_count: 1500,
        },
      },
      {
        id: "voice-2",
        text: "FSD Beta 12.3 is mind-blowing. The future of autonomous driving is here.",
        created_at: new Date().toISOString(),
        public_metrics: {
          like_count: 35000,
          retweet_count: 8000,
          reply_count: 2000,
          quote_count: 1000,
        },
      },
      {
        id: "voice-3",
        text: "New Supercharger locations opening across Europe. Making long-distance travel seamless.",
        created_at: new Date().toISOString(),
        public_metrics: {
          like_count: 28000,
          retweet_count: 6000,
          reply_count: 1500,
          quote_count: 800,
        },
      },
    ];

    console.log("Input:");
    console.log("  Brand: Tesla (Electric Vehicle Company)");
    console.log("  Suggestion:", teslaSuggestion.title);
    console.log("  Voice Samples:", teslaVoiceSamples.length);
    console.log(
      "  Wait for Completion: true (waiting for all videos to complete)\n"
    );
    console.log(
      "⏳ This will take several minutes - generating 3 Tesla video ads...\n"
    );

    const result = await generateVideoAdIdeas({
      suggestion: teslaSuggestion,
      voice_samples: teslaVoiceSamples,
      brand_handle: "Tesla",
      waitForCompletion: true, // Wait for all videos to complete
    });

    console.log("✅ Video ad generation completed!");
    console.log(`   Generated ${result.ads.length} video ad ideas`);
    console.log(
      `   Completed ${
        result.videos.filter((v) => v.status === "completed").length
      } videos\n`
    );

    // Display all ads with their video URLs
    result.ads.forEach((ad, index) => {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📹 AD ${index + 1} - ${ad.objective.toUpperCase()}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`   Headline: ${ad.headline}`);
      console.log(`   Body: ${ad.body}`);
      console.log(`   CTA: ${ad.call_to_action}`);
      console.log(`   Hashtags: ${ad.hashtags.join(" ")}`);
      console.log(`   Video Status: ${ad.video_status || "unknown"}`);
      console.log(`   Video Prompt: ${ad.image_prompt}`);
      const video = result.videos.find((v) => v.ad_idea_id === ad.id);
      if (video?.video_url) {
        console.log(`   ✅ VIDEO URL: ${video.video_url}`);
      } else {
        console.log(`   ⏳ Video URL: ${video?.video_url || "Not ready yet"}`);
      }
      console.log("");
    });

    // Summary with all 3 video URLs
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎬 TESLA VIDEO ADS - FINAL RESULTS");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    const completedVideos = result.videos.filter(
      (v) => v.status === "completed" && v.video_url
    );
    if (completedVideos.length > 0) {
      console.log(
        `✅ Successfully generated ${completedVideos.length} Tesla video ads:\n`
      );
      completedVideos.forEach((video, index) => {
        const ad = result.ads.find((a) => a.id === video.ad_idea_id);
        console.log(`   Video ${index + 1} (${ad?.objective || "unknown"}):`);
        console.log(`   ${video.video_url}\n`);
      });
    } else {
      console.log("⚠️  No videos completed yet. Check status above.\n");
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  } catch (error) {
    console.error("❌ Tesla video ad generation test failed:", error);
    if (error instanceof Error) {
      console.error("   Error message:", error.message);
    }
    console.log("\nContinuing with other tests...\n");
  }

  // Test 1: Generate video (async - don't wait)
  console.log("Test 1: Starting video generation (async mode)...");
  console.log(
    "   Note: If you get 403, the API endpoint or auth method may need adjustment"
  );
  console.log(
    "   Check Pika Labs documentation for the correct API endpoint and authentication\n"
  );
  try {
    const testPrompt =
      "A sleek product showcase video with smooth camera movement, modern minimalist design, showcasing a premium product on a clean white background with subtle lighting effects";

    const videoResponse = await generateVideo(testPrompt, {
      aspect_ratio: "16:9",
      resolution: "720p",
      duration: 5,
    });

    console.log("✅ Video generation started!");
    console.log("   Video ID:", videoResponse.video_id);
    console.log("   Status:", videoResponse.status);
    console.log(
      "   Video URL:",
      videoResponse.video_url || "Not available yet"
    );
    console.log("");

    // Test 2: Check video status
    if (videoResponse.video_id) {
      console.log("Test 2: Checking video status...");
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds

      const status = await getVideoStatus(videoResponse.video_id);
      console.log("✅ Status check successful!");
      console.log("   Status:", status.status);
      console.log("   Video URL:", status.video_url || "Not ready yet");
      console.log("");
    }

    // Test 3: Wait for completion (optional - comment out if you don't want to wait)
    // Uncomment this if you want to test the full wait-for-completion flow
    /*
    console.log("Test 3: Waiting for video completion (this may take a while)...");
    try {
      const completedUrl = await waitForVideoCompletion(videoResponse.video_id, 30, 2000);
      console.log("✅ Video completed!");
      console.log("   Final Video URL:", completedUrl);
    } catch (err) {
      console.error("❌ Video completion error:", err);
    }
    */

    // Test 4: Generate and wait (convenience function)
    // Uncomment this if you want to test the full generate-and-wait flow
    /*
    console.log("\nTest 4: Generate video and wait for completion...");
    try {
      const videoUrl = await generateVideoAndWait(
        "A dynamic product reveal video with dramatic lighting and smooth transitions",
        {
          aspect_ratio: "16:9",
          motion: 8,
          maxAttempts: 30,
        }
      );
      console.log("✅ Video generated and completed!");
      console.log("   Video URL:", videoUrl);
    } catch (err) {
      console.error("❌ Generate and wait error:", err);
    }
    */

    console.log("\n✨ All tests completed!");
    console.log(
      "\nNote: Video generation is asynchronous. Use getVideoStatus() to poll for completion."
    );
    console.log(
      "Or use generateVideoAndWait() to wait for completion automatically."
    );
  } catch (error) {
    console.error("❌ Test failed:", error);
    if (error instanceof Error) {
      console.error("   Error message:", error.message);

      // Provide helpful error messages
      if (error.message.includes("403")) {
        console.error("\n💡 This usually means:");
        console.error("   - Your FAL_KEY is invalid or expired");
        console.error(
          "   - Your FAL_KEY doesn't have the required permissions"
        );
        console.error("   - You may need credits in your Fal.ai account");
        console.error("\n   Check your .env file and verify your FAL_KEY");
        console.error("   Get a new key at: https://fal.ai/dashboard/keys");
      } else if (error.message.includes("401")) {
        console.error("\n💡 This usually means:");
        console.error("   - Your FAL_KEY is missing or incorrect");
        console.error("   - Check your .env file for FAL_KEY");
      } else if (
        error.message.includes("FAL_KEY") ||
        error.message.includes("PIKA_API_KEY")
      ) {
        console.error("\n💡 Make sure to set FAL_KEY in your .env file");
        console.error(
          "   Get your API key from: https://fal.ai/dashboard/keys"
        );
      }
    }
    process.exit(1);
  }
}

// Run tests
testPikaClient()
  .then(() => {
    console.log("\n✅ Test script finished");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ Test script error:", err);
    process.exit(1);
  });
