# Detoxifyr Schema Design Document

## Storage Strategy
- **Local Storage:**
  - Store UserPreferences and SessionHistory using localStorage API
- **In-Memory Data:**
  - Use in-memory variables or state management libraries to handle VideoMetadata during a session

## Data Models

### UserPreferences
```javascript
{
  keywords: ['string'],
  averageVideoLength: number, // in minutes
  numberOfVideos: number,
  languagePreferences: ['string'], // e.g., ['en', 'es']
  regionCode: 'string', // e.g., 'US'
  contentLength: {
    min: number, // in minutes
    max: number // in minutes
  },
  viewCountThreshold: number,
  engagementRatioThreshold: number,
  ageLimit: number // in days
}
```

### VideoMetadata
```javascript
{
  videoId: 'string',
  title: 'string',
  thumbnailUrl: 'string',
  channelId: 'string',
  channelTitle: 'string',
  publishDate: 'ISODateString',
  viewCount: number,
  likeCount: number,
  dislikeCount: number,
  commentCount: number,
  duration: number, // in seconds
  creatorAuthorityScore: number,
  contentQualityScore: number,
  engagementRatio: number
}
```

### SessionHistory
```javascript
{
  sessionId: 'string',
  date: 'ISODateString',
  videosWatched: [VideoMetadata],
  totalVideos: number
}
```

## Key Considerations
- Minimal client-side data storage
- Leveraging browser storage options
- Maintaining user privacy and data protection
