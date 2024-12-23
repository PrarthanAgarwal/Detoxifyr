import { VideoDetails } from './youtube';

export interface SearchEnhancementConfig {
    userContext?: Record<string, any>;
    searchParameters?: {
        maxResults?: number;
        relevanceLanguage?: string;
        regionCode?: string;
        safeSearch?: 'none' | 'moderate' | 'strict';
        type?: 'video' | 'channel' | 'playlist';
        [key: string]: any;
    };
}

export interface OptimizedQuery {
    originalKeywords: string[];
    enhancedKeywords: string[];
    queryContext: {
        intent?: string;
        topicCategories?: string[];
        userContext: Record<string, any>;
    };
    searchParameters: {
        maxResults: number;
        relevanceLanguage: string;
        regionCode: string;
        safeSearch: 'none' | 'moderate' | 'strict';
        type: 'video' | 'channel' | 'playlist';
        [key: string]: any;
    };
}

export interface SearchResults {
    items: VideoDetails[];
    queryUsed: OptimizedQuery;
    searchMetadata: {
        totalResults: number;
        resultsPerPage: number;
        nextPageToken: string | null;
    };
} 