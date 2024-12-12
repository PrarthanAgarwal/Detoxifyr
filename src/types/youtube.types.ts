export interface YouTubeVideoSnippet {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
        default: YouTubeThumbnail;
        medium: YouTubeThumbnail;
        high: YouTubeThumbnail;
        standard?: YouTubeThumbnail;
        maxres?: YouTubeThumbnail;
    };
    channelTitle: string;
    tags?: string[];
    categoryId: string;
    defaultLanguage?: string;
    defaultAudioLanguage?: string;
}

export interface YouTubeThumbnail {
    url: string;
    width: number;
    height: number;
}

export interface YouTubeVideoStatistics {
    viewCount: string;
    likeCount: string;
    dislikeCount?: string;
    favoriteCount: string;
    commentCount: string;
}

export interface YouTubeVideoContentDetails {
    duration: string;
    dimension: string;
    definition: string;
    caption: string;
    licensedContent: boolean;
    projection: string;
    contentRating?: {
        ytRating?: string;
    };
}

export interface YouTubeVideo {
    kind: string;
    etag: string;
    id: string;
    snippet: YouTubeVideoSnippet;
    contentDetails: YouTubeVideoContentDetails;
    statistics: YouTubeVideoStatistics;
}

export interface YouTubeSearchResultId {
    kind: string;
    videoId: string;
}

export interface YouTubeSearchResult {
    kind: string;
    etag: string;
    id: YouTubeSearchResultId;
    snippet: YouTubeVideoSnippet;
}

export interface YouTubeChannelSnippet {
    title: string;
    description: string;
    customUrl?: string;
    publishedAt: string;
    thumbnails: {
        default: YouTubeThumbnail;
        medium: YouTubeThumbnail;
        high: YouTubeThumbnail;
    };
    defaultLanguage?: string;
    localized?: {
        title: string;
        description: string;
    };
    country?: string;
}

export interface YouTubeChannelStatistics {
    viewCount: string;
    subscriberCount: string;
    hiddenSubscriberCount: boolean;
    videoCount: string;
}

export interface YouTubeChannelContentDetails {
    relatedPlaylists: {
        likes?: string;
        favorites?: string;
        uploads: string;
        watchHistory?: string;
        watchLater?: string;
    };
}

export interface YouTubeChannel {
    kind: string;
    etag: string;
    id: string;
    snippet: YouTubeChannelSnippet;
    contentDetails: YouTubeChannelContentDetails;
    statistics: YouTubeChannelStatistics;
}

export interface YouTubeApiResponse<T> {
    kind: string;
    etag: string;
    nextPageToken?: string;
    prevPageToken?: string;
    pageInfo: {
        totalResults: number;
        resultsPerPage: number;
    };
    items: T[];
}

export type YouTubeSearchResponse = YouTubeApiResponse<YouTubeSearchResult>;
export type YouTubeVideoResponse = YouTubeApiResponse<YouTubeVideo>;
export type YouTubeChannelResponse = YouTubeApiResponse<YouTubeChannel>; 