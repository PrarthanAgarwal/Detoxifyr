import { GPTService } from '../gpt/gptService';
import { LoggingService } from '../loggingService';
import { 
    TemporalAnalysis, 
    ContentAgeContext, 
    DEFAULT_AGE_THRESHOLDS,
    AgeThresholdConfig 
} from '../../types/age.types';

export class AgeAnalysisService {
    private static instance: AgeAnalysisService;
    private readonly gptService: GPTService;
    private readonly loggingService: LoggingService;
    
    private constructor() {
        this.gptService = GPTService.getInstance();
        this.loggingService = LoggingService.getInstance();
    }

    public static getInstance(): AgeAnalysisService {
        if (!AgeAnalysisService.instance) {
            AgeAnalysisService.instance = new AgeAnalysisService();
        }
        return AgeAnalysisService.instance;
    }

    public async analyzeTemporalRelevance(
        content: ContentAgeContext
    ): Promise<TemporalAnalysis> {
        try {
            // Get content type analysis from GPT
            const contentTypeAnalysis = await this.gptService.analyzeContent({
                type: 'content_analysis',
                query: content.topicCategory
            });

            if (!contentTypeAnalysis.contentType || !contentTypeAnalysis.topicVolatility || !contentTypeAnalysis.updateFrequency) {
                throw new Error('Invalid GPT response: missing required fields');
            }

            // Calculate age thresholds based on content type
            const thresholds = await this.calculateAgeThresholds(
                contentTypeAnalysis.contentType,
                content.topicCategory
            );

            // Calculate freshness score
            const freshness = await this.evaluateContentFreshness(
                content.publishDate,
                {
                    temporalRelevance: 0,
                    contentFreshness: 0,
                    timelinessFactors: {
                        topicVolatility: contentTypeAnalysis.topicVolatility,
                        contentType: contentTypeAnalysis.contentType,
                        updateFrequency: contentTypeAnalysis.updateFrequency,
                        lastRelevantDate: contentTypeAnalysis.lastRelevantDate
                    },
                    ageThresholds: thresholds
                }
            );

            return {
                temporalRelevance: freshness.freshnessScore,
                contentFreshness: freshness.freshnessScore,
                timelinessFactors: {
                    topicVolatility: contentTypeAnalysis.topicVolatility,
                    contentType: contentTypeAnalysis.contentType,
                    updateFrequency: contentTypeAnalysis.updateFrequency,
                    lastRelevantDate: contentTypeAnalysis.lastRelevantDate
                },
                ageThresholds: thresholds
            };
        } catch (error) {
            this.loggingService.logError('Error in analyzeTemporalRelevance:', error);
            // Return safe default values
            return this.getDefaultTemporalAnalysis();
        }
    }

    public async calculateAgeThresholds(
        contentType: string,
        topicCategory: string
    ): Promise<{
        optimal: number;
        acceptable: number;
        maximum: number;
    }> {
        try {
            // Get base thresholds from defaults
            const config = this.getThresholdConfig(contentType);
            
            // Adjust thresholds based on topic volatility
            const volatility = await this.calculateTopicVolatility(topicCategory);
            
            return {
                optimal: Math.round(config.baseThresholds.optimal * config.volatilityMultiplier * volatility),
                acceptable: Math.round(config.baseThresholds.acceptable * config.volatilityMultiplier * volatility),
                maximum: Math.round(config.baseThresholds.maximum * config.volatilityMultiplier * volatility)
            };
        } catch (error) {
            this.loggingService.logError('Error in calculateAgeThresholds:', error);
            return DEFAULT_AGE_THRESHOLDS.evergreen.baseThresholds;
        }
    }

    public async evaluateContentFreshness(
        publishDate: Date,
        analysis: TemporalAnalysis
    ): Promise<{
        isFresh: boolean;
        freshnessScore: number;
        recommendation?: string;
    }> {
        try {
            const ageInDays = this.calculateAgeInDays(publishDate);
            const thresholds = analysis.ageThresholds;
            
            // Calculate freshness score based on age thresholds
            let freshnessScore = 1.0;
            if (ageInDays > thresholds.optimal) {
                if (ageInDays > thresholds.maximum) {
                    freshnessScore = 0.0;
                } else if (ageInDays > thresholds.acceptable) {
                    freshnessScore = 0.3;
                } else {
                    freshnessScore = 0.7;
                }
            }

            // Adjust score based on engagement metrics if available
            if (analysis.timelinessFactors.topicVolatility < 0.5) {
                freshnessScore = Math.min(1, freshnessScore * 1.2); // Boost score for less volatile topics
            }

            return {
                isFresh: freshnessScore > 0.5,
                freshnessScore,
                recommendation: this.generateFreshnessRecommendation(freshnessScore, analysis)
            };
        } catch (error) {
            this.loggingService.logError('Error in evaluateContentFreshness:', error);
            return { isFresh: true, freshnessScore: 1.0 };
        }
    }

    private getThresholdConfig(contentType: string): AgeThresholdConfig {
        return DEFAULT_AGE_THRESHOLDS[contentType.toLowerCase()] || 
               DEFAULT_AGE_THRESHOLDS.evergreen;
    }

    private async calculateTopicVolatility(topicCategory: string): Promise<number> {
        try {
            // Use GPT to analyze topic volatility
            const volatilityAnalysis = await this.gptService.analyzeContent({
                type: 'content_analysis',
                query: topicCategory
            });

            if (!volatilityAnalysis.topicVolatility) {
                return 1.0; // Safe default if missing
            }

            return volatilityAnalysis.topicVolatility;
        } catch (error) {
            this.loggingService.logError('Error calculating topic volatility:', error);
            return 1.0; // Safe default
        }
    }

    private calculateAgeInDays(publishDate: Date): number {
        const now = new Date();
        return Math.floor((now.getTime() - publishDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    private generateFreshnessRecommendation(
        freshnessScore: number,
        analysis: TemporalAnalysis
    ): string {
        const contentType = analysis.timelinessFactors.contentType;
        const volatility = analysis.timelinessFactors.topicVolatility;
        
        if (freshnessScore > 0.8) {
            return `Content is very fresh and highly relevant for ${contentType} content.`;
        } else if (freshnessScore > 0.5) {
            return `Content is moderately fresh and still relevant for ${contentType} content.`;
        } else if (freshnessScore > 0.3) {
            return volatility > 0.7 
                ? `Content is aging and may need updating due to high topic volatility.`
                : `Content is aging but may still be useful for reference.`;
        } else {
            return volatility > 0.7
                ? `Content is outdated and requires immediate updating due to high topic volatility.`
                : `Content may be outdated. Consider finding more recent sources.`;
        }
    }

    private getDefaultTemporalAnalysis(): TemporalAnalysis {
        return {
            temporalRelevance: 1.0,
            contentFreshness: 1.0,
            timelinessFactors: {
                topicVolatility: 0.5,
                contentType: 'evergreen',
                updateFrequency: 'monthly',
            },
            ageThresholds: DEFAULT_AGE_THRESHOLDS.evergreen.baseThresholds
        };
    }
} 