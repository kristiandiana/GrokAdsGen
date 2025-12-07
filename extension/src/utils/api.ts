import { Topic, Post, Ad } from "../types";

const API_BASE = "http://localhost:3000";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface TopicsResponse {
  topics: Topic[];
  posts?: Post[];
  ads?: Ad[];
}

export async function fetchInsights(brand?: string): Promise<ApiResponse<any>> {
  try {
    const url = brand
      ? `${API_BASE}/api/insights?brand=${encodeURIComponent(brand)}`
      : `${API_BASE}/api/insights`;
    const response = await fetch(url);
    const data = await response.json();
    return { success: response.ok, data, error: response.ok ? undefined : data?.error };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function fetchTopics(
  brand?: string
): Promise<ApiResponse<TopicsResponse>> {
  try {
    const url = brand
      ? `${API_BASE}/api/topics?brand=${encodeURIComponent(brand)}`
      : `${API_BASE}/api/topics`;
    const response = await fetch(url);
    const data = await response.json();
    return { success: response.ok, data, error: response.ok ? undefined : data?.error };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
