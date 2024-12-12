export interface QualityMetrics {
    engagementScore: number;
    authorityScore: number;
    contentQualityScore: number;
    freshnessScore: number;
    relevancyScore: number;
    overallScore: number;
    confidence: number;
}

export interface UserPreferences {
    // Basic quality thresholds
    minEngagementScore: number;
    minAuthorityScore: number;
    minQualityScore: number;
    maxContentAge: number;
    minRelevancyScore: number;
    
    // Advanced filtering options
    minViewCount: number;
    minDuration: number;
    maxDuration: number;
    languagePreferences?: string[];
    regionCode?: string;
    numberOfVideos: number;
    
    // Scoring weights
    weights: QualityWeights;
}

export interface QualityWeights {
    engagement: number;
    authority: number;
    quality: number;
    freshness: number;
    relevancy: number;
}

export interface EngagementMetrics {
    viewToLikeRatio: number;
    viewToCommentRatio: number;
    avgDailyViews: number;
    totalEngagements: number;
    engagementTrend: number;
}

export interface AuthorityMetrics {
    subscriberCount: number;
    isVerified: boolean;
    totalViews: number;
    avgVideoViews: number;
    channelAge: number;
    uploadFrequency: number;
    consistencyScore: number;
}

export interface ContentQualityMetrics {
    hasHDVideo: boolean;
    hasCaptions: boolean;
    descriptionQuality: number;
    titleQuality: number;
    thumbnailQuality: number;
    productionValue: number;
    audioQuality: number;
}

export interface VideoMetadata {
    publishDate: Date;
    keywords: string[];
    category: string;
    duration: number;
    defaultLanguage?: string;
    availableLanguages?: string[];
    regionRestriction?: {
        allowed?: string[];
        blocked?: string[];
    };
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
    totalViews: number;
    createdAt: string;
    recentUploads?: {
        id: string;
        publishedAt: string;
    }[];
} 