// Background service worker for Chrome Extension (Manifest V3)

chrome.runtime.onInstalled.addListener(() => {
  console.log('BrandPulse Extension installed');
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'FETCH_DATA') {
    // Handle data fetching requests
    handleFetchRequest(message.payload)
      .then(data => sendResponse({ success: true, data }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }
});

async function handleFetchRequest(payload: any) {
  // This will call your Next.js API
  // For now, just a placeholder
  return { message: 'Background worker ready' };
}

