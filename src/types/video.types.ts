import { VideoStatistics, VideoContentDetails, Thumbnails } from './youtube';

export interface Video {
    id: string;
    title: string;
    description: string;
    publishedAt: Date;
    thumbnails: Thumbnails;
    channelId: string;
    channelTitle: string;
    tags: string[];
    category: string;
    statistics: VideoStatistics;
    contentDetails: VideoContentDetails;
}

export interface ProcessedResult {
    videoId: string;
    relevancyScore: number;
    contentScore: number;
    ageScore: number;
    finalScore: number;
    recommendations: string[];
}

export interface VideoAnalysisMetrics {
    semanticScore: number;
    contentQuality: number;
    temporalRelevance: number;
    confidenceScores: {
        semantic: number;
        content: number;
        temporal: number;
    };
}

export interface VideoProcessingConfig {
    batchSize?: number;
    parallelProcessing?: boolean;
    timeoutMs?: number;
    retryCount?: number;
}
