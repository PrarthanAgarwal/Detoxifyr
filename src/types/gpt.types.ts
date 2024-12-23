export interface GPTAnalysis {
    semanticScore: number;
    topicRelevance: number;
    intentAlignment: number;
    contextScore: number;
    contentType: string;
    temporalRelevance: number;
    qualityIndicators: {
        isClickbait: boolean;
        contentQuality: number;
        informationDensity: number;
    };
    // Semantic analysis fields
    confidenceScore?: number;
    topicCategories?: string[];
    keywordRelevance?: Record<string, number>;
    languageContext?: {
        detectedLanguage: string;
        crossLingualScore: number;
    };
    // Intent classification fields
    primaryIntent?: string;
    secondaryIntents?: string[];
    intentConfidence?: number;
    userGoals?: string[];
}

export interface GPTCacheItem {
    analysis: GPTAnalysis;
    timestamp: number;
    videoId: string;
    queryContext?: string;
}

export interface GPTAnalysisRequest {
    videoId: string;
    title: string;
    description: string;
    tags?: string[];
    query?: string;
    duration?: string;
    context?: string;
}

export interface GPTAnalysisResponse {
    analysis: GPTAnalysis;
    timing: number;
    cached: boolean;
}

export type AnalysisType = 'relevancy' | 'metadata' | 'content';

export interface GPTErrorResponse {
    error: {
        message: string;
        type: string;
        code?: string;
    };
} 