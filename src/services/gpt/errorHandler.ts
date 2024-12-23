import { GPTAnalysis } from '../../types/gpt.types';
import { LoggingService } from '../loggingService';

export class GPTErrorHandler {
    private static readonly loggingService = LoggingService.getInstance();

    static handleError(error: Error, context: string): GPTAnalysis {
        this.loggingService.logGPTError(error, context);
        
        // Return safe fallback values based on context
        const fallbackValues = this.getFallbackValues(context);
        
        // Log the fallback action
        this.loggingService.log(`Using fallback values for context: ${context}`);
        
        return fallbackValues;
    }

    private static getFallbackValues(context: string): GPTAnalysis {
        // Base fallback values
        const baseFallback: GPTAnalysis = {
            semanticScore: 0.5,
            topicRelevance: 0.5,
            intentAlignment: 0.5,
            contextScore: 0.5,
            contentType: 'unknown',
            temporalRelevance: 1,
            qualityIndicators: {
                isClickbait: false,
                contentQuality: 0.5,
                informationDensity: 0.5
            }
        };

        // Customize fallback values based on context
        switch (context) {
            case 'relevancy_analysis':
                return {
                    ...baseFallback,
                    // Bias towards inclusion in case of relevancy analysis failure
                    semanticScore: 0.6,
                    topicRelevance: 0.6,
                    intentAlignment: 0.6,
                    contextScore: 0.6
                };

            case 'content_analysis':
                return {
                    ...baseFallback,
                    // Be more conservative with content quality in case of analysis failure
                    qualityIndicators: {
                        ...baseFallback.qualityIndicators,
                        contentQuality: 0.4,
                        informationDensity: 0.4
                    }
                };

            case 'metadata_analysis':
                return {
                    ...baseFallback,
                    // Neutral stance on metadata quality
                    temporalRelevance: 0.5,
                    qualityIndicators: {
                        ...baseFallback.qualityIndicators,
                        isClickbait: false,
                        contentQuality: 0.5
                    }
                };

            default:
                return baseFallback;
        }
    }

    static isRetryableError(error: Error): boolean {
        const nonRetryableErrors = [
            'Invalid API key',
            'API key not found',
            'Unauthorized',
            'Invalid GPT response format'
        ];

        return !nonRetryableErrors.some(msg => 
            error.message.toLowerCase().includes(msg.toLowerCase())
        );
    }

    static formatError(error: Error): string {
        return `GPT Analysis Error: ${error.message}${error.stack ? `\nStack: ${error.stack}` : ''}`;
    }
} 