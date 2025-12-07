// Pika Labs video generation via Fal.ai
import { fal } from "@fal-ai/client";

// Configure API key
if (process.env.FAL_KEY) {
  fal.config({
    credentials: process.env.FAL_KEY,
  });
} else if (process.env.PIKA_API_KEY) {
  fal.config({
    credentials: process.env.PIKA_API_KEY,
  });
}

interface GenerateVideoOptions {
  aspect_ratio?: "16:9" | "9:16" | "1:1" | "4:5" | "5:4" | "3:2" | "2:3";
  resolution?: "720p" | "1080p";
  duration?: 5 | 10;
  seed?: number;
  negative_prompt?: string;
}

/**
 * Generate a video from a text prompt using Pika Labs via Fal.ai
 * @param prompt - Text description of the video to generate
 * @param options - Optional video generation parameters
 * @returns Promise with video URL
 */
export async function generateVideo(
  prompt: string,
  options: GenerateVideoOptions = {}
): Promise<{ video_id: string; video_url: string; status: "completed" }> {
  if (!process.env.FAL_KEY && !process.env.PIKA_API_KEY) {
    throw new Error(
      "FAL_KEY or PIKA_API_KEY environment variable is not set. Get your API key from https://fal.ai/"
    );
  }

  try {
    const result = await fal.subscribe("fal-ai/pika/v2.2/text-to-video", {
      input: {
        prompt: prompt.trim(),
        aspect_ratio: options.aspect_ratio || "16:9",
        resolution: options.resolution || "720p",
        duration: options.duration || 5,
        ...(options.seed !== undefined && { seed: options.seed }),
        ...(options.negative_prompt && {
          negative_prompt: options.negative_prompt,
        }),
      },
    });

    if (!result.data?.video?.url) {
      throw new Error("No video URL returned from Pika API");
    }

    return {
      video_id: result.requestId || "completed",
      video_url: result.data.video.url,
      status: "completed",
    };
  } catch (error) {
    console.error("Pika video generation error:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to generate video with Pika Labs");
  }
}

/**
 * Generate video asynchronously (submit and return request ID)
 * @param prompt - Text description of the video to generate
 * @param options - Optional video generation parameters
 * @returns Promise with request ID
 */
export async function generateVideoAsync(
  prompt: string,
  options: GenerateVideoOptions = {}
): Promise<{ video_id: string; status: "pending" }> {
  if (!process.env.FAL_KEY && !process.env.PIKA_API_KEY) {
    throw new Error(
      "FAL_KEY or PIKA_API_KEY environment variable is not set. Get your API key from https://fal.ai/"
    );
  }

  try {
    const { request_id } = await fal.queue.submit(
      "fal-ai/pika/v2.2/text-to-video",
      {
        input: {
          prompt: prompt.trim(),
          aspect_ratio: options.aspect_ratio || "16:9",
          resolution: options.resolution || "720p",
          duration: options.duration || 5,
          ...(options.seed !== undefined && { seed: options.seed }),
          ...(options.negative_prompt && {
            negative_prompt: options.negative_prompt,
          }),
        },
      }
    );

    return {
      video_id: request_id,
      status: "pending",
    };
  } catch (error) {
    console.error("Pika video generation error:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to submit video generation request");
  }
}

/**
 * Check the status of a video generation job
 * @param videoId - The request ID returned from generateVideoAsync
 * @returns Promise with current video status and URL if completed
 */
export async function getVideoStatus(videoId: string): Promise<{
  video_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  video_url?: string;
}> {
  if (!process.env.FAL_KEY && !process.env.PIKA_API_KEY) {
    throw new Error("FAL_KEY or PIKA_API_KEY environment variable is not set");
  }

  try {
    const status = await fal.queue.status("fal-ai/pika/v2.2/text-to-video", {
      requestId: videoId,
    });

    const statusMap: {
      [key: string]: "pending" | "processing" | "completed" | "failed";
    } = {
      IN_QUEUE: "pending",
      IN_PROGRESS: "processing",
      COMPLETED: "completed",
      FAILED: "failed",
    };

    const mappedStatus = statusMap[status.status] || "pending";

    // If completed, get the result
    let videoUrl: string | undefined;
    if (mappedStatus === "completed") {
      const result = await fal.queue.result("fal-ai/pika/v2.2/text-to-video", {
        requestId: videoId,
      });
      videoUrl = result.data?.video?.url;
    }

    return {
      video_id: videoId,
      status: mappedStatus,
      video_url: videoUrl,
    };
  } catch (error) {
    console.error("Pika video status check error:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to check video status");
  }
}

/**
 * Wait for video completion with polling
 * @param videoId - The request ID to poll
 * @param maxAttempts - Maximum number of polling attempts (default: 60)
 * @param delay - Delay between polls in milliseconds (default: 2000)
 * @returns Promise with completed video URL
 */
export async function waitForVideoCompletion(
  videoId: string,
  maxAttempts: number = 60,
  delay: number = 2000
): Promise<string> {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const status = await getVideoStatus(videoId);

    if (status.status === "completed" && status.video_url) {
      return status.video_url;
    }

    if (status.status === "failed") {
      throw new Error(`Video generation failed for request_id: ${videoId}`);
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
    attempts++;
  }

  throw new Error(
    `Video generation timed out after ${maxAttempts} attempts for request_id: ${videoId}`
  );
}
