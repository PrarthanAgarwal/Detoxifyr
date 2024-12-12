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