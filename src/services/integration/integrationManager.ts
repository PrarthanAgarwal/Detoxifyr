import { SemanticService } from '../semantic/semanticService';
import { ContentAnalysisService } from '../content/contentAnalysisService';
import { AgeAnalysisService } from '../age/ageAnalysisService';
import { RelevancyScoring } from '../scoring/relevancyScoring';
import { LoggingService } from '../loggingService';
import { Video } from '../../types/video.types';
import { convertDurationToSeconds } from '../../utils/durationUtils';

interface AnalysisResult {
    semanticScore: number;
    contentQuality: number;
    temporalRelevance: number;
    recommendations: string[];
    metadata: {
        processingTime: number;
        confidenceScores: {
            semantic: number;
            content: number;
            temporal: number;
        };
    };
}

export class IntegrationManager {
    private static instance: IntegrationManager;
    private readonly services: {
        semantic: SemanticService;
        content: ContentAnalysisService;
        age: AgeAnalysisService;
        relevancy: RelevancyScoring;
    };
    private readonly loggingService: LoggingService;

    private constructor() {
        this.services = {
            semantic: SemanticService.getInstance(),
            content: ContentAnalysisService.getInstance(),
            age: AgeAnalysisService.getInstance(),
            relevancy: RelevancyScoring.getInstance()
        };
        this.loggingService = LoggingService.getInstance();
    }

    public static getInstance(): IntegrationManager {
        if (!IntegrationManager.instance) {
            IntegrationManager.instance = new IntegrationManager();
        }
        return IntegrationManager.instance;
    }

    public async analyzeVideo(video: Video, query: string): Promise<AnalysisResult> {
        const startTime = Date.now();
        
        try {
            // Run all analyses in parallel
            const [semanticAnalysis, contentAnalysis, ageAnalysis] = await Promise.all([
                this.performSemanticAnalysis(query, video),
                this.performContentAnalysis(video),
                this.performTemporalAnalysis(video)
            ]);

            // Combine results
            const result = this.combineAnalysis(semanticAnalysis, contentAnalysis, ageAnalysis);
            
            // Add metadata
            result.metadata = {
                processingTime: Date.now() - startTime,
                confidenceScores: {
                    semantic: semanticAnalysis.confidenceScore,
                    content: contentAnalysis.qualityIndicators.contentQuality,
                    temporal: ageAnalysis.temporalRelevance
                }
            };

            return result;
        } catch (error) {
            this.loggingService.logError('Error in analyzeVideo:', error);
            throw error;
        }
    }

    private async performSemanticAnalysis(query: string, video: Video) {
        const semanticContent = {
            title: video.title,
            description: video.description,
            tags: video.tags
        };

        return this.services.semantic.analyzeSemanticRelevance(query, semanticContent);
    }

    private async performContentAnalysis(video: Video) {
        return this.services.content.analyzeQuality({
            title: video.title,
            description: video.description,
            duration: convertDurationToSeconds(video.contentDetails.duration)
        });
    }

    private async performTemporalAnalysis(video: Video) {
        return this.services.age.analyzeTemporalRelevance({
            publishDate: video.publishedAt,
            topicCategory: video.category,
            engagementMetrics: {
                recentViews: video.statistics.viewCount,
                recentComments: video.statistics.commentCount,
                trendingScore: this.calculateTrendingScore(video)
            }
        });
    }

    private calculateTrendingScore(video: Video): number {
        const daysSincePublish = (Date.now() - video.publishedAt.getTime()) / (1000 * 60 * 60 * 24);
        const viewsPerDay = video.statistics.viewCount / Math.max(1, daysSincePublish);
        const commentsPerDay = video.statistics.commentCount / Math.max(1, daysSincePublish);
        
        // Normalize scores between 0 and 1
        const normalizedViews = Math.min(1, viewsPerDay / 10000); // Assuming 10k views/day is very good
        const normalizedComments = Math.min(1, commentsPerDay / 100); // Assuming 100 comments/day is very good
        
        return (normalizedViews * 0.7 + normalizedComments * 0.3);
    }

    private combineAnalysis(
        semanticAnalysis: any,
        contentAnalysis: any,
        ageAnalysis: any
    ): AnalysisResult {
        // Calculate combined scores
        const semanticScore = semanticAnalysis.semanticScore;
        const contentQuality = contentAnalysis.qualityIndicators.contentQuality;
        const temporalRelevance = ageAnalysis.temporalRelevance;

        // Generate recommendations
        const recommendations = this.generateRecommendations(
            semanticAnalysis,
            contentAnalysis,
            ageAnalysis
        );

        return {
            semanticScore,
            contentQuality,
            temporalRelevance,
            recommendations,
            metadata: {
                processingTime: 0, // Will be set by caller
                confidenceScores: {
                    semantic: 0,
                    content: 0,
                    temporal: 0
                }
            }
        };
    }

    private generateRecommendations(
        semanticAnalysis: any,
        contentAnalysis: any,
        ageAnalysis: any
    ): string[] {
        const recommendations: string[] = [];

        // Add semantic-based recommendations
        if (semanticAnalysis.semanticScore < 0.5) {
            recommendations.push('Content may not be fully relevant to the search query');
        }

        // Add content-based recommendations
        if (contentAnalysis.qualityIndicators.contentQuality < 0.7) {
            recommendations.push('Content quality could be improved');
        }

        // Add age-based recommendations
        if (ageAnalysis.temporalRelevance < 0.5) {
            recommendations.push('Content may be outdated');
        }

        return recommendations;
    }
} 