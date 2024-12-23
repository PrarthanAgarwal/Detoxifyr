export interface ContentTypeAnalysis {
    primaryType: string;
    subTypes: string[];
    confidence: number;
    targetAudience: {
        level: string;
        prerequisites: string[];
        intendedUse: string[];
    };
}

export interface ContentAnalysisRequest {
    title: string;
    description: string;
    duration?: number;
    tags?: string[];
}

export interface DurationAnalysis {
    expectedMinDuration: number;
    expectedMaxDuration: number;
    complexityLevel: number;
    pacing: {
        type: 'slow' | 'moderate' | 'fast';
        score: number;
    };
    completeness: number;
}

export interface MetadataQualityAnalysis {
    titleQuality: number;
    descriptionQuality: number;
    tagsQuality: number;
    thumbnailQuality: number;
}

export interface QualityIndicators {
    isClickbait: boolean;
    contentQuality: number;
    informationDensity: number;
}

export interface ContentQualityAnalysis {
    contentType: string;
    temporalRelevance: number;
    qualityIndicators: QualityIndicators;
}

export interface EnhancedAnalysisResult {
    contentType: ContentTypeAnalysis;
    duration: DurationAnalysis;
    quality: ContentQualityAnalysis;
    metadata: MetadataQualityAnalysis;
    recommendations: string[];
} 