# YouTube Detoxifyr - Technical Documentation

## 1. Project Requirements Document

### Core Features
1. User Authentication
   - Google account login via Chrome Identity API
   - OAuth2 token management
   - Session persistence

2. Video Processing Configuration
   - Keyword input (max 5 keywords)
   - Video duration preference setting
   - Number of videos to process
   - Playback speed selection (1x, 1.5x, 2x)

3. Video Processing Engine
   - YouTube search integration
   - Automated video playback
   - Recommendation selection
   - Progress tracking
   - Watch history recording

### Non-Functional Requirements
1. Performance
   - Smooth video transitions
   - Minimal impact on browser performance
   - Efficient memory management

2. Security
   - Secure token handling
   - Data privacy compliance
   - Safe script injection

3. Reliability
   - Error recovery
   - Session persistence
   - Graceful failure handling

4. User Experience
   - Intuitive interface
   - Progress visibility
   - Minimal setup requirements

## 2. Tech Stack and Packages Documentation

### Core Technologies
1. Frontend Framework
   ```
   - React 18
   - TypeScript
   - Vite
   ```

2. UI Layer
   ```
   - Tailwind CSS
   - shadcn/ui
   - Radix UI
   - Lucide React
   ```

3. State Management
   ```
   - Redux Toolkit
   - React Redux
   ```

4. Authentication
   ```
   - Chrome Identity API
   - Google OAuth2
   ```

### Additional Required Packages
1. Chrome Extension Development
   ```
   - @types/chrome
   - web-ext (for development)
   ```

2. YouTube Integration
   ```
   - YouTube Data API client
   - YouTube IFrame Player API
   ```

3. Development Tools
   ```
   - ESLint
   - Prettier
   - TypeScript compiler
   - Chrome extension manifest v3
   ```

## 3. Schema Design Document

### Redux Store Schema
```typescript
interface RootState {
  auth: {
    isAuthenticated: boolean;
    user: {
      email: string;
      accessToken: string;
      refreshToken: string;
    };
  };
  config: {
    keywords: string[];
    videoDuration: number;
    videoCount: number;
    playbackSpeed: number;
  };
  process: {
    status: 'idle' | 'running' | 'paused' | 'completed';
    currentVideo: {
      id: string;
      title: string;
      duration: number;
      watchedDuration: number;
    };
    processedVideos: Array<{
      id: string;
      title: string;
      watchDuration: number;
      timestamp: number;
    }>;
    progress: {
      videosWatched: number;
      totalVideos: number;
    };
  };
}
```

### Storage Schema (Chrome Storage)
```typescript
interface StorageSchema {
  settings: {
    lastUsedKeywords: string[];
    preferredDuration: number;
    preferredSpeed: number;
  };
  history: Array<{
    date: string;
    keywords: string[];
    videosWatched: number;
    totalDuration: number;
  }>;
  auth: {
    refreshToken: string;
    lastLogin: number;
  };
}
```

## 4. Detailed App Flow Document

### 1. Initialization Flow
1. Extension Load
   - Load extension in browser
   - Check for existing auth tokens
   - Initialize Redux store
   - Load saved preferences

2. Authentication
   - Trigger Google OAuth flow
   - Store tokens securely
   - Update auth state

### 2. Configuration Flow
1. User Input
   - Accept keywords
   - Validate input constraints
   - Store configuration
   - Update Redux state

2. Pre-processing Setup
   - Validate YouTube access
   - Check for required permissions
   - Initialize video processor

### 3. Video Processing Flow
1. Search Phase
   - Query YouTube with keywords
   - Filter by duration preferences
   - Create initial video queue

2. Watching Phase
   - Load video player
   - Calculate watch duration
   - Handle playback speed
   - Monitor video progress
   - Update watch history
   - Pick next video from recommendations

3. Navigation Phase
   - Extract recommended videos
   - Apply selection criteria
   - Handle video transitions
   - Update progress state

### 4. Error Handling Flow
1. Network Issues
   - Retry mechanism
   - Progress preservation
   - User notification

2. YouTube API Issues
   - Rate limit handling
   - Alternative selection paths
   - Graceful degradation

3. Authentication Issues
   - Token refresh
   - Re-authentication flow
   - Session recovery

### 5. History and Analytics Flow
1. Data Collection
   - Track video interactions
   - Store watch patterns
   - Measure effectiveness

2. History Management
   - Store session data
   - Provide history view
   - Enable data export

This documentation provides a foundation for development and can be extended based on specific implementation needs or additional features.
