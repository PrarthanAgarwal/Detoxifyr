import { KeywordWeight, WeightingStrategy, SearchContext, UserFeedback } from '../../types/semantic.types';
import { LoggingService } from '../loggingService';
import { GPTService, GPTAnalysisOptions } from '../gpt/gptService';

export class KeywordWeightingService implements WeightingStrategy {
    private static instance: KeywordWeightingService;
    private readonly gptService: GPTService;
    private readonly loggingService: LoggingService;

    private readonly WEIGHT_FACTORS = {
        base: 0.4,
        contextual: 0.3,
        temporal: 0.2,
        performance: 0.1
    };

    private readonly TEMPORAL_DECAY_RATE = 0.1;
    private readonly PERFORMANCE_BOOST_FACTOR = 1.2;
    private readonly MIN_WEIGHT = 0.1;
    private readonly MAX_WEIGHT = 2.0;

    constructor(
        gptService?: GPTService,
        loggingService?: LoggingService
    ) {
        this.gptService = gptService || GPTService.getInstance();
        this.loggingService = loggingService || LoggingService.getInstance();
    }

    public static getInstance(): KeywordWeightingService {
        if (!KeywordWeightingService.instance) {
            KeywordWeightingService.instance = new KeywordWeightingService();
        }
        return KeywordWeightingService.instance;
    }

    public async calculateWeight(keyword: string, context: SearchContext): Promise<KeywordWeight> {
        try {
            this.loggingService.log(`Calculating weight for keyword: ${keyword}`);

            const baseWeight = await this.calculateBaseWeight(keyword);
            const contextualWeight = await this.calculateContextualWeight(keyword, context);
            const temporalWeight = this.calculateTemporalWeight(context.lastUsedTimestamp);
            const performanceWeight = this.calculatePerformanceWeight(context.historicalPerformance);

            const weight: KeywordWeight = {
                keyword,
                baseWeight,
                contextualWeight,
                temporalWeight,
                performanceWeight
            };

            this.loggingService.log(`Weight calculation completed for ${keyword}`, weight);
            return weight;
        } catch (error) {
            this.loggingService.logError(`Error calculating weight for ${keyword}`, error);
            return {
                keyword,
                baseWeight: this.WEIGHT_FACTORS.base,
                contextualWeight: this.WEIGHT_FACTORS.contextual,
                temporalWeight: this.WEIGHT_FACTORS.temporal,
                performanceWeight: this.WEIGHT_FACTORS.performance
            };
        }
    }

    public adjustWeight(weight: KeywordWeight, feedback: UserFeedback): KeywordWeight {
        try {
            this.loggingService.log(`Adjusting weight based on feedback for: ${weight.keyword}`);

            const performanceAdjustment = feedback.isRelevant 
                ? this.PERFORMANCE_BOOST_FACTOR 
                : 1 / this.PERFORMANCE_BOOST_FACTOR;

            const adjustedWeight: KeywordWeight = {
                ...weight,
                performanceWeight: this.normalizeWeight(
                    weight.performanceWeight * performanceAdjustment
                )
            };

            this.loggingService.log(`Weight adjustment completed for ${weight.keyword}`, adjustedWeight);
            return adjustedWeight;
        } catch (error) {
            this.loggingService.logError(`Error adjusting weight for ${weight.keyword}`, error);
            return weight;
        }
    }

    private async calculateBaseWeight(keyword: string): Promise<number> {
        try {
            const options: GPTAnalysisOptions = {
                type: 'keyword_importance',
                query: `Analyze the importance and relevance of the keyword: "${keyword}"`
            };

            const response = await this.gptService.analyzeContent(options);
            return this.normalizeWeight(
                (response.similarityScore || 0.5) * this.WEIGHT_FACTORS.base
            );
        } catch (error) {
            this.loggingService.logError(`Error calculating base weight for ${keyword}`, error);
            return this.WEIGHT_FACTORS.base;
        }
    }

    private async calculateContextualWeight(
        keyword: string, 
        context: SearchContext
    ): Promise<number> {
        try {
            const contextDescription = this.buildContextDescription(context);
            const options: GPTAnalysisOptions = {
                type: 'contextual_relevance',
                query: `Analyze the contextual relevance of "${keyword}" in the context of: ${contextDescription}`
            };

            const response = await this.gptService.analyzeContent(options);
            return this.normalizeWeight(
                (response.similarityScore || 0.5) * this.WEIGHT_FACTORS.contextual
            );
        } catch (error) {
            this.loggingService.logError(`Error calculating contextual weight for ${keyword}`, error);
            return this.WEIGHT_FACTORS.contextual;
        }
    }

    private calculateTemporalWeight(lastUsedTimestamp?: number): number {
        if (!lastUsedTimestamp) {
            return this.WEIGHT_FACTORS.temporal;
        }

        const ageInDays = (Date.now() - lastUsedTimestamp) / (1000 * 60 * 60 * 24);
        const decayFactor = Math.exp(-this.TEMPORAL_DECAY_RATE * ageInDays);
        
        return this.normalizeWeight(
            decayFactor * this.WEIGHT_FACTORS.temporal
        );
    }

    private calculatePerformanceWeight(historicalPerformance?: number[]): number {
        if (!historicalPerformance || historicalPerformance.length === 0) {
            return this.WEIGHT_FACTORS.performance;
        }

        const recentPerformance = historicalPerformance.slice(-5);
        const averagePerformance = recentPerformance.reduce((sum, score) => sum + score, 0) / recentPerformance.length;
        
        return this.normalizeWeight(
            averagePerformance * this.WEIGHT_FACTORS.performance
        );
    }

    private buildContextDescription(context: SearchContext): string {
        const parts = [];
        
        if (context.userPreferences) {
            parts.push(`User preferences: ${context.userPreferences.join(', ')}`);
        }
        
        if (context.searchHistory) {
            parts.push(`Recent searches: ${context.searchHistory.slice(-3).join(', ')}`);
        }
        
        if (context.currentCategory) {
            parts.push(`Current category: ${context.currentCategory}`);
        }

        return parts.join('. ');
    }

    private normalizeWeight(weight: number): number {
        return Math.max(this.MIN_WEIGHT, Math.min(this.MAX_WEIGHT, weight));
    }
} 