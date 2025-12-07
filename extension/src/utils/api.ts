// API utility for calling Next.js endpoints

const API_BASE = 'http://localhost:3000';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function fetchBrandTweets(brand: string): Promise<ApiResponse<any>> {
  try {
    const response = await fetch(`${API_BASE}/api/tweets?brand=${encodeURIComponent(brand)}`);
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function fetchInsights(brand?: string): Promise<ApiResponse<any>> {
  try {
    const url = brand 
      ? `${API_BASE}/api/insights?brand=${encodeURIComponent(brand)}`
      : `${API_BASE}/api/insights`;
    const response = await fetch(url);
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function generateContent(prompt: string, type: 'meme' | 'ad'): Promise<ApiResponse<any>> {
  try {
    const response = await fetch(`${API_BASE}/api/generate-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, type }),
    });
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

