export interface ThumbnailInfo {
    url: string;
    width: number;
    height: number;
}

export interface VideoDetails {
    id: string;
    title: string;
    description: string;
    publishedAt: string;
    thumbnails: {
        default: ThumbnailInfo;
        medium: ThumbnailInfo;
        high: ThumbnailInfo;
        maxres?: ThumbnailInfo;
    };
    channelId: string;
    channelTitle: string;
    duration: string;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    defaultLanguage?: string;
    tags?: string[];
    categoryId?: string;
    hasCaptions?: boolean;
    contentDetails?: {
        audioQuality?: string;
    };
    regionRestriction?: {
        allowed?: string[];
        blocked?: string[];
    };
}

export interface ChannelInfo {
    id: string;
    title: string;
    description: string;
    subscriberCount: number;
    videoCount: number;
    thumbnails: {
        default: ThumbnailInfo;
        medium: ThumbnailInfo;
        high: ThumbnailInfo;
        maxres?: ThumbnailInfo;
    };
    totalViews: number;
    createdAt: string;
    recentUploads: { publishedAt: string }[];
}

export interface SearchResponse {
    items: VideoDetails[];
    nextPageToken?: string;
    prevPageToken?: string;
    totalResults: number;
}