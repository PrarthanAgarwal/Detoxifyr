export interface FilteringTierCriteria {
    minAuthorityScore: number;
    minQualityScore: number;
    minEngagementScore: number;
    minRelevancyScore: number;
    minViewCount: number;
    maxAgeInDays: number;
}

export interface VideoLengthPreference {
    type: 'quick_watch' | 'standard' | 'deep_dive';
    minDuration: number;  // in seconds
    maxDuration: number;  // in seconds
}

export const VIDEO_LENGTH_PREFERENCES = {
    quick_watch: {
        type: 'quick_watch',
        minDuration: 0,        // No minimum for quick watch
        maxDuration: 300,      // 5 minutes maximum
        description: 'Perfect for quick breaks (< 5 min)'
    },
    standard: {
        type: 'standard',
        minDuration: 300,      // 5 minutes minimum
        maxDuration: 900,      // 15 minutes maximum
        description: 'Ideal for regular viewing (5-15 min)'
    },
    deep_dive: {
        type: 'deep_dive',
        minDuration: 900,      // 15 minutes minimum
        maxDuration: 7200,     // 2 hours maximum
        description: 'In-depth content (> 15 min)'
    }
} as const;

export const HIGH_QUALITY_TIER: FilteringTierCriteria = {
    minAuthorityScore: 0.3,    
    minQualityScore: 0.3,      
    minEngagementScore: 0.2,   
    minRelevancyScore: 0.2,    
    minViewCount: 200,         
    maxAgeInDays: 730          
};

export const STANDARD_QUALITY_TIER: FilteringTierCriteria = {
    minAuthorityScore: 0.2,
    minQualityScore: 0.2,
    minEngagementScore: 0.1,
    minRelevancyScore: 0.1,
    minViewCount: 100,
    maxAgeInDays: 1095         
};

export interface ScoringWeights {
    authority: number;
    quality: number;
    engagement: number;
    relevancy: number;
    freshness: number;
}

export const SCORING_WEIGHTS: ScoringWeights = {
    authority: 0.8,            // Reduced weight
    quality: 1.2,             // Increased weight for quality
    engagement: 1.0,           // Normalized
    relevancy: 1.5,           // Increased weight for relevancy
    freshness: 0.5            // Reduced weight for freshness
};

// GPT relevancy scoring thresholds
export const GPT_RELEVANCY_CONFIG = {
    minSemanticScore: 0.2,     // Lowered from 0.3
    minTopicalRelevance: 0.2,  // Lowered from 0.3
    minIntentAlignment: 0.2,   // Lowered from 0.3
    minContextScore: 0.2,      // Lowered from 0.3
    partialMatchWeight: 0.8,   // Increased from 0.7
    keywordMatchBonus: 0.3     // Increased from 0.2
};

// Metadata quality thresholds
export const METADATA_QUALITY_CONFIG = {
    minTitleLength: 20,
    maxTitleLength: 100,
    minDescriptionLength: 50,
    optimalTagCount: 8,
    requiredFields: ['title', 'description', 'thumbnails'] as const,
    bonusFields: ['tags', 'captions'] as const
};

// Content age scoring
export const CONTENT_AGE_SCORING = {
    recentThreshold: 90,       // Days considered "recent"
    mediumThreshold: 365,      // Days considered "medium-aged"
    scoringCurve: {
        recent: 1.0,
        medium: 0.8,
        old: 0.6,
        archived: 0.4
    }
}; 