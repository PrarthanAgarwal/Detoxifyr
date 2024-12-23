export interface ContentAgeContext {
    publishDate: Date;
    topicCategory: string;
    engagementMetrics: {
        recentViews: number;
        recentComments: number;
        trendingScore: number;
    };
}

export interface TemporalAnalysis {
    temporalRelevance: number;
    contentFreshness: number;
    timelinessFactors: {
        topicVolatility: number;
        contentType: string;
        updateFrequency: string;
        lastRelevantDate?: Date;
        recommendation?: string;
    };
    ageThresholds: AgeThresholds;
}

export interface AgeThresholds {
    optimal: number;
    acceptable: number;
    maximum: number;
}

export interface AgeThresholdConfig {
    baseThresholds: AgeThresholds;
    volatilityMultiplier: number;
    engagementBonus: number;
}

export const DEFAULT_AGE_THRESHOLDS: Record<string, AgeThresholdConfig> = {
    evergreen: {
        baseThresholds: {
            optimal: 365 * 2,    // 2 years
            acceptable: 365 * 5,  // 5 years
            maximum: 365 * 10    // 10 years
        },
        volatilityMultiplier: 1,
        engagementBonus: 0.5
    },
    news: {
        baseThresholds: {
            optimal: 1,          // 1 day
            acceptable: 7,       // 1 week
            maximum: 30         // 1 month
        },
        volatilityMultiplier: 2,
        engagementBonus: 0.2
    },
    tutorial: {
        baseThresholds: {
            optimal: 180,        // 6 months
            acceptable: 365,     // 1 year
            maximum: 365 * 2    // 2 years
        },
        volatilityMultiplier: 1.5,
        engagementBonus: 0.3
    },
    entertainment: {
        baseThresholds: {
            optimal: 30,         // 1 month
            acceptable: 180,     // 6 months
            maximum: 365        // 1 year
        },
        volatilityMultiplier: 1.2,
        engagementBonus: 0.4
    }
}; 