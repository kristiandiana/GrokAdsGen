# BrandPulse Chrome Extension

Chrome extension that enhances the X (Twitter) Ads Console with brand insights and content generation.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Build the extension:
```bash
npm run build
```

3. Load in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `extension` directory

## Development

Watch mode for development:
```bash
npm run dev
```

After making changes, rebuild:
```bash
npm run build
```

Then reload the extension in Chrome (click the reload icon on the extension card).

## Structure

- `src/background/` - Service worker (background script)
- `src/content/` - Content script that injects into X Ads Console
- `src/popup/` - Extension popup UI
- `src/utils/` - Shared utilities (API calls, constants)
- `dist/` - Built files (generated)
- `public/` - Static assets (icons, etc.)

