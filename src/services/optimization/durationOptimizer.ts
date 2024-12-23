import { ContentTypeAnalysis, DurationAnalysis } from '../../types/content.types';
import { LoggingService } from '../loggingService';

export class DurationOptimizer {
    private static readonly DURATION_WEIGHTS = {
        contentType: 0.35,
        complexity: 0.25,
        pacing: 0.20,
        completeness: 0.20
    };

    private static readonly CONTENT_TYPE_BASELINES = {
        tutorial: { min: 300, max: 3600 },      // 5-60 minutes
        entertainment: { min: 180, max: 1200 },  // 3-20 minutes
        educational: { min: 600, max: 4800 },    // 10-80 minutes
        news: { min: 120, max: 900 },           // 2-15 minutes
        review: { min: 300, max: 1800 },        // 5-30 minutes
        gameplay: { min: 600, max: 3600 },      // 10-60 minutes
        vlog: { min: 300, max: 1500 }           // 5-25 minutes
    };

    private static readonly loggingService = LoggingService.getInstance();

    public static calculateOptimalDuration(
        analysis: DurationAnalysis,
        contentType: ContentTypeAnalysis
    ): {
        minDuration: number;
        maxDuration: number;
        confidence: number;
    } {
        try {
            const baseline = this.getBaselineDuration(contentType.primaryType);
            const adjustmentFactor = this.calculateAdjustmentFactor(analysis);

            const minDuration = Math.round(baseline.min * adjustmentFactor);
            const maxDuration = Math.round(baseline.max * adjustmentFactor);
            const confidence = this.calculateConfidence(analysis, contentType);

            this.loggingService.log(`Duration optimization for ${contentType.primaryType}:
                Baseline: ${baseline.min}-${baseline.max}s
                Adjustment: ${adjustmentFactor}
                Final: ${minDuration}-${maxDuration}s
                Confidence: ${confidence}`
            );

            return {
                minDuration,
                maxDuration,
                confidence
            };
        } catch (error) {
            this.loggingService.logGPTError(error as Error, 'Error in duration optimization');
            return {
                minDuration: 300,  // 5 minutes default
                maxDuration: 1800, // 30 minutes default
                confidence: 0.5
            };
        }
    }

    public static validateDurationRange(
        actual: number,
        expected: { min: number; max: number }
    ): {
        isValid: boolean;
        deviation: number;
        recommendation?: string;
    } {
        const deviation = this.calculateDeviation(actual, expected);
        const isValid = deviation <= 0.2; // 20% tolerance

        let recommendation: string | undefined;
        if (!isValid) {
            if (actual < expected.min) {
                recommendation = `Content might be too brief. Consider expanding to at least ${Math.round(expected.min / 60)} minutes.`;
            } else {
                recommendation = `Content might be too long. Consider condensing to maximum ${Math.round(expected.max / 60)} minutes.`;
            }
        }

        return {
            isValid,
            deviation,
            recommendation
        };
    }

    private static getBaselineDuration(contentType: string): { min: number; max: number } {
        const type = contentType.toLowerCase();
        const baseline = this.CONTENT_TYPE_BASELINES[type as keyof typeof this.CONTENT_TYPE_BASELINES];
        
        if (!baseline) {
            this.loggingService.log(`Unknown content type: ${contentType}, using default baseline`);
            return this.CONTENT_TYPE_BASELINES.tutorial;
        }

        return baseline;
    }

    private static calculateAdjustmentFactor(analysis: DurationAnalysis): number {
        const complexityFactor = 1 + (analysis.complexityLevel - 0.5) * 0.5;
        const pacingFactor = analysis.pacing.score > 0.7 ? 0.8 : (analysis.pacing.score < 0.3 ? 1.2 : 1);
        const completenessFactor = 1 + (analysis.completeness - 0.5) * 0.3;

        return (complexityFactor * pacingFactor * completenessFactor);
    }

    private static calculateConfidence(
        analysis: DurationAnalysis,
        contentType: ContentTypeAnalysis
    ): number {
        return (
            analysis.completeness * this.DURATION_WEIGHTS.completeness +
            contentType.confidence * this.DURATION_WEIGHTS.contentType +
            analysis.complexityLevel * this.DURATION_WEIGHTS.complexity +
            analysis.pacing.score * this.DURATION_WEIGHTS.pacing
        );
    }

    private static calculateDeviation(actual: number, expected: { min: number; max: number }): number {
        const expectedMean = (expected.min + expected.max) / 2;
        return Math.abs(actual - expectedMean) / expectedMean;
    }
} 