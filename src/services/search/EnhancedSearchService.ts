import { SemanticService } from '../semantic/semanticService';
import { YouTubeService } from '../youtube/youtubeService';
import { LoggingService } from '../loggingService';
import { OptimizedQuery, SearchResults, SearchEnhancementConfig } from '../../types/search.types';
import { SemanticAnalysisResult, IntentClassification } from '../../types/semantic.types';

export class EnhancedSearchService {
    private static instance: EnhancedSearchService;
    private readonly semanticService: SemanticService;
    private readonly youtubeService: YouTubeService;
    private readonly loggingService: LoggingService;
    
    private constructor() {
        this.semanticService = SemanticService.getInstance();
        this.youtubeService = YouTubeService.getInstance();
        this.loggingService = LoggingService.getInstance();
    }

    public static getInstance(): EnhancedSearchService {
        if (!EnhancedSearchService.instance) {
            EnhancedSearchService.instance = new EnhancedSearchService();
        }
        return EnhancedSearchService.instance;
    }

    public async optimizeSearch(
        keywords: string[],
        config?: SearchEnhancementConfig
    ): Promise<OptimizedQuery> {
        try {
            // Get intent classification for better understanding
            const intentAnalysis = await this.semanticService.classifyIntent(
                keywords.join(' '),
                config?.userContext
            );

            // Analyze semantic relationships between keywords
            const semanticAnalysis = await this.semanticService.analyzeSemanticRelevance(
                keywords.join(' '),
                {
                    title: keywords.join(' '),
                    description: '',
                    tags: keywords
                }
            );

            // Combine analyses to create optimized query
            return this.createOptimizedQuery(keywords, intentAnalysis, semanticAnalysis, config);
        } catch (error) {
            this.loggingService.logError('Error in optimizeSearch:', error);
            return {
                originalKeywords: keywords,
                enhancedKeywords: keywords,
                queryContext: {
                    userContext: {}
                },
                searchParameters: this.getDefaultSearchParameters()
            };
        }
    }

    public async search(query: OptimizedQuery): Promise<SearchResults> {
        try {
            const searchParams = {
                ...query.searchParameters,
                query: query.enhancedKeywords.join(' ')
            };

            // Perform enhanced YouTube search
            const results = await this.youtubeService.searchVideos(searchParams);

            return {
                items: results,
                queryUsed: query,
                searchMetadata: {
                    totalResults: results.length,
                    resultsPerPage: query.searchParameters.maxResults || 50,
                    nextPageToken: null
                }
            };
        } catch (error) {
            this.loggingService.logError('Error in search:', error);
            return {
                items: [],
                queryUsed: query,
                searchMetadata: {
                    totalResults: 0,
                    resultsPerPage: 0,
                    nextPageToken: null
                }
            };
        }
    }

    private createOptimizedQuery(
        originalKeywords: string[],
        intentAnalysis: IntentClassification,
        semanticAnalysis: SemanticAnalysisResult,
        config?: SearchEnhancementConfig
    ): OptimizedQuery {
        const enhancedKeywords = [...originalKeywords];

        // Add high-confidence intent-based keywords
        if (intentAnalysis.intentConfidence > 0.7) {
            enhancedKeywords.push(...intentAnalysis.secondaryIntents.slice(0, 2));
        }

        // Add high-relevance semantic keywords
        const relevantKeywords = Object.entries(semanticAnalysis.keywordRelevance)
            .filter(([_, score]) => score > 0.8)
            .map(([keyword]) => keyword);
        enhancedKeywords.push(...relevantKeywords.slice(0, 2));

        return {
            originalKeywords,
            enhancedKeywords: [...new Set(enhancedKeywords)], // Remove duplicates
            queryContext: {
                intent: intentAnalysis.primaryIntent,
                topicCategories: semanticAnalysis.topicCategories,
                userContext: config?.userContext || {}
            },
            searchParameters: {
                ...this.getDefaultSearchParameters(),
                ...config?.searchParameters
            }
        };
    }

    private getDefaultSearchParameters() {
        return {
            maxResults: 50,
            relevanceLanguage: 'en',
            regionCode: 'US',
            safeSearch: 'moderate' as const,
            type: 'video' as const
        };
    }
} 