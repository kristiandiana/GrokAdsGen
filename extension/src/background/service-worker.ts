/// <reference types="chrome"/>
// Background service worker for Chrome Extension (Manifest V3)

chrome.runtime.onInstalled.addListener(() => {
  console.log('BrandPulse Extension installed');
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'FETCH_DATA') {
    handleFetchRequest(message.payload)
      .then(data => sendResponse({ success: true, data }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (message.type === 'FETCH_INSIGHTS') {
    handleFetchInsights(message.brand)
      .then(data => {
        console.log('[BrandPulse][bg] insights fetched');
        sendResponse({ success: true, data });
      })
      .catch(error => {
        console.error('[BrandPulse][bg] insights fetch failed', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
});

async function handleFetchRequest(payload: any) {
  // This will call your Next.js API
  // For now, just a placeholder
  return { message: 'Background worker ready' };
}

const API_BASE = "http://localhost:3000";

async function handleFetchInsights(brand?: string) {
  const url = brand
    ? `${API_BASE}/api/insights?brand=${encodeURIComponent(brand)}`
    : `${API_BASE}/api/insights`;

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch insights (${res.status}): ${text}`);
  }
  return res.json();
}
