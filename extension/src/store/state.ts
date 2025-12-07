// State management for BrandPulse dashboard
// Lightweight state manager with observer pattern for reactive UI updates

import { Topic, Post, Ad, Sentiment, Prominence } from "../types";
import { fetchTopics, fetchInsights as fetchInsightsApi } from "../utils/api";

interface PublicMetrics {
  like_count?: number;
  retweet_count?: number;
  reply_count?: number;
  quote_count?: number;
  impression_count?: number;
}

interface PublicMention {
  id: string;
  text: string;
  author_id?: string;
  created_at?: string;
  public_metrics?: PublicMetrics;
}

interface BrandVoiceTweet {
  id: string;
  text: string;
  created_at: string;
  public_metrics?: PublicMetrics;
  isEdited?: boolean;
  isReply?: boolean;
  isQuote?: boolean;
  isRetweet?: boolean;
}

interface AnnotatedMention {
  tweet_id: string;
  sentiment: Sentiment;
  sentiment_score: number;
  topics: string[];
  key_phrase: string | null;
  is_sarcasm: boolean;
  intensity: "low" | "medium" | "high";
  analyzed_at: number;
}

interface TopicSummary {
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
}

interface Suggestion {
  id: string;
  title: string;
  rationale: string;
  topic: string;
  priority: "high" | "medium" | "low";
  suggested_copy: string;
  tone: "empathetic" | "funny" | "promotional" | "straightforward";
}

interface AnalysisResponse {
  annotated: AnnotatedMention[];
  topicSummaries: TopicSummary[];
  generalSentiment: {
    score: number;
    label: "very negative" | "negative" | "neutral" | "positive" | "very positive";
  };
}

interface BrandInsights {
  brand: string;
  public_mentions: PublicMention[];
  brand_voice: BrandVoiceTweet[];
  analysis: AnalysisResponse;
  suggestions: Suggestion[];
  actionable_steps?: Record<string, string>;
  generated_ads?: Array<{
    id: string;
    headline: string;
    body: string;
    call_to_action: string;
    hashtags: string[];
    format: string;
    objective: string;
    image_prompt?: string;
    suggested_tweet_text?: string;
  }>;
  generated_images?: Array<{
    ad_idea_id: string;
    image_url: string;
    prompt_used?: string;
    generated_at?: string;
  }>;
  generated_video_ads?: Array<{
    id: string;
    headline: string;
    body: string;
    call_to_action: string;
    hashtags: string[];
    format: string;
    objective: string;
    image_prompt?: string;
    suggested_tweet_text?: string;
    video_url?: string;
    video_id?: string;
    video_status?: "pending" | "processing" | "completed" | "failed";
  }>;
  generated_videos?: Array<{
    ad_idea_id: string;
    video_id: string;
    video_url?: string;
    status: "pending" | "processing" | "completed" | "failed";
    thumbnail_url?: string;
  }>;
}

type StateListener = (state: AppState) => void;

export interface AppState {
  topics: Topic[];
  posts: Post[];
  ads: Ad[];
  insights: BrandInsights | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

class StateManager {
  private state: AppState = {
    topics: [],
    posts: [],
    ads: [],
    insights: null,
    loading: false,
    error: null,
    lastUpdated: null,
  };

  private listeners: Set<StateListener> = new Set();

  // Get current state (returns a copy to prevent direct mutations)
  getState(): AppState {
    return { ...this.state };
  }

  // Get specific parts of state
  getTopics(): Topic[] {
    return [...this.state.topics];
  }

  getPosts(): Post[] {
    return [...this.state.posts];
  }

  getAds(): Ad[] {
    return [...this.state.ads];
  }

  isLoading(): boolean {
    return this.state.loading;
  }

  getError(): string | null {
    return this.state.error;
  }

  getInsights(): BrandInsights | null {
    return this.state.insights ? { ...this.state.insights } : null;
  }

  // Subscribe to state changes
  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    // Return unsubscribe function
    return () => this.listeners.delete(listener);
  }

  // Update state and notify all listeners
  private setState(updates: Partial<AppState>): void {
    this.state = { ...this.state, ...updates };
    // Notify all listeners with a copy of the state
    this.listeners.forEach((listener) => listener(this.getState()));
  }

  // Set topics (and automatically extract posts/ads)
  setTopics(topics: Topic[]): void {
    const posts = topics.flatMap((t) => t.posts);
    const ads = topics.flatMap((t) => t.ads);
    this.setState({
      topics: [...topics],
      posts: [...posts],
      ads: [...ads],
      lastUpdated: new Date(),
      error: null,
    });
  }

  // Update a specific topic
  updateTopic(topicId: string, updates: Partial<Topic>): void {
    const topics = this.state.topics.map((t) =>
      t.id === topicId ? { ...t, ...updates } : t
    );
    // Re-extract posts and ads after topic update
    const posts = topics.flatMap((t) => t.posts);
    const ads = topics.flatMap((t) => t.ads);
    this.setState({ topics, posts, ads });
  }

  // Add a new topic
  addTopic(topic: Topic): void {
    const topics = [...this.state.topics, topic];
    const posts = topics.flatMap((t) => t.posts);
    const ads = topics.flatMap((t) => t.ads);
    this.setState({ topics, posts, ads });
  }

  // Remove a topic
  removeTopic(topicId: string): void {
    const topics = this.state.topics.filter((t) => t.id !== topicId);
    const posts = topics.flatMap((t) => t.posts);
    const ads = topics.flatMap((t) => t.ads);
    this.setState({ topics, posts, ads });
  }

  // Add a post to a topic
  addPostToTopic(topicId: string, post: Post): void {
    const topics = this.state.topics.map((t) =>
      t.id === topicId
        ? { ...t, posts: [...t.posts, post], mentionCount: t.posts.length + 1 }
        : t
    );
    const posts = topics.flatMap((t) => t.posts);
    this.setState({ topics, posts });
  }

  // Add an ad to a topic
  addAdToTopic(topicId: string, ad: Ad): void {
    const topics = this.state.topics.map((t) =>
      t.id === topicId ? { ...t, ads: [...t.ads, ad] } : t
    );
    const ads = topics.flatMap((t) => t.ads);
    this.setState({ topics, ads });
  }

  // Set loading state
  setLoading(loading: boolean): void {
    this.setState({ loading });
  }

  // Set error state
  setError(error: string | null): void {
    this.setState({ error });
  }

  // Clear all state
  clear(): void {
    this.setState({
      topics: [],
      posts: [],
      ads: [],
      insights: null,
      loading: false,
      error: null,
      lastUpdated: null,
    });
  }

  // Fetch topics from API (to be called from content script)
  async fetchTopicsFromAPI(brand?: string): Promise<void> {
    this.setState({ loading: true, error: null });
    try {
      const response = await fetchTopics(brand);
      
      if (response.success && response.data) {
        const topics: Topic[] = response.data.topics || [];
        const posts: Post[] = topics.flatMap((t: Topic) => t.posts);
        const ads: Ad[] = topics.flatMap((t: Topic) => t.ads);
        
        this.setState({
          topics: [...topics],
          posts: [...posts],
          ads: [...ads],
          loading: false,
          lastUpdated: new Date(),
          error: null,
        });
      } else {
        throw new Error(response.error || "Failed to fetch topics");
      }
    } catch (error) {
      this.setState({
        loading: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  // Fetch insights from backend and map them into the dashboard state
  async fetchInsightsFromAPI(brand?: string): Promise<void> {
    this.setState({ loading: true, error: null });
    try {
      // First try through background (escapes page CSP), then fallback to direct fetch
      const response =
        (await this.fetchInsightsViaBackground(brand)) ||
        (await fetchInsightsApi(brand));

      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to fetch insights");
      }

      const insights = response.data as BrandInsights;
      const topics = this.mapInsightsToTopics(insights);
      const posts = topics.flatMap((t) => t.posts);
      const ads = topics.flatMap((t) => t.ads);

      console.log("[state] generated_video_ads", insights.generated_video_ads);
      console.log("[state] generated_videos", insights.generated_videos);

      this.setState({
        topics,
        posts,
        ads,
        insights,
        loading: false,
        lastUpdated: new Date(),
        error: null,
      });
    } catch (error) {
      this.setState({
        loading: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  // Convert the insights payload into Topics/Posts/Ads the UI understands
  private mapInsightsToTopics(insights: BrandInsights): Topic[] {
    if (!insights?.analysis?.topicSummaries) return [];

    const normalizeTopic = (topic?: string) => this.normalizeTopic(topic);

    const mentionById = new Map<string, PublicMention>();
    (insights.public_mentions || []).forEach((mention) => {
      mentionById.set(mention.id, mention);
    });

    // Map generated media to ad IDs for easy lookup
    const imageByAdId = new Map<string, string>();
    (insights.generated_images || []).forEach((img) => {
      if (img.ad_idea_id && img.image_url) {
        imageByAdId.set(img.ad_idea_id, img.image_url);
      }
    });

    const videoByAdId = new Map<string, { url?: string; status?: string }>();
    (insights.generated_videos || []).forEach((vid) => {
      if (vid.ad_idea_id) {
        videoByAdId.set(vid.ad_idea_id, {
          url: vid.video_url,
          status: vid.status,
        });
      }
    });

    // Group generated ads by topic (best-effort matching on suggestion id in ad id)
    const generatedAdsByTopic = new Map<string, Ad[]>();
    const attachGeneratedAd = (adIdea: any) => {
      const topic =
        this.getTopicForAdIdea(adIdea, insights.suggestions) || "general";
      const normalizedTopic = normalizeTopic(topic);
      const adsForTopic = generatedAdsByTopic.get(normalizedTopic) || [];
      const videoInfo = videoByAdId.get(adIdea.id);

      // Skip media-first ads that never produced a usable asset
      const imageUrl = imageByAdId.get(adIdea.id);
      const isVideoAd = adIdea.format === "video";
      if (isVideoAd && !videoInfo?.url) return;
      if (!isVideoAd && !imageUrl) return;

      adsForTopic.push({
        id: adIdea.id,
        title: adIdea.headline || adIdea.title || "Ad",
        target: topic,
        format: (adIdea.format as Ad["format"]) || "single image",
        cta: adIdea.call_to_action || "Learn more",
        description: adIdea.body,
        imageUrl,
        videoUrl: videoInfo?.url,
      });
      generatedAdsByTopic.set(normalizedTopic, adsForTopic);
    };

    (insights.generated_ads || []).forEach(attachGeneratedAd);
    (insights.generated_video_ads || []).forEach(attachGeneratedAd);

    const postsByTopic = new Map<string, Post[]>();
    (insights.analysis.annotated || []).forEach((annotation) => {
      const mention = mentionById.get(annotation.tweet_id);
      const topics = annotation.topics?.length
        ? annotation.topics
        : ["general"];

      const post: Post = {
        id: annotation.tweet_id,
        text: mention?.text || "No text available",
        author: mention?.author_id || "Unknown author",
        username: mention?.author_id ? `@${mention.author_id}` : "@unknown",
        timestamp: this.formatTimestamp(mention?.created_at),
        retweets: mention?.public_metrics?.retweet_count || 0,
        likes: mention?.public_metrics?.like_count,
        sentiment: annotation.sentiment,
      };

      topics.forEach((topicName) => {
        const normalizedTopic = normalizeTopic(topicName);
        const bucket = postsByTopic.get(normalizedTopic) || [];
        bucket.push(post);
        postsByTopic.set(normalizedTopic, bucket);
      });
    });

    const suggestionsByTopic = new Map<string, Suggestion[]>();
    (insights.suggestions || []).forEach((suggestion) => {
      const normalizedTopic = normalizeTopic(suggestion.topic);
      const bucket = suggestionsByTopic.get(normalizedTopic) || [];
      bucket.push(suggestion);
      suggestionsByTopic.set(normalizedTopic, bucket);
    });

    return insights.analysis.topicSummaries.map((summary) => {
      const normalizedTopic = normalizeTopic(summary.topic);
      const posts = postsByTopic.get(normalizedTopic) || [];
      const suggestionAds = (
        suggestionsByTopic.get(normalizedTopic) || []
      ).map((suggestion, index) => this.mapSuggestionToAd(suggestion, index));
      const generatedAds = generatedAdsByTopic.get(normalizedTopic) || [];
      const ads = [...suggestionAds, ...generatedAds];
      const actionableStep =
        insights.actionable_steps?.[summary.topic] ||
        insights.actionable_steps?.[normalizedTopic] ||
        this.buildActionableStep(
          summary,
          suggestionsByTopic.get(normalizedTopic) || [],
          insights.analysis.generalSentiment.label
        );

      return {
        id: `topic-${summary.topic}`,
        text: summary.topic,
        sentiment: this.deriveSentiment(summary),
        prominence: this.deriveProminence(summary.total),
        mentionCount: summary.total || posts.length,
        posts,
        ads,
        actionableStep,
      };
    });
  }

  private deriveSentiment(summary: TopicSummary): Sentiment {
    if (summary.positive > summary.negative && summary.positive >= summary.neutral) {
      return "positive";
    }
    if (summary.negative > summary.positive && summary.negative >= summary.neutral) {
      return "negative";
    }
    return "neutral";
  }

  private deriveProminence(total: number): Prominence {
    if (total >= 10) return "high";
    if (total >= 5) return "medium";
    return "low";
  }

  private mapSuggestionToAd(suggestion: Suggestion, index: number): Ad {
    return {
      id: suggestion.id || `suggestion-${index}`,
      title: suggestion.title,
      target: suggestion.topic,
      format: "single image",
      cta: "Use suggested copy",
      description: suggestion.suggested_copy || suggestion.rationale,
    };
  }

  // Try to infer topic for generated ads based on suggestion id embedded in ad id
  private getTopicForAdIdea(
    adIdea: { id?: string },
    suggestions: Suggestion[]
  ): string | undefined {
    if (!adIdea?.id) return suggestions[0]?.topic;
    const match = suggestions.find((s) => adIdea.id?.includes(s.id));
    return match?.topic || suggestions[0]?.topic;
  }

  private normalizeTopic(topic?: string): string {
    if (!topic) return "general";
    const normalized = topic.trim().toLowerCase();
    return normalized || "general";
  }

  // Always provide a short actionable guideline per topic (3-4 sentences)
  private buildActionableStep(
    summary: TopicSummary,
    suggestions: Suggestion[],
    overallSentiment: string
  ): string {
    const topicName = summary.topic;
    const primarySuggestion = suggestions[0];

    if (primarySuggestion) {
      const copy =
        primarySuggestion.suggested_copy ||
        primarySuggestion.rationale ||
        primarySuggestion.title;

      return (
        `${primarySuggestion.title}. ` +
        `${copy} ` +
        `Emphasize clear benefits, acknowledge what users are saying about ${topicName}, ` +
        `and A/B test variants that mirror the voice of your happiest customers.`
      );
    }

    const tone =
      overallSentiment === "very negative" || overallSentiment === "negative"
        ? "urgent and empathetic"
        : overallSentiment === "positive" || overallSentiment === "very positive"
        ? "celebratory but specific"
        : "reassuring and confident";

    const angle =
      this.deriveSentiment(summary) === "negative"
        ? "address the pain points head-on with proof of fixes or guarantees"
        : "double down on what resonates and invite participation";

    return [
      `Focus on ${topicName} with an ${tone} tone.`,
      `Lead with a single promise that matters here, and back it up with proof (stats, testimonials, or behind-the-scenes detail).`,
      `Retarget people who engaged with ${topicName}-related posts using creative that ${angle}.`,
      `End every touchpoint with a clear next step (CTA) that feels natural to the conversation, not salesy.`,
    ].join(" ");
  }

  private formatTimestamp(timestamp?: string): string {
    if (!timestamp) return "Unknown time";
    const parsed = new Date(timestamp);
    return isNaN(parsed.getTime()) ? timestamp : parsed.toLocaleString();
  }

  private async fetchInsightsViaBackground(
    brand?: string
  ): Promise<{ success: boolean; data?: BrandInsights; error?: string } | null> {
    if (typeof chrome === "undefined" || !chrome.runtime?.id) {
      return null;
    }

    return new Promise((resolve, reject) => {
      try {
        chrome.runtime.sendMessage(
          { type: "FETCH_INSIGHTS", brand },
          (response) => {
            const lastError = chrome.runtime.lastError;
            if (lastError) {
              resolve(null);
              return;
            }
            resolve(response || null);
          }
        );
      } catch (err) {
        resolve(null);
      }
    });
  }
}

// Export singleton instance
export const stateManager = new StateManager();
