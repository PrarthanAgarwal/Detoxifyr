import { SemanticAnalysisResult, IntentClassification } from '../../types/semantic.types';

export class RelevancyScoring {
    private static instance: RelevancyScoring;
    
    private readonly WEIGHT_FACTORS = {
        semantic: 0.4,
        intent: 0.3,
        keyword: 0.2,
        context: 0.1
    };

    private constructor() {}

    public static getInstance(): RelevancyScoring {
        if (!RelevancyScoring.instance) {
            RelevancyScoring.instance = new RelevancyScoring();
        }
        return RelevancyScoring.instance;
    }

    public calculateCompositeScore(
        semanticResult: SemanticAnalysisResult,
        intentResult: IntentClassification,
        existingScore: number
    ): number {
        const semanticComponent = semanticResult.semanticScore * this.WEIGHT_FACTORS.semantic;
        const intentComponent = intentResult.intentConfidence * this.WEIGHT_FACTORS.intent;
        const keywordComponent = this.calculateKeywordScore(semanticResult.keywordRelevance) * this.WEIGHT_FACTORS.keyword;
        const contextComponent = existingScore * this.WEIGHT_FACTORS.context;

        return this.normalizeScore(
            semanticComponent + 
            intentComponent + 
            keywordComponent + 
            contextComponent
        );
    }

    private calculateKeywordScore(keywordRelevance: Record<string, number>): number {
        if (Object.keys(keywordRelevance).length === 0) {
            return 0;
        }

        const values = Object.values(keywordRelevance);
        return values.reduce((sum, value) => sum + value, 0) / values.length;
    }

    private normalizeScore(score: number): number {
        return Math.max(0, Math.min(1, score));
    }

    public getScoreBreakdown(
        semanticResult: SemanticAnalysisResult,
        intentResult: IntentClassification,
        existingScore: number
    ): Record<string, number> {
        return {
            semantic: semanticResult.semanticScore * this.WEIGHT_FACTORS.semantic,
            intent: intentResult.intentConfidence * this.WEIGHT_FACTORS.intent,
            keyword: this.calculateKeywordScore(semanticResult.keywordRelevance) * this.WEIGHT_FACTORS.keyword,
            context: existingScore * this.WEIGHT_FACTORS.context
        };
    }
} 