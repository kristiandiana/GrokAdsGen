// State management for BrandPulse dashboard
// Lightweight state manager with observer pattern for reactive UI updates

import { Topic, Post, Ad } from "../types";

type StateListener = (state: AppState) => void;

export interface AppState {
  topics: Topic[];
  posts: Post[];
  ads: Ad[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

class StateManager {
  private state: AppState = {
    topics: [],
    posts: [],
    ads: [],
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
      loading: false,
      error: null,
      lastUpdated: null,
    });
  }

  // Fetch topics from API (to be called from content script)
  async fetchTopicsFromAPI(brand?: string): Promise<void> {
    this.setState({ loading: true, error: null });
    try {
      // Dynamic import to avoid circular dependencies
      const { fetchTopics } = await import("../utils/api");
      const response = await fetchTopics(brand);
      
      if (response.success && response.data) {
        const topics = response.data.topics || [];
        const posts = topics.flatMap((t) => t.posts);
        const ads = topics.flatMap((t) => t.ads);
        
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
}

// Export singleton instance
export const stateManager = new StateManager();

