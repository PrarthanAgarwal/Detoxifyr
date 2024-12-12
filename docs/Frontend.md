# Detoxifyr Frontend Documentation

## Architecture Overview

Detoxifyr 3.0 is a Chrome extension built with React, TypeScript, and Redux Toolkit, using Vite as the build tool and Tailwind CSS for styling.

## Core Technologies

- **React 18.2.0**: UI library
- **TypeScript**: Type safety and developer experience
- **Redux Toolkit**: State management
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Animations
- **React Router DOM**: Navigation
- **HeadlessUI**: Accessible UI components

## Project Structure

```
src/
├── components/
│   ├── layout/
│   │   └── Header.tsx           # Main navigation header
│   ├── onboarding/
│   │   └── Welcome.tsx          # Welcome screen
│   ├── preferences/
│   │   ├── AboutSection.tsx     # About and links section
│   │   ├── AdvancedSettings.tsx # Advanced settings page
│   │   ├── RegionSettings.tsx   # Region selection
│   │   └── YouTubeLoginStatus.tsx # YouTube connection status
│   ├── history/
│   │   ├── SessionCard.tsx      # Individual session display
│   │   └── SessionHistory.tsx   # Session history view
│   ├── PreferencesForm.tsx      # New session creation form
│   └── VideoList.tsx            # Curated videos display
├── services/
│   └── youtubeAuth.ts          # YouTube authentication service
├── store/
│   ├── index.ts                # Redux store configuration
│   ├── preferencesSlice.ts     # Preferences state management
│   └── sessionSlice.ts         # Session state management
└── types/
    └── index.ts                # TypeScript interfaces
```

## Key Features

### 1. Session Management
- Create new detox sessions with customizable parameters
- Track session history
- Store session preferences
- Monitor video watching progress

### 2. User Preferences
- Keywords selection (up to 5)
- Video length preferences
- Number of videos per session

### 3. YouTube Integration
- YouTube account connection status
- Region-based content customization
- Video metadata tracking

## Components

### Layout Components

#### Header (`Header.tsx`)
- Main navigation component
- Responsive design
- Tab-based navigation
- Active state indicators

### Core Features

#### PreferencesForm (`PreferencesForm.tsx`)
- Session creation interface
- Keyword management
- Video length selection
- Session size configuration

#### VideoList (`VideoList.tsx`)
- Displays curated videos
- Video metadata presentation
- Engagement metrics
- Thumbnail previews

#### SessionHistory (`SessionHistory.tsx`)
- Historical session tracking
- Session statistics
- Date-based organization
- Session details display

### Settings

#### AdvancedSettings (`AdvancedSettings.tsx`)
- YouTube connection status
- Region selection
- About section
- Data management

## State Management

### Redux Store Structure

```typescript
interface RootState {
  preferences: UserPreferences;
  session: {
    currentSession: SessionHistory | null;
    history: SessionHistory[];
  };
}
```

### Key Slices

#### Preferences Slice
- Manages user preferences
- Handles keyword management
- Stores region settings
- Content filtering parameters

#### Session Slice
- Current session tracking
- Session history management
- Video watching progress
- Session statistics

## Type Definitions

### Core Types

```typescript
interface UserPreferences {
  keywords: string[];
  averageVideoLength: number;
  numberOfVideos: number;
  regionCode: string;
  contentLength: {
    min: number;
    max: number;
  };
}

interface VideoMetadata {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  channelTitle: string;
  viewCount: number;
  contentQualityScore: number;
}

interface SessionHistory {
  sessionId: string;
  date: string;
  videosWatched: VideoMetadata[];
  totalVideos: number;
  keywords: string[];
  contentLength: number;
}
```

## Styling

### Tailwind CSS Configuration
- Custom color palette
- Responsive breakpoints
- Animation utilities
- Custom components

### Animation System
- Framer Motion integration
- Page transitions
- Component animations
- Loading states

## Best Practices

### Component Guidelines
1. Single Responsibility Principle
2. Props type safety
3. Proper error handling
4. Performance optimization

### State Management Guidelines
1. Normalized state structure
2. Selective state updates
3. Memoized selectors
4. Action creators for complex operations

### Styling Guidelines
1. Mobile-first approach
2. Consistent spacing
3. Semantic color usage
4. Accessibility compliance

## Extension Integration

### Chrome Extension APIs
- Cookie management
- Storage access
- Tab management
- YouTube API integration

### Security
- Content Security Policy
- CORS handling
- Authentication flow
- Data persistence

## Performance Considerations

### Optimization Techniques
1. Component lazy loading
2. State normalization
3. Memoization
4. Bundle size optimization

### Memory Management
1. Cleanup on unmount
2. Event listener management
3. Cache invalidation
4. History size limits

## Testing Strategy

### Component Testing
- Unit tests for components
- Integration tests for features
- Snapshot testing
- Event handling verification

### State Testing
- Redux action tests
- Reducer tests
- Selector tests
- Middleware tests

## Future Improvements

1. Offline support
2. Multi-language support
3. Enhanced analytics
4. Performance monitoring
5. A/B testing framework
6. Enhanced video recommendations
7. User feedback system
8. Advanced filtering options