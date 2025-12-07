import fs from 'fs';
import path from 'path';

const HISTORY_FILE = path.join(process.cwd(), 'data', 'suggestion_history.json');

// Ensure data directory exists
const dataDir = path.dirname(HISTORY_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

interface SuggestionHistory {
  // Topics we've already suggested recently
  recentTopics: string[];
  // IDs of tweets we've already used for ad generation (if we want to track that)
  usedTweetIds: string[];
}

// Initialize file if not exists
if (!fs.existsSync(HISTORY_FILE)) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify({ recentTopics: [], usedTweetIds: [] }, null, 2));
}

export function getSuggestionHistory(): SuggestionHistory {
  try {
    const data = fs.readFileSync(HISTORY_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return { recentTopics: [], usedTweetIds: [] };
  }
}

export function addToHistory(topics: string[]) {
  const history = getSuggestionHistory();
  
  // Add new topics
  const updatedTopics = [...topics, ...history.recentTopics];
  
  // Keep only unique, normalized topics
  const uniqueTopics = Array.from(new Set(updatedTopics.map(t => t.toLowerCase().trim())));
  
  // Keep last 20 topics to avoid stale history blocking everything forever
  const limitedTopics = uniqueTopics.slice(0, 20);

  const newHistory = {
    ...history,
    recentTopics: limitedTopics
  };

  fs.writeFileSync(HISTORY_FILE, JSON.stringify(newHistory, null, 2));
}

export function clearHistory() {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify({ recentTopics: [], usedTweetIds: [] }, null, 2));
}

