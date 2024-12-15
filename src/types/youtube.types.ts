export interface PageInfo {
    totalResults: number;
    resultsPerPage: number;
}

export interface Thumbnail {
    url: string;
    width: number;
    height: number;
}

export interface Thumbnails {
    default?: Thumbnail;
    medium?: Thumbnail;
    high?: Thumbnail;
    standard?: Thumbnail;
    maxres?: Thumbnail;
}

export interface ResourceId {
    kind: string;
    videoId?: string;
    channelId?: string;
    playlistId?: string;
}

export interface SearchResultSnippet {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: Thumbnails;
    channelTitle: string;
    liveBroadcastContent?: string;
    publishTime?: string;
}

export interface SearchResult {
    kind: string;
    etag: string;
    id: ResourceId;
    snippet: SearchResultSnippet;
}

export interface YouTubeSearchResponse {
    kind: string;
    etag: string;
    nextPageToken?: string;
    prevPageToken?: string;
    pageInfo: PageInfo;
    items: SearchResult[];
}

export interface ContentDetails {
    duration: string;
    dimension: string;
    definition: string;
    caption: string;
    licensedContent: boolean;
    audioQuality?: string;
    regionRestriction?: {
        allowed?: string[];
        blocked?: string[];
    };
    contentRating?: {
        [key: string]: string;
    };
}

export interface Statistics {
    viewCount?: string;
    likeCount?: string;
    dislikeCount?: string;
    favoriteCount?: string;
    commentCount?: string;
    subscriberCount?: string;
    videoCount?: string;
}

export interface VideoStatus {
    uploadStatus: string;
    privacyStatus: string;
    license: string;
    embeddable: boolean;
    publicStatsViewable: boolean;
}

export interface TopicDetails {
    topicIds?: string[];
    relevantTopicIds?: string[];
    topicCategories?: string[];
}

export interface VideoSnippet extends SearchResultSnippet {
    tags?: string[];
    categoryId: string;
    defaultLanguage?: string;
    defaultAudioLanguage?: string;
}

export interface Video {
    kind: string;
    etag: string;
    id: string;
    snippet: VideoSnippet;
    contentDetails: ContentDetails;
    statistics: Statistics;
    status?: VideoStatus;
    topicDetails?: TopicDetails;
}

export interface YouTubeVideoResponse {
    kind: string;
    etag: string;
    items: Video[];
    pageInfo: PageInfo;
}

export interface ChannelBrandingSettings {
    channel: {
        title: string;
        description: string;
        keywords: string;
        defaultTab: string;
        defaultLanguage?: string;
    };
    image?: {
        bannerExternalUrl: string;
    };
}

export interface ChannelSnippet {
    title: string;
    description: string;
    customUrl?: string;
    publishedAt: string;
    thumbnails: Thumbnails;
    defaultLanguage?: string;
    localized?: {
        title: string;
        description: string;
    };
    country?: string;
}

export interface Channel {
    kind: string;
    etag: string;
    id: string;
    snippet: ChannelSnippet;
    contentDetails: {
        relatedPlaylists: {
            likes?: string;
            favorites?: string;
            uploads: string;
        };
    };
    statistics: Statistics;
    brandingSettings?: ChannelBrandingSettings;
    topicDetails?: TopicDetails;
}

export interface YouTubeChannelResponse {
    kind: string;
    etag: string;
    items: Channel[];
    pageInfo: PageInfo;
}

export interface CommentSnippet {
    authorDisplayName: string;
    authorProfileImageUrl: string;
    authorChannelUrl: string;
    authorChannelId: {
        value: string;
    };
    videoId: string;
    textDisplay: string;
    textOriginal: string;
    parentId?: string;
    canRate: boolean;
    viewerRating: string;
    likeCount: number;
    publishedAt: string;
    updatedAt: string;
}

export interface Comment {
    kind: string;
    etag: string;
    id: string;
    snippet: CommentSnippet;
}

export interface CommentThread {
    kind: string;
    etag: string;
    id: string;
    snippet: {
        videoId: string;
        topLevelComment: Comment;
        canReply: boolean;
        totalReplyCount: number;
        isPublic: boolean;
    };
    replies?: {
        comments: Comment[];
    };
}

export interface YouTubeCommentThreadResponse {
    kind: string;
    etag: string;
    nextPageToken?: string;
    pageInfo: PageInfo;
    items: CommentThread[];
}

export interface SearchOptions {
    maxResults?: number;
    safeSearch?: 'none' | 'moderate' | 'strict';
    order?: 'date' | 'rating' | 'relevance' | 'title' | 'viewCount';
    pageToken?: string;
    regionCode?: string;
    relevanceLanguage?: string;
    publishedAfter?: Date;
    publishedBefore?: Date;
    videoCategoryId?: string;
    videoDefinition?: 'any' | 'high' | 'standard';
    videoDuration?: 'any' | 'long' | 'medium' | 'short';
    videoType?: 'any' | 'episode' | 'movie';
} 