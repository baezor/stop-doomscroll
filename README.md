# Stop Doomscroll - Chrome Extension

A Chrome extension designed to combat unconscious scrolling behavior on social media sites by promoting mindful usage.

## Features

- **Mindful Entry**: Before accessing social media sites, users are prompted to:
  - Set a time limit for their visit
  - Provide a reason for visiting the site
- **Reason Evaluation**: Uses heuristic analysis to evaluate the purposefulness of the visit
- **Time Tracking**: Displays a countdown timer during the session
- **Gentle Reminders**: Shows notifications when time is up, with options to extend or leave

## Supported Sites

- Facebook
- Instagram
- Twitter/X
- TikTok
- Reddit
- YouTube
- Snapchat
- LinkedIn

## Installation

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Build the Extension**:
   ```bash
   npm run build
   ```

3. **Load in Chrome**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `dist` folder (not the root folder)

## Development

- **Development mode**: `npm run dev` (builds with watch mode)
- **Production build**: `npm run build`
- **Clean build**: `npm run clean`

## How It Works

1. When you visit a supported social media site, the extension blocks the page with a modal
2. You're asked to specify:
   - How many minutes you plan to spend (1-120 minutes)
   - Your reason for visiting
3. The extension evaluates your reason using keyword analysis
4. Based on the evaluation, you receive feedback about the purposefulness of your visit
5. You can choose to proceed or reconsider
6. If you proceed, a timer tracks your session
7. When time runs out, you're given options to extend or leave

## Technical Details

- Built with TypeScript
- Uses Chrome Extension Manifest V3
- Content scripts for page interaction
- Chrome Storage API for session persistence
- Webpack for building and bundling

## Customization

The extension can be customized by:
- Adding more social media sites to the manifest
- Modifying the evaluation algorithm in `src/background.ts`
- Adjusting styling in `src/content.css`
- Integrating with actual LLM APIs for better reason evaluation

## Privacy

- All data is stored locally in Chrome's storage
- No data is sent to external servers
- Sessions are automatically cleaned up after 24 hours

## Future Enhancements

- Integration with actual language models for better reason evaluation
- Analytics dashboard for usage patterns
- Customizable site lists
- Export usage data
- Mobile app companion