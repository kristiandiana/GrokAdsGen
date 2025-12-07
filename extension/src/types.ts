// Shared TypeScript types

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

