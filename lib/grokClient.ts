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
    model: string = 'grok-4-1-fast-reasoning',
    jsonMode = true,
    temperature = 0
) {
    const grokClient = getClient();
    const response = await grokClient.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt}],
        temperature,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No content returned from Grok');
    }

    if (jsonMode) {
        try {
            // Clean up code fences if present
            let cleanContent = content.trim();
            if (cleanContent.startsWith('```json')) {
                cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (cleanContent.startsWith('```')) {
                cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }
            
            return JSON.parse(cleanContent);
        } catch (e) {
            console.error("Failed to parse JSON from Grok. Attempting repair...");
            // Simple repair attempt: Find first '{' and last '}'
            const start = content.indexOf('{');
            const end = content.lastIndexOf('}');
            if (start !== -1 && end !== -1) {
                try {
                    const jsonSubstr = content.substring(start, end + 1);
                    return JSON.parse(jsonSubstr);
                } catch (e2) {
                    console.error("Repair failed. Content snippet:", content.substring(0, 200) + "...");
                    throw new Error(`JSON Parse Error: ${e instanceof Error ? e.message : String(e)}`);
                }
            }
            throw e;
        }
    }

    return content;
}

export async function callGrokVision(prompt: string, imageUrl: string) {
  const grokClient = getClient();
  const response = await grokClient.chat.completions.create({
    model: "grok-2-vision-1212",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: imageUrl } },
        ],
      },
    ],
    temperature: 0.2,
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error("No description returned from Grok Vision");

  return content;
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

  if(!json.data || !json.data[0] || !json.data[0].url) {
      throw new Error('No image URL returned from Grok');
  }

  return {
      ad_idea_id: '',
      image_url: json.data[0].url,
      prompt_used: json.data[0].revised_prompt || prompt,
      generated_at: new Date().toISOString(),
      width: 1024,
      height: 1024,
  }
}
