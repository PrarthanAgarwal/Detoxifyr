import { GPTAnalysisType, GPTAnalysisOptions, GPTAnalysisResponse } from '../services/gpt/gptService';

export interface SemanticAnalysisResult {
    semanticScore: number;
    confidenceScore: number;
    topicCategories: string[];
    keywordRelevance: Record<string, number>;
    languageContext: {
        detectedLanguage: string;
        crossLingualScore: number;
    };
}

export interface IntentClassification {
    primaryIntent: string;
    secondaryIntents: string[];
    intentConfidence: number;
    userGoals: string[];
}

export interface SemanticContent {
    title: string;
    description: string;
    tags: string[];
}

export interface KeywordGroup {
    primaryKeyword: string;
    relatedKeywords: string[];
    weight: number;
    context?: string;
    semanticScore?: number;
}

export interface SemanticGroupingConfig {
    maxGroupSize: number;
    minSimilarityScore: number;
    contextualBoost: boolean;
}

export interface KeywordWeight {
    keyword: string;
    baseWeight: number;
    contextualWeight: number;
    temporalWeight: number;
    performanceWeight: number;
}

export interface WeightingStrategy {
    calculateWeight(keyword: string, context: SearchContext): Promise<KeywordWeight>;
    adjustWeight(weight: KeywordWeight, feedback: UserFeedback): KeywordWeight;
}

export interface SearchContext {
    userPreferences?: Record<string, any>;
    searchHistory?: string[];
    temporalContext?: {
        timeOfDay?: string;
        dayOfWeek?: string;
        season?: string;
    };
}

export interface UserFeedback {
    relevance: number;
    engagement: number;
    satisfaction: number;
    comments?: string;
}

export type { GPTAnalysisType, GPTAnalysisOptions, GPTAnalysisResponse }; 