// Shared TypeScript types

export type Sentiment = "positive" | "negative" | "neutral";
export type Prominence = "high" | "medium" | "low";
export type AdFormat = "video" | "image" | "carousel" | "single image";

export interface Post {
  id: string;
  text: string;
  author: string;
  username: string;
  timestamp: string;
  retweets: number;
  likes?: number;
  sentiment: Sentiment;
}

export interface Ad {
  id: string;
  title: string;
  target: string;
  format: AdFormat;
  cta: string;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
}

export interface Topic {
  id: string;
  text: string;
  sentiment: Sentiment;
  prominence: Prominence;
  mentionCount: number;
  posts: Post[];
  ads: Ad[];
}

export interface Tweet {
  id: string;
  text: string;
  author: string;
  timestamp: string;
  engagement?: number;
}

export interface Insight {
  type: 'sentiment' | 'topic' | 'suggestion';
  title: string;
  description: string;
  priority?: 'high' | 'medium' | 'low';
}

export interface ContentGenerationRequest {
  prompt: string;
  type: 'meme' | 'ad';
}

export interface ContentGenerationResponse {
  content: string;
  imageUrl?: string;
  suggestions?: string[];
}

