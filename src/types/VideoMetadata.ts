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
  duration: number; // in seconds
  creatorAuthorityScore: number;
  contentQualityScore: number;
  engagementRatio: number;
  description?: string;
  tags?: string[];
  language?: string;
  regionCode?: string;
  categoryId?: string;
  isHD?: boolean;
  hasCaptions?: boolean;
} 