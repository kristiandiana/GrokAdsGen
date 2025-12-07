// Popup script for the extension

import { fetchInsights, generateContent } from '../utils/api';

document.addEventListener('DOMContentLoaded', () => {
  const fetchBtn = document.getElementById('fetch-insights-btn') as HTMLButtonElement;
  const generateBtn = document.getElementById('generate-content-btn') as HTMLButtonElement;
  const results = document.getElementById('results');
  const status = document.getElementById('status');

  if (fetchBtn) {
    fetchBtn.addEventListener('click', async () => {
      if (results) {
        results.textContent = 'Loading insights...';
        results.classList.remove('hidden');
      }
      
      if (fetchBtn) fetchBtn.disabled = true;
      
      const response = await fetchInsights();
      
      if (results) {
        if (response.success && response.data) {
          results.textContent = JSON.stringify(response.data, null, 2);
        } else {
          results.textContent = `Error: ${response.error || 'Unknown error'}`;
        }
      }
      
      if (fetchBtn) fetchBtn.disabled = false;
    });
  }

  if (generateBtn) {
    generateBtn.addEventListener('click', async () => {
      if (results) {
        results.textContent = 'Generating content...';
        results.classList.remove('hidden');
      }
      
      if (generateBtn) generateBtn.disabled = true;
      
      const response = await generateContent('Create a meme about social media marketing', 'meme');
      
      if (results) {
        if (response.success && response.data) {
          results.textContent = JSON.stringify(response.data, null, 2);
        } else {
          results.textContent = `Error: ${response.error || 'Unknown error'}`;
        }
      }
      
      if (generateBtn) generateBtn.disabled = false;
    });
  }
});

