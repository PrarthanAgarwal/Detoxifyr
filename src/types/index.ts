export type VideoLength = 'short' | 'medium' | 'long';
export type ContentAge = 'recent' | 'all';

export interface UserPreferences {
  keywords: string[];
  averageVideoLength: VideoLength;
  numberOfVideos: number;
  languagePreferences: string[];
  contentAge: ContentAge;
  contentLength: {
    min: number;
    max: number;
  };
  viewCountThreshold: number;
  engagementRatioThreshold: number;
  ageLimit: number | null;
  regionCode?: string;
  weights?: QualityWeights;
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

export interface ProcessedKeywords {
  originalKeywords: string[];
  processedKeywords: string[];
  errors: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface OptimizedKeywords extends ProcessedKeywords {
  optimizedKeywords: string[];
  weights: number[];
  groups: string[][];
}

export interface QualityMetrics {
  authorityScore: number;
  contentQualityScore: number;
  engagementScore: number;
  relevancyScore: number;
}

export interface QualityWeights {
  engagement: number;
  authority: number;
  quality: number;
  freshness: number;
  relevancy: number;
}

export interface VideoDetails {
  id: string;
  title: string;
  description?: string;
  thumbnails?: {
    high: {
      url: string;
    };
  };
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  duration: string;
  defaultLanguage?: string;
  regionRestriction?: {
    allowed?: string[];
    blocked?: string[];
  };
  tags?: string[];
}

export interface ChannelInfo {
  id: string;
  title: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  publishedAt: string;
  country?: string;
  topicCategories?: string[];
}