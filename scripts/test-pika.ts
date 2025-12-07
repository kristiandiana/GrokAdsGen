// Test script for Pika Labs video generation
import "dotenv/config";
import { generateVideo, getVideoStatus, waitForVideoCompletion, generateVideoAndWait } from "../lib/pikaClient";

async function testPikaClient() {
  console.log("🎬 Testing Pika Labs Video Generation\n");

  // Check for API key
  const apiKey = process.env.FAL_KEY || process.env.PIKA_API_KEY;
  if (!apiKey) {
    console.error("❌ FAL_KEY or PIKA_API_KEY environment variable is not set!");
    console.log("\nTo fix this:");
    console.log("1. Create a .env file in the project root (if it doesn't exist)");
    console.log("2. Add: FAL_KEY=your_fal_api_key_here");
    console.log("3. Get your API key from: https://fal.ai/");
    console.log("\nNote: Pika's official API is provided through Fal.ai");
    console.log("You can sign up and get your API key at https://fal.ai/dashboard/keys\n");
    process.exit(1);
  }

  console.log("✅ API key found in environment");
  console.log(`   API Base URL: ${process.env.PIKA_API_BASE || "https://fal.run"}\n`);

  // Test 1: Generate video (async - don't wait)
  console.log("Test 1: Starting video generation (async mode)...");
  console.log("   Note: If you get 403, the API endpoint or auth method may need adjustment");
  console.log("   Check Pika Labs documentation for the correct API endpoint and authentication\n");
  try {
    const testPrompt = "A sleek product showcase video with smooth camera movement, modern minimalist design, showcasing a premium product on a clean white background with subtle lighting effects";
    
    const videoResponse = await generateVideo(testPrompt, {
      aspect_ratio: "16:9",
      motion: 7,
    });

    console.log("✅ Video generation started!");
    console.log("   Video ID:", videoResponse.video_id);
    console.log("   Status:", videoResponse.status);
    console.log("   Video URL:", videoResponse.video_url || "Not available yet");
    console.log("   Thumbnail URL:", videoResponse.thumbnail_url || "Not available yet");
    console.log("");

    // Test 2: Check video status
    if (videoResponse.video_id) {
      console.log("Test 2: Checking video status...");
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      
      const status = await getVideoStatus(videoResponse.video_id);
      console.log("✅ Status check successful!");
      console.log("   Status:", status.status);
      console.log("   Progress:", status.progress ? `${status.progress}%` : "N/A");
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
    console.log("\nNote: Video generation is asynchronous. Use getVideoStatus() to poll for completion.");
    console.log("Or use generateVideoAndWait() to wait for completion automatically.");

  } catch (error) {
    console.error("❌ Test failed:", error);
    if (error instanceof Error) {
      console.error("   Error message:", error.message);
      
      // Provide helpful error messages
      if (error.message.includes("403")) {
        console.error("\n💡 This usually means:");
        console.error("   - Your FAL_KEY is invalid or expired");
        console.error("   - Your FAL_KEY doesn't have the required permissions");
        console.error("   - You may need credits in your Fal.ai account");
        console.error("\n   Check your .env file and verify your FAL_KEY");
        console.error("   Get a new key at: https://fal.ai/dashboard/keys");
      } else if (error.message.includes("401")) {
        console.error("\n💡 This usually means:");
        console.error("   - Your FAL_KEY is missing or incorrect");
        console.error("   - Check your .env file for FAL_KEY");
      } else if (error.message.includes("FAL_KEY") || error.message.includes("PIKA_API_KEY")) {
        console.error("\n💡 Make sure to set FAL_KEY in your .env file");
        console.error("   Get your API key from: https://fal.ai/dashboard/keys");
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

