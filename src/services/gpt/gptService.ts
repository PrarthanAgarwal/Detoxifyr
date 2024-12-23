import { LoggingService } from '../loggingService';
import { GPTQueryOptimizer, GPTQueryConfig } from './GPTQueryOptimizer';

export type GPTAnalysisType = 
    | 'semantic_similarity'
    | 'keyword_importance'
    | 'content_analysis'
    | 'intent_classification'
    | 'contextual_relevance'
    | 'relevancy_analysis';

export interface GPTAnalysisOptions {
    type: GPTAnalysisType;
    query: string;
    context?: Record<string, any>;
}

export interface GPTAnalysisResponse {
    similarityScore?: number;
    importanceScore?: number;
    relevanceScore?: number;
    analysis: string;
    contentType?: string;
    topicVolatility?: number;
    updateFrequency?: string;
    lastRelevantDate?: Date;
    topicalRelevance?: number;
    contextualRelevance?: number;
    intentAlignment?: number;
    contentDepth?: number;
    explanation?: string[];
}

export class GPTService {
    private static instance: GPTService;
    private readonly queryOptimizer: GPTQueryOptimizer;

    constructor(
        private readonly loggingService: LoggingService = LoggingService.getInstance()
    ) {
        this.queryOptimizer = new GPTQueryOptimizer(loggingService);
    }

    public static getInstance(): GPTService {
        if (!GPTService.instance) {
            GPTService.instance = new GPTService();
        }
        return GPTService.instance;
    }

    public async analyzeContent(
        options: GPTAnalysisOptions,
        config: Partial<GPTQueryConfig> = {}
    ): Promise<GPTAnalysisResponse> {
        try {
            this.loggingService.log('Analyzing content with GPT service', { options });

            const { type, query } = options;
            const params = { content: query };
            
            const optimizedQuery = this.queryOptimizer.optimizeQuery(type, params, config);
            
            switch (type) {
                case 'semantic_similarity':
                    return this.mockSemanticSimilarityAnalysis(optimizedQuery.prompt);
                case 'keyword_importance':
                    return this.mockKeywordImportanceAnalysis(optimizedQuery.prompt);
                case 'content_analysis':
                    return this.mockContentAnalysis(optimizedQuery.prompt);
                case 'intent_classification':
                    return this.mockIntentClassification(optimizedQuery.prompt);
                case 'contextual_relevance':
                    return this.mockContextualRelevance(optimizedQuery.prompt);
                default:
                    throw new Error(`Unsupported analysis type: ${type}`);
            }
        } catch (error) {
            this.loggingService.logError('Error analyzing content with GPT service:', error);
            throw error;
        }
    }

    private mockSemanticSimilarityAnalysis(query: string): GPTAnalysisResponse {
        return {
            similarityScore: 0.85,
            analysis: `Mock semantic similarity analysis for query: ${query}`,
            contentType: 'general',
            topicVolatility: 0.5,
            updateFrequency: 'monthly'
        };
    }

    private mockKeywordImportanceAnalysis(query: string): GPTAnalysisResponse {
        return {
            importanceScore: 0.75,
            analysis: `Mock keyword importance analysis for query: ${query}`,
            contentType: 'general',
            topicVolatility: 0.5,
            updateFrequency: 'monthly'
        };
    }

    private mockContentAnalysis(query: string): GPTAnalysisResponse {
        return {
            analysis: `Mock content analysis for query: ${query}`,
            contentType: 'educational',
            topicVolatility: 0.5,
            updateFrequency: 'monthly',
            lastRelevantDate: new Date()
        };
    }

    private mockIntentClassification(query: string): GPTAnalysisResponse {
        return {
            analysis: `Mock intent classification for query: ${query}`,
            contentType: 'informational',
            topicVolatility: 0.5,
            updateFrequency: 'monthly'
        };
    }

    private mockContextualRelevance(query: string): GPTAnalysisResponse {
        return {
            relevanceScore: 0.95,
            analysis: `Mock contextual relevance analysis for query: ${query}`,
            contentType: 'tutorial',
            topicVolatility: 0.3,
            updateFrequency: 'weekly'
        };
    }

    public async analyzeMetadata(query: string): Promise<GPTAnalysisResponse> {
        return this.analyzeContent({
            type: 'content_analysis',
            query
        });
    }

    public async analyzeTopicVolatility(query: string): Promise<GPTAnalysisResponse> {
        return this.analyzeContent({
            type: 'content_analysis',
            query
        });
    }
} 
