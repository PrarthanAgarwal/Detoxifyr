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

export interface ThumbnailInfo {
    url: string;
    width: number;
    height: number;
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

export interface CommentThread {
    id: string;
    text: string;
    authorDisplayName: string;
    authorProfileImageUrl: string;
    likeCount: number;
    publishedAt: string;
    replyCount: number;
}

export interface SearchParams {
    query: string;
    maxResults?: number;
    pageToken?: string;
    order?: 'date' | 'rating' | 'relevance' | 'title' | 'viewCount';
}

export interface SearchResponseItem {
    id: {
        videoId: string;
        kind: string;
    };
    snippet: {
        title: string;
        description: string;
        publishedAt: string;
        thumbnails: {
            default: ThumbnailInfo;
            medium: ThumbnailInfo;
            high: ThumbnailInfo;
        };
        channelId: string;
        channelTitle: string;
    };
}

export interface SearchResponse {
    items: VideoDetails[];
    nextPageToken?: string;
    prevPageToken?: string;
    totalResults: number;
}

export interface YouTubeSearchResponse {
    items: SearchResponseItem[];
    nextPageToken?: string;
    prevPageToken?: string;
    totalResults: number;
}