# Detoxifyr 🌟

A powerful browser extension designed to personalize and detoxify your YouTube experience.

## Overview

Detoxifyr is a modern browser extension built with React, TypeScript, and Vite that helps users maintain a healthier and more personalized YouTube viewing experience. It integrates directly with YouTube's platform to provide enhanced control over content consumption.

## Features

- 🎯 **Personalized Feed Control**: Customize your YouTube feed based on your preferences
- 🔒 **Secure Authentication**: OAuth2 integration with Google for secure access to YouTube data
- 🎨 **Modern UI**: Built with React and styled using Tailwind CSS
- ⚡ **High Performance**: Optimized build using Vite and TypeScript
- 🔄 **State Management**: Robust state handling with Redux Toolkit
- 🎨 **Smooth Animations**: Powered by Framer Motion

## Tech Stack

- **Frontend Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit
- **UI Components**: HeadlessUI
- **Icons**: Heroicons
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Date Handling**: Day.js
- **Animations**: Framer Motion

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file with required environment variables
4. Build the extension:
   ```bash
   npm run build
   ```
5. Load the extension in your browser:
   - Open Chrome/Edge
   - Go to Extensions (chrome://extensions)
   - Enable Developer Mode
   - Click "Load unpacked"
   - Select the `dist` folder

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Browser Permissions

The extension requires the following permissions:
- Storage access
- Cookie access
- Tab management
- Google Identity services
- YouTube API access

## API Integration

Detoxifyr integrates with:
- YouTube Data API
- Google Identity Services
- Custom backend services

## Quality Control System

### Tiered Fallback Mechanism

Detoxifyr implements a sophisticated three-tier quality control system that ensures users receive the best possible content while gracefully handling edge cases:

#### Tier 1: Optimal Quality
- **Core Quality Metrics**:
  * Authority Score: 0.5+ (Channel reputation, subscriber count)
  * Quality Score: 0.5+ (Video production value, description quality)
  * Engagement Score: 0.5+ (Like/dislike ratio, comment interaction)
  * Relevancy Score: 0.5+ (Title/description match with search)
- **Additional Criteria**:
  * Minimum Views: 1,000+
  * Duration: 60-3,600 seconds
  * Age: Less than 365 days
  * Complete metadata required

#### Tier 2: Balanced Quality
- **Core Standards**:
  * Maintains strict authority (0.5+) and quality (0.5+) requirements
- **Relaxed Metrics**:
  * Engagement Score: 0.3+
  * Relevancy Score: 0.4+
  * Minimum Views: 500+
  * Duration: 45-4,500 seconds
  * Age: Up to 730 days

#### Tier 3: Minimum Viable Quality
- **Basic Standards**:
  * Authority Score: 0.4+
  * Quality Score: 0.4+
  * Engagement Score: 0.2+
  * Relevancy Score: 0.3+
- **Flexible Criteria**:
  * Minimum Views: 200+
  * Duration: 30-5,400 seconds
  * Age: Up to 1,095 days
  * Basic metadata completeness

### Implementation Details
- Automatic tier progression when insufficient results
- Console logging for tier usage and transitions
- User control over minimum acceptable tier
- Visual indicators in UI for content quality level
- Caching of higher-tier results during fallback
- Performance monitoring and quality assurance

## Project Structure

```
detoxifyr/
├── src/                # Source code
│   ├── components/     # React components
│   ├── store/         # Redux store configuration
│   ├── services/      # API services
│   ├── hooks/         # Custom React hooks
│   ├── utils/         # Utility functions
│   ├── types/         # TypeScript type definitions
│   ├── config/        # Configuration files
│   └── styles/        # CSS and style files
├── public/            # Static assets
├── dist/             # Production build
└── docs/             # Documentation
```

## Security

- Uses manifest v3 for enhanced security
- Implements Content Security Policy
- Secure OAuth2 authentication
- API key management through environment variables

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is proprietary software. All rights reserved.

## Support

For support, please open an issue in the repository or contact the development team.

---

Built with ❤️ by the Detoxifyr Team 