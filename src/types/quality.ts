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
    // Basic quality thresholds (used as base for tier adjustments)
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

    // Tiered quality preferences
    tieredQualityPreferences?: {
        minimumAcceptableTier: 1 | 2 | 3;
        enforceStrictTierTransition: boolean;
        disableTieredFallback: boolean;
    };
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

export interface TierCriteria {
    // Core Quality Metrics
    minAuthorityScore: number;
    minQualityScore: number;
    minEngagementScore: number;
    minRelevancyScore: number;

    // Additional Criteria
    minViewCount: number;
    minDuration: number;
    maxDuration: number;
    maxAgeInDays: number;
    requiresCompleteness: boolean;
}

export interface TieredQualityCriteria {
    tier1: TierCriteria;  // Optimal Quality
    tier2: TierCriteria;  // Balanced Quality
    tier3: TierCriteria;  // Minimum Viable Quality
    minimumAcceptableTier: 1 | 2 | 3;
    enforceStrictTierTransition: boolean;
} 