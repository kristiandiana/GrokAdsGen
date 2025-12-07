import "dotenv/config";
import OpenAI from "openai";
import { GeneratedImage } from "./types/tweet";

// Lazy initialization to avoid errors if XAI_API_KEY is missing
let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!process.env.XAI_API_KEY) {
    throw new Error(
      "XAI_API_KEY is required. Set it in your .env file. Get your key from: https://x.ai/api"
    );
  }
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.XAI_API_KEY,
      baseURL: "https://api.x.ai/v1",
    });
  }
  return client;
}

interface ImageGenerationResponse {
  data: {
    url?: string;
    b64_json?: string;
    revised_prompt?: string;
  }[];
  created: number;
}

export async function callGrok(
  prompt: string,
  model: "grok-4-1-fast-reasoning",
  jsonMode = true,
  temperature = 0
) {
  const grokClient = getClient();
  const response = await grokClient.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
    temperature,
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error("No content returned from Grok");
  }

  return jsonMode ? JSON.parse(content.trim()) : content;
}

export async function generateImage(prompt: string): Promise<GeneratedImage> {
  const response = await fetch("https://api.x.ai/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.XAI_API_KEY}`,
    },
    body: JSON.stringify({
      prompt,
      model: "grok-imagine-v0p9",
      n: 1,
      quality: "high",
      response_format: "url",
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Failed to generate image: ${err}`);
  }

  const json = (await response.json()) as ImageGenerationResponse;

  if (!json.data[0].url) {
    throw new Error("No image URL returned from Grok");
  }

  return {
    ad_idea_id: "",
    image_url: json.data[0].url,
    prompt_used: json.data[0].revised_prompt || prompt,
    generated_at: new Date().toISOString(),
    width: 1024,
    height: 1024,
  };
}
