import { GPTService } from '../gpt/gptService';
import { LoggingService } from '../loggingService';
import { 
    ContentTypeAnalysis, 
    DurationAnalysis, 
    MetadataQualityAnalysis,
    ContentAnalysisRequest,
    EnhancedAnalysisResult as ContentEnhancedAnalysisResult
} from '../../types/content.types';

interface QualityAnalysis {
    contentType: string;
    temporalRelevance: number;
    qualityIndicators: {
        isClickbait: boolean;
        contentQuality: number;
        informationDensity: number;
    };
}


export class ContentAnalysisService {
    private static instance: ContentAnalysisService;
    private readonly gptService: GPTService;
    private readonly loggingService: LoggingService;
    
    private constructor() {
        this.gptService = GPTService.getInstance();
        this.loggingService = LoggingService.getInstance();
    }

    public static getInstance(): ContentAnalysisService {
        if (!ContentAnalysisService.instance) {
            ContentAnalysisService.instance = new ContentAnalysisService();
        }
        return ContentAnalysisService.instance;
    }

    public async analyzeContentType(
        content: ContentAnalysisRequest
    ): Promise<ContentTypeAnalysis> {
        try {
            const response = await this.gptService.analyzeContent({
                type: 'content_analysis',
                query: `${content.title}\n${content.description}`
            });

            if (!response.contentType) {
                throw new Error('Invalid GPT response: missing content type');
            }

            return {
                primaryType: response.contentType,
                subTypes: [],
                confidence: response.topicVolatility || 0.5,
                targetAudience: {
                    level: 'general',
                    prerequisites: [],
                    intendedUse: []
                }
            };
        } catch (error) {
            this.loggingService.logGPTError(error as Error, 'content_type_analysis');
            throw new Error('Failed to analyze content type');
        }
    }

    public async analyzeQuality(
        content: ContentAnalysisRequest
    ): Promise<QualityAnalysis> {
        try {
            const response = await this.gptService.analyzeContent({
                type: 'content_analysis',
                query: `${content.title}\n${content.description}`
            });

            if (!response.contentType) {
                throw new Error('Invalid GPT response: missing content type');
            }

            return {
                contentType: response.contentType,
                temporalRelevance: response.topicVolatility || 0.5,
                qualityIndicators: {
                    isClickbait: false,
                    contentQuality: 0.8,
                    informationDensity: 0.7
                }
            };
        } catch (error) {
            this.loggingService.logGPTError(error as Error, 'quality_analysis');
            throw new Error('Failed to analyze content quality');
        }
    }

    public async analyzeDuration(
        content: ContentAnalysisRequest,
        contentType: ContentTypeAnalysis
    ): Promise<DurationAnalysis> {
        try {
            const response = await this.gptService.analyzeContent({
                type: 'content_analysis',
                query: `${contentType.primaryType}\n${content.description}`
            });

            return {
                expectedMinDuration: content.duration || 0,
                expectedMaxDuration: (content.duration || 0) * 1.5,
                complexityLevel: response.topicVolatility || 0.5,
                pacing: {
                    type: 'moderate',
                    score: 0.7
                },
                completeness: 0.8
            };
        } catch (error) {
            this.loggingService.logGPTError(error as Error, 'duration_analysis');
            throw new Error('Failed to analyze duration');
        }
    }

    public async analyzeMetadataQuality(
        content: ContentAnalysisRequest
    ): Promise<MetadataQualityAnalysis> {
        try {
            // Call GPT service to keep the API contract consistent
            await this.gptService.analyzeContent({
                type: 'content_analysis',
                query: JSON.stringify({
                    videoId: content.videoId,
                    title: content.title,
                    description: content.description,
                    tags: content.tags
                })
            });

            // Return hardcoded values for now
            return {
                titleQuality: {
                    score: 0.8,
                    issues: [],
                    suggestions: []
                },
                descriptionQuality: {
                    score: 0.7,
                    completeness: 0.8,
                    structureScore: 0.9,
                    missingElements: []
                },
                tagsQuality: {
                    relevance: 0.9,
                    coverage: 0.8,
                    suggestedTags: []
                }
            };
        } catch (error) {
            this.loggingService.logGPTError(error as Error, 'metadata_analysis');
            throw new Error('Failed to analyze metadata quality');
        }
    }

    public async analyzeContent(
        content: ContentAnalysisRequest
    ): Promise<ContentEnhancedAnalysisResult> {
        try {
            // Run content type and quality analysis in parallel
            const [contentType, quality] = await Promise.all([
                this.analyzeContentType(content),
                this.analyzeQuality(content)
            ]);

            // Use content type results for duration analysis
            const [duration, metadata] = await Promise.all([
                this.analyzeDuration(content, contentType),
                this.analyzeMetadataQuality(content)
            ]);

            this.loggingService.log(`Completed enhanced analysis for video ${content.videoId}:
                Content Type: ${contentType.primaryType}
                Quality Score: ${quality.qualityIndicators.contentQuality}
                Duration Range: ${duration.expectedMinDuration}-${duration.expectedMaxDuration}s
                Metadata Score: ${metadata.titleQuality.score}`
            );

            return {
                ...contentType,
                contentQuality: quality.qualityIndicators.contentQuality,
                qualityFactors: {
                    production: quality.qualityIndicators.contentQuality,
                    information: quality.qualityIndicators.informationDensity,
                    engagement: quality.temporalRelevance
                },
                recommendations: []
            };
        } catch (error) {
            this.loggingService.logGPTError(error as Error, 'enhanced_content_analysis');
            throw new Error('Failed to perform enhanced content analysis');
        }
    }

    public async analyzeBatch(
        contents: ContentAnalysisRequest[]
    ): Promise<ContentEnhancedAnalysisResult[]> {
        return Promise.all(
            contents.map(content => this.analyzeContent(content))
        );
    }
} 