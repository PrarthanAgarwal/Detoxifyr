export interface UserPreferences {
  keywords: string[];
  averageVideoLength: number;
  numberOfVideos: number;
  languagePreferences: string[];
  contentLength: {
    min: number;
    max: number;
  };
  viewCountThreshold: number;
  engagementRatioThreshold: number;
  ageLimit: number;
}

export interface VideoMetadata {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  channelId: string;
  channelTitle: string;
  publishDate: string;
  viewCount: number;
  likeCount: number;
  dislikeCount: number;
  commentCount: number;
  duration: number;
  creatorAuthorityScore: number;
  contentQualityScore: number;
  engagementRatio: number;
}

export interface SessionHistory {
  sessionId: string;
  date: string;
  videosWatched: VideoMetadata[];
  totalVideos: number;
  keywords: string[];
  contentLength: number;
}

export interface LoginStatus {
  isLoggedIn: boolean;
  email?: string;
}