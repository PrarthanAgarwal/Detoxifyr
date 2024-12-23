import { LoggingService } from '../loggingService';

export interface GPTQueryConfig {
    maxTokens?: number;
    temperature?: number;
    retryCount?: number;
}

export interface GPTQueryResult {
    prompt: string;
    options: {
        type: string;
    };
    config: GPTQueryConfig;
}

export class GPTQueryOptimizer {
    private readonly MAX_PROMPT_LENGTH = 4000;
    private readonly DEFAULT_CONFIG: GPTQueryConfig = {
        maxTokens: 100,
        temperature: 0.7,
        retryCount: 3
    };

    constructor(private readonly loggingService: LoggingService) {}

    public optimizeQuery(
        type: string,
        params: Record<string, any>,
        config: Partial<GPTQueryConfig> = {}
    ): GPTQueryResult {
        try {
            const prompt = this.formatPrompt(type, params);
            const truncatedPrompt = this.truncateIfNeeded(prompt);
            const finalConfig = { ...this.DEFAULT_CONFIG, ...config };

            this.loggingService.log(`Optimizing query of type: ${type}`);

            return {
                prompt: truncatedPrompt,
                options: { type },
                config: finalConfig
            };
        } catch (error) {
            this.loggingService.logError('Error optimizing query:', error);
            throw error;
        }
    }

    private formatPrompt(type: string, params: Record<string, any>): string {
        switch (type) {
            case 'semantic_similarity':
                return this.formatSemanticSimilarityPrompt(params);
            case 'keyword_importance':
                return this.formatKeywordImportancePrompt(params);
            case 'content_analysis':
                return this.formatContentAnalysisPrompt(params);
            default:
                throw new Error(`Unsupported query type: ${type}`);
        }
    }

    private formatSemanticSimilarityPrompt(params: Record<string, any>): string {
        const concept1 = params.concept1 || '{concept1}';
        const concept2 = params.concept2 || '{concept2}';

        return `Analyze the semantic similarity between the following concepts:
Concept 1: ${concept1}
Concept 2: ${concept2}

Please provide a detailed analysis of how these concepts are related and a similarity score between 0 and 1.`;
    }

    private formatKeywordImportancePrompt(params: Record<string, any>): string {
        const keyword = params.keyword || '{keyword}';

        return `Analyze the importance and relevance of the following keyword:
Keyword: ${keyword}

Please provide a detailed analysis of the keyword's significance and an importance score between 0 and 1.`;
    }

    private formatContentAnalysisPrompt(params: Record<string, any>): string {
        const content = params.content || '{content}';
        const context = params.context || '{context}';

        return `Analyze the following content in the given context:
Context: ${context}
Content: ${content}

Please provide a detailed analysis of the content's relevance to the context.`;
    }

    private truncateIfNeeded(prompt: string): string {
        if (prompt.length <= this.MAX_PROMPT_LENGTH) {
            return prompt;
        }

        this.loggingService.log('Query exceeds context window, truncating...');

        // Keep the first part and last part of the prompt, adding ellipsis in between
        const halfLength = Math.floor((this.MAX_PROMPT_LENGTH - 3) / 2);
        return prompt.slice(0, halfLength) + '...' + prompt.slice(-halfLength);
    }
} 