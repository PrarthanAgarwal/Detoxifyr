import { VideoDetails, ChannelInfo } from '../../types/youtube';
import { QualityMetrics, UserPreferences } from '../../types/quality';
import { SimplifiedQualityService } from './SimplifiedQualityService';
import { GPTRelevancyScoring } from '../scoring/GPTRelevancyScoring';
import { LoggingService } from '../loggingService';
import {
    FilteringTierCriteria,
    HIGH_QUALITY_TIER,
    STANDARD_QUALITY_TIER,
    SCORING_WEIGHTS,
    GPT_RELEVANCY_CONFIG,
    CONTENT_AGE_SCORING,
    VIDEO_LENGTH_PREFERENCES,
    VideoLengthPreference
} from '../../config/filteringConfig';

interface EnhancedQualityMetrics extends QualityMetrics {
    gptRelevancy?: {
        score: number;
        confidence: number;
        aspects: {
            topicalRelevance: number;
            contextualRelevance: number;
            intentAlignment: number;
            contentDepth: number;
        };
        explanation: string[];
    };
}

export class SimplifiedFilteringEngine {
    private static instance: SimplifiedFilteringEngine;
    private qualityService: SimplifiedQualityService;
    private gptRelevancyScoring: GPTRelevancyScoring;
    private loggingService: LoggingService;
    private selectedLengthPreference: VideoLengthPreference = VIDEO_LENGTH_PREFERENCES.standard;

    constructor(
        loggingService: LoggingService,
        qualityService: SimplifiedQualityService,
        gptRelevancyScoring: GPTRelevancyScoring,
        lengthPreference: keyof typeof VIDEO_LENGTH_PREFERENCES = 'standard'
    ) {
        this.loggingService = loggingService;
        this.qualityService = qualityService;
        this.gptRelevancyScoring = gptRelevancyScoring;
        this.selectedLengthPreference = VIDEO_LENGTH_PREFERENCES[lengthPreference];
    }

    public static getInstance(): SimplifiedFilteringEngine {
        if (!SimplifiedFilteringEngine.instance) {
            SimplifiedFilteringEngine.instance = new SimplifiedFilteringEngine(
                LoggingService.getInstance(),
                SimplifiedQualityService.getInstance(),
                GPTRelevancyScoring.getInstance()
            );
        }
        return SimplifiedFilteringEngine.instance;
    }

    public setLengthPreference(preference: keyof typeof VIDEO_LENGTH_PREFERENCES) {
        this.selectedLengthPreference = VIDEO_LENGTH_PREFERENCES[preference];
        this.loggingService.log('Updated video length preference', {
            type: preference,
            preference: this.selectedLengthPreference
        });
    }

    public async filterAndRankContent(
        videos: VideoDetails[],
        channels: Map<string, ChannelInfo>,
        preferences: UserPreferences,
        searchQuery?: string
    ): Promise<{ videos: VideoDetails[]; metrics: Map<string, QualityMetrics>; usedTier: 'high' | 'standard' }> {
        try {
            this.loggingService.log('Starting content filtering and ranking', {
                videoCount: videos?.length,
                channelCount: channels.size,
                searchQuery
            });

            if (!videos?.length) {
                this.loggingService.log('No videos provided for filtering');
                return { videos: [], metrics: new Map(), usedTier: 'standard' };
            }

            const videoMetrics = await this.calculateMetrics(videos, channels, searchQuery);
            
            // Try high quality tier first
            let filteredVideos = this.filterByTier(videos, videoMetrics, HIGH_QUALITY_TIER);
            let usedTier: 'high' | 'standard' = 'high';
            
            // If not enough videos, try standard tier
            if (filteredVideos.length < preferences.numberOfVideos) {
                this.loggingService.log('Insufficient high quality videos, falling back to standard tier');
                filteredVideos = this.filterByTier(videos, videoMetrics, STANDARD_QUALITY_TIER);
                usedTier = 'standard';
            }

            // If still no videos, try without duration filter
            if (filteredVideos.length === 0) {
                this.loggingService.log('No videos passed duration filter, trying without duration restrictions');
                const originalPreference = this.selectedLengthPreference;
                
                // Temporarily disable duration filtering
                this.selectedLengthPreference = {
                    ...originalPreference,
                    minDuration: 0,
                    maxDuration: Number.MAX_SAFE_INTEGER
                };
                
                filteredVideos = this.filterByTier(videos, videoMetrics, STANDARD_QUALITY_TIER);
                
                // Restore original preference
                this.selectedLengthPreference = originalPreference;
            }

            // Apply weighted scoring and sort
            const sortedVideos = this.sortByWeightedScore(filteredVideos, videoMetrics)
                .slice(0, preferences.numberOfVideos);

            this.loggingService.log('Completed filtering and ranking', {
                finalCount: sortedVideos.length,
                tier: usedTier,
                metrics: {
                    averageQuality: this.calculateAverageScore(sortedVideos, videoMetrics, 'contentQualityScore'),
                    averageRelevancy: this.calculateAverageScore(sortedVideos, videoMetrics, 'relevancyScore')
                }
            });

            return {
                videos: sortedVideos,
                metrics: videoMetrics,
                usedTier
            };

        } catch (error) {
            this.loggingService.logError('Error in filterAndRankContent:', error);
            return { videos: [], metrics: new Map(), usedTier: 'standard' };
        }
    }

    private async calculateMetrics(
        videos: VideoDetails[],
        channels: Map<string, ChannelInfo>,
        searchQuery?: string
    ): Promise<Map<string, EnhancedQualityMetrics>> {
        const metrics = new Map<string, EnhancedQualityMetrics>();

        await Promise.all(videos.map(async (video) => {
            try {
                // Validate required video data
                if (!video || !video.contentDetails) {
                    this.loggingService.log('Invalid video data structure', {
                        videoId: video?.id,
                        hasContentDetails: !!video?.contentDetails
                    });
                    return;
                }

                const channel = channels.get(video.channelId);
                if (!channel) {
                    this.loggingService.log('Channel not found for video', {
                        videoId: video.id,
                        channelId: video.channelId
                    });
                    return;
                }

                // Create default statistics if missing
                const statistics = video.statistics || {
                    viewCount: '0',
                    likeCount: '0',
                    commentCount: '0'
                };

                // Ensure all required statistics exist and are numbers
                const validatedVideo = {
                    ...video,
                    statistics: {
                        viewCount: Number(statistics.viewCount) || 0,
                        likeCount: Number(statistics.likeCount) || 0,
                        commentCount: Number(statistics.commentCount) || 0
                    }
                };

                // Get base metrics with validated data
                const baseMetrics = await this.qualityService.calculateVideoQuality(validatedVideo, channel);
                
                // Get GPT relevancy if search query exists
                let gptRelevancy;
                if (searchQuery) {
                    gptRelevancy = await this.gptRelevancyScoring.analyzeRelevancy(validatedVideo, searchQuery);
                }

                // Calculate freshness score
                const freshnessScore = this.calculateFreshnessScore(video.publishedAt);

                metrics.set(video.id, {
                    ...baseMetrics,
                    gptRelevancy,
                    freshnessScore
                });

            } catch (error) {
                this.loggingService.logError(`Error calculating metrics for video ${video?.id}:`, error);
                // Add fallback metrics for error cases
                metrics.set(video.id, this.getFallbackMetrics());
            }
        }));

        return metrics;
    }

    private getFallbackMetrics(): EnhancedQualityMetrics {
        return {
            authorityScore: 0,
            contentQualityScore: 0,
            engagementScore: 0,
            relevancyScore: 0,
            freshnessScore: 0,
            overallScore: 0,
            confidence: 0
        };
    }

    private filterByTier(
        videos: VideoDetails[],
        metrics: Map<string, EnhancedQualityMetrics>,
        criteria: FilteringTierCriteria
    ): VideoDetails[] {
        const failedCriteria = new Map<string, string[]>();

        const filteredVideos = videos.filter(video => {
            const videoMetrics = metrics.get(video.id);
            if (!videoMetrics) {
                failedCriteria.set(video.id, ['No metrics available']);
                return false;
            }

            const failures: string[] = [];
            const duration = this.getVideoDuration(video);
            const ageInDays = this.calculateAgeInDays(video.publishedAt);

            // Check all criteria with more lenient approach
            if (videoMetrics.authorityScore < criteria.minAuthorityScore) {
                failures.push(`Authority score below threshold: ${videoMetrics.authorityScore}`);
            }
            if (videoMetrics.contentQualityScore < criteria.minQualityScore) {
                failures.push(`Quality score below threshold: ${videoMetrics.contentQualityScore}`);
            }
            if (videoMetrics.engagementScore < criteria.minEngagementScore) {
                failures.push(`Engagement score below threshold: ${videoMetrics.engagementScore}`);
            }
            if (videoMetrics.relevancyScore < criteria.minRelevancyScore) {
                // Check if GPT relevancy can compensate
                const gptScore = videoMetrics.gptRelevancy?.score || 0;
                if (gptScore < GPT_RELEVANCY_CONFIG.minSemanticScore) {
                    failures.push(`Relevancy score below threshold: ${videoMetrics.relevancyScore}`);
                }
            }
            if (video.statistics.viewCount < criteria.minViewCount) {
                failures.push(`View count below minimum: ${video.statistics.viewCount}`);
            }

            // Duration check based on user preference, not tier criteria
            if (duration < this.selectedLengthPreference.minDuration) {
                failures.push(`Duration too short: ${duration}s`);
            }
            if (duration > this.selectedLengthPreference.maxDuration) {
                failures.push(`Duration too long: ${duration}s`);
            }

            if (ageInDays > criteria.maxAgeInDays) {
                failures.push(`Content too old: ${ageInDays} days`);
            }

            if (failures.length > 0) {
                failedCriteria.set(video.id, failures);
                return false;
            }

            return true;
        });

        // Log filtering results
        this.loggingService.log('Applied tier filtering', {
            totalVideos: videos.length,
            passedVideos: filteredVideos.length,
            failedVideos: failedCriteria.size,
            criteria: {
                minAuthorityScore: criteria.minAuthorityScore,
                minQualityScore: criteria.minQualityScore,
                minEngagementScore: criteria.minEngagementScore,
                minRelevancyScore: criteria.minRelevancyScore,
                minViewCount: criteria.minViewCount,
                maxAge: `${criteria.maxAgeInDays} days`
            }
        });

        if (failedCriteria.size > 0) {
            this.loggingService.log('Videos failed filtering criteria', {
                failureDetails: Object.fromEntries(failedCriteria)
            });
        }

        return filteredVideos;
    }

    private sortByWeightedScore(
        videos: VideoDetails[],
        metrics: Map<string, EnhancedQualityMetrics>
    ): VideoDetails[] {
        return [...videos].sort((a, b) => {
            const metricsA = metrics.get(a.id);
            const metricsB = metrics.get(b.id);

            if (!metricsA || !metricsB) return 0;

            const scoreA = this.calculateWeightedScore(metricsA);
            const scoreB = this.calculateWeightedScore(metricsB);

            return scoreB - scoreA;
        });
    }

    private calculateWeightedScore(metrics: EnhancedQualityMetrics): number {
        return (
            metrics.authorityScore * SCORING_WEIGHTS.authority +
            metrics.contentQualityScore * SCORING_WEIGHTS.quality +
            metrics.engagementScore * SCORING_WEIGHTS.engagement +
            metrics.relevancyScore * SCORING_WEIGHTS.relevancy +
            (metrics.freshnessScore || 0) * SCORING_WEIGHTS.freshness
        ) / Object.values(SCORING_WEIGHTS).reduce((a, b) => a + b, 0);
    }

    private calculateFreshnessScore(publishDate: Date): number {
        const ageInDays = this.calculateAgeInDays(publishDate);
        
        if (ageInDays <= CONTENT_AGE_SCORING.recentThreshold) {
            return CONTENT_AGE_SCORING.scoringCurve.recent;
        } else if (ageInDays <= CONTENT_AGE_SCORING.mediumThreshold) {
            return CONTENT_AGE_SCORING.scoringCurve.medium;
        } else if (ageInDays <= HIGH_QUALITY_TIER.maxAgeInDays) {
            return CONTENT_AGE_SCORING.scoringCurve.old;
        } else {
            return CONTENT_AGE_SCORING.scoringCurve.archived;
        }
    }

    private calculateAgeInDays(publishDate: Date): number {
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - new Date(publishDate).getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    private getVideoDuration(video: VideoDetails): number {
        try {
            const duration = video.contentDetails?.duration;
            if (!duration) return 0;
            
            // Convert ISO 8601 duration to seconds
            const matches = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
            if (!matches) return 0;
            
            const [_, hours, minutes, seconds] = matches;
            return (Number(hours || 0) * 3600) + (Number(minutes || 0) * 60) + Number(seconds || 0);
        } catch (error) {
            this.loggingService.logError('Error parsing video duration', error);
            return 0;
        }
    }

    private calculateAverageScore(
        videos: VideoDetails[],
        metrics: Map<string, QualityMetrics>,
        metric: keyof QualityMetrics
    ): number {
        const scores = videos
            .map(v => metrics.get(v.id)?.[metric] || 0)
            .filter(score => score > 0);
            
        return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    }
} 