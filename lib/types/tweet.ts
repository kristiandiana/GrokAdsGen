//what the people are saying about the brand
export type PublicMentionTweet = {
    id: string;
    text: string;
    author_id: string;
    created_at: string;
    public_metrics?: {
      like_count: number;
      retweet_count: number;
      reply_count: number;
      quote_count: number;
      impression_count?: number;
    };
  };
  
  export interface MediaObject {
    type: 'photo' | 'video' | 'animated_gif';
    url: string;
    alt_text: string | null;
    width?: number;
    height?: number;
    duration_ms?: number;
    variants?: Array<{ bitrate?: number; content_type: string; url: string }>;
  }

  //what the brand is saying about the brand
  export type BrandVoiceTweet = {
    id: string;
    text: string;
    created_at: string;
    author_id?: string;
    public_metrics?: { 
        like_count: number; 
        retweet_count: number;
        reply_count: number;
        quote_count: number;
        impression_count?: number;
    };
    media?: MediaObject[];

    isEdited?: boolean;
    isReply?: boolean;
    isQuote?: boolean;
    isRetweet?: boolean;
  };
  
  export type ScoredMention = PublicMentionTweet & {
    engagement_score: number;
  };

  // sentiment analysis of the public mention tweet
  export type AnnotatedMention = {
    tweet_id: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    sentiment_score: number;        // 0.00 – 1.00
    topics: string[];               // e.g. ['pricing', 'support']
    key_phrase: string | null;
    is_sarcasm: boolean;
    intensity: 'low' | 'medium' | 'high';
    analyzed_at: number;          // timestamp in ms
  };
  
  // one per topic
  export type TopicSummary = {
    topic: string;                
    total: number;
    positive: number;
    neutral: number;
    negative: number;
    positive_pct: number;
    sample_tweet_ids: string[];    
    intensity_breakdown: {
      low: number;
      medium: number;
      high: number;
    };
  };
  
  // suggestion for the brand to improve their brand voice
  export type Suggestion = {
    id: string;                     // uuid
    title: string;                  // "Fix slow checkout flow"
    rationale: string;              // "68 high-intensity negative tweets about speed"
    topic: string;
    priority: 'high' | 'medium' | 'low';
    suggested_copy: string;         // ≤280 chars
    tone: 'empathetic' | 'funny' | 'promotional' | 'straightforward';
  };
  
  // idea for the brand to improve their brand voice
  export type AdIdea = {
    id: string;
    headline: string;               // max ~50 chars
    body: string;                   // max ~200 chars
    call_to_action: string;         // "Shop Now", "Try Free", "Learn More", etc.
    hashtags: string[];
    image_prompt: string;          
    format: 'single_image' | 'carousel' | 'video';
    objective: 'awareness' | 'engagement' | 'conversions' | 'retention';
    suggested_tweet_text?: string;    
    
    // New fields for Ad Group automation
    bid_strategy?: 'AUTO' | 'MAX' | 'TARGET';
    target_bid?: number; // In micro-currency (e.g. 1000000 = 1.00)
    targeting?: {
      keywords?: string[];
      interests?: string[];
      locations?: string[]; // e.g. Country codes
      gender?: 'Male' | 'Female' | 'Any';
    };
  };

  export type VideoAdIdea = AdIdea & {
    video_prompt: string;
    video_url?: string;
    video_status?: "pending" | "processing" | "completed" | "failed";
    video_id?: string;
  };

  // generated image for the ad idea
  export type GeneratedImage = {
    ad_idea_id: string;                 
    image_url: string;               
    prompt_used: string;              
    generated_at: string;           
    width: number;            
    height: number;
    seed?: number;              
  };
