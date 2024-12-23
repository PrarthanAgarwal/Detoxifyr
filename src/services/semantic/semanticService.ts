import { GPTService } from '../gpt/gptService';
import { SemanticAnalysisResult, IntentClassification, SemanticContent } from '../../types/semantic.types';

import { LoggingService } from '../loggingService';

export class SemanticService {
    private static instance: SemanticService;
    private readonly gptService: GPTService;
    private readonly loggingService: LoggingService;
    
    private constructor() {
        this.gptService = GPTService.getInstance();
        this.loggingService = LoggingService.getInstance();
    }

    public static getInstance(): SemanticService {
        if (!SemanticService.instance) {
            SemanticService.instance = new SemanticService();
        }
        return SemanticService.instance;
    }

    public async analyzeSemanticRelevance(
        query: string,
        content: SemanticContent
    ): Promise<SemanticAnalysisResult> {
        try {
            const response = await this.gptService.analyzeContent({
                type: 'semantic_similarity',
                query: `${query}\n${content.title || content.description || 'general'}`
            });

            return {
                semanticScore: response.topicVolatility || 0.5,
                confidenceScore: 0.8,
                topicCategories: [response.contentType || 'unknown'],
                keywordRelevance: {
                    [query]: response.topicVolatility || 0.5
                },
                languageContext: {
                    detectedLanguage: 'en',
                    crossLingualScore: 1.0
                }
            };
        } catch (error) {
            this.loggingService.logError('Error in semantic analysis:', error);
            return {
                semanticScore: 0.5,
                confidenceScore: 0.5,
                topicCategories: ['unknown'],
                keywordRelevance: {
                    [query]: 0.5
                },
                languageContext: {
                    detectedLanguage: 'en',
                    crossLingualScore: 1.0
                }
            };
        }
    }

    public async classifyIntent(
        query: string,
        userContext?: Record<string, any>
    ): Promise<IntentClassification> {
        try {
            const contextualizedQuery = userContext 
                ? `${query} [Context: ${JSON.stringify(userContext)}]`
                : query;

            const response = await this.gptService.analyzeContent({
                type: 'intent_classification',
                query: contextualizedQuery
            });

            return {
                primaryIntent: response.contentType || 'unknown',
                secondaryIntents: [],
                intentConfidence: response.topicVolatility || 0.5,
                userGoals: userContext?.goals || []
            };
        } catch (error) {
            this.loggingService.logError('Error in intent classification:', error);
            return {
                primaryIntent: 'unknown',
                secondaryIntents: [],
                intentConfidence: 0.5,
                userGoals: []
            };
        }
    }

    public async getBatchSemanticAnalysis(
        queries: string[],
        contents: SemanticContent[]
    ): Promise<SemanticAnalysisResult[]> {
        const results = await Promise.all(
            queries.map((query, index) => 
                this.analyzeSemanticRelevance(query, contents[index])
            )
        );
        return results;
    }
} 