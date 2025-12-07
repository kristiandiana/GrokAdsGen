# BrandPulse

> AI-powered brand sentiment analysis and ad generation platform for X (Twitter)

BrandPulse is an intelligent Chrome extension and backend system that analyzes real-time social media sentiment, extracts trending topics, and generates contextual ad campaigns with AI-powered creative assets.

## Features

- **Real-time Sentiment Analysis**: Monitors X/Twitter conversations and performs sentiment analysis on brand mentions
- **Topic Extraction**: Automatically identifies trending topics and pain points from social media discussions
- **AI Ad Generation**: Creates targeted ad suggestions with AI-generated video and image creatives
- **Interactive Dashboard**: Visualizes sentiment data, topics, and ad recommendations in an intuitive graph-based interface
- **Chrome Extension**: Seamlessly integrates into X Ads Console for easy access to insights

## Architecture

### Backend (`npm run dev`)

- **Sentiment Pipeline**: Analyzes tweets using VADER sentiment analysis
- **Topic Clustering**: Groups related conversations into actionable topics
- **AI Creative Generation**: Leverages xAI's Grok API and Pika for generating ad creatives
- **API Endpoints**: Provides real-time insights to the Chrome extension

### Chrome Extension (`npm run build`)

- **Dashboard UI**: Interactive graph visualization of topics and sentiment
- **Ad Preview**: Native X-style ad cards with downloadable media
- **Topic Deep-Dive**: Explore posts, sentiment analysis, and actionable recommendations

## Tech Stack

- **Backend**: TypeScript, Twitter API v2
- **Frontend**: Chrome Extension (TypeScript, vis-network)
- **AI/ML**: VADER Sentiment, xAI Grok, Pika Video Generation
- **APIs**: Twitter API v2, xAI Grok, Pika

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Twitter API credentials (v2)
- xAI API key
- Fal.ai API key
- Chrome browser (for extension)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/BrandPulse.git
   cd BrandPulse
   ```

2. **Install dependencies**

   ```bash
   # Install backend dependencies
   npm install

   # Install extension dependencies
   cd extension
   npm install
   cd ..
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory:

   ```env
   TWITTER_API_KEY=your_twitter_api_key
   TWITTER_API_SECRET=your_twitter_api_secret
   TWITTER_ACCESS_TOKEN=your_access_token
   TWITTER_ACCESS_SECRET=your_access_secret
   TWITTER_BEARER_TOKEN=your_bearer_token

   XAI_API_KEY=your_xai_api_key
   FAL_KEY=your_fal_api_key
   ```

   Note: FAL_KEY is used to access Pika video generation through Fal.ai's API.

### Running the Backend

Start the development server:

```bash
npm run dev
```

This runs the entire sentiment pipeline and API endpoints at `http://localhost:3000`.

The backend will:

- Fetch tweets about your brand
- Run sentiment analysis
- Extract trending topics
- Generate AI-powered ad suggestions
- Serve insights via `/api/insights`

### Building the Chrome Extension

1. **Build the extension**

   ```bash
   cd extension
   npm run build
   ```

2. **Load in Chrome**

   - Open Chrome and navigate to `chrome://extensions`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the `extension/dist` folder

3. **Use the extension**
   - Navigate to [ads.x.com](https://ads.x.com)
   - Click the "BrandPulse" menu item in the left sidebar
   - Explore sentiment insights, topics, and AI-generated ads

## Key Features in Detail

### Dashboard Views

1. **Graph View**: Interactive network visualization of topics and their relationships
2. **Posts View**: Chronological feed of analyzed social media posts
3. **Ads View**: AI-generated ad suggestions with carousel preview
4. **Topics View**: Summary of all trending topics with prominence indicators

### Ad Generation

- **Video Ads**: AI-generated videos using Pika
- **Image Ads**: AI-generated images using xAI Grok
- **Copy Generation**: Contextual ad copy based on sentiment and topic
- **Downloadable Assets**: One-click download for all generated media

### Sentiment Analysis

- **VADER Sentiment**: Industry-standard sentiment scoring
- **Topic Clustering**: Groups related posts by theme
- **Prominence Scoring**: Identifies high-impact topics
- **Actionable Playbooks**: Strategic recommendations for each topic

## Screenshots

_[Add your screenshots here]_
