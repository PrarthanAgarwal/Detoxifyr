export interface ThumbnailInfo {
    url: string;
    width: number;
    height: number;
}

export interface Thumbnails {
    default: ThumbnailInfo;
    medium: ThumbnailInfo;
    high: ThumbnailInfo;
    standard?: ThumbnailInfo;
    maxres?: ThumbnailInfo;
}

export interface VideoStatistics {
    viewCount: number;
    likeCount: number;
    commentCount: number;
}

export interface VideoContentDetails {
    duration: string;
    dimension: string;
    definition: string;
    caption: boolean;
    licensedContent: boolean;
    projection: string;
}

export interface VideoDetails {
    id: string;
    title: string;
    description: string;
    publishedAt: Date;
    thumbnails: Thumbnails;
    channelId: string;
    channelTitle: string;
    tags: string[];
    statistics: VideoStatistics;
    contentDetails: VideoContentDetails;
    viewCount?: number;
    likeCount?: number;
    commentCount?: number;
    duration?: string;
    defaultLanguage?: string;
    hasCaptions?: boolean;
}

export interface ChannelStatistics {
    viewCount: number;
    subscriberCount: number;
    videoCount: number;
}

export interface ChannelInfo {
    id: string;
    title: string;
    description: string;
    customUrl?: string;
    thumbnails: Thumbnails;
    statistics: ChannelStatistics;
    publishedAt: Date;
    subscriberCount?: number;
    videoCount?: number;
    totalViews?: number;
    createdAt?: string;
    recentUploads?: { publishedAt: string }[];
}