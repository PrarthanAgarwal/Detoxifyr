import { VideoDetails, ChannelInfo } from '../types/youtube';
import { QualityMetrics, UserPreferences, QualityWeights, TieredQualityCriteria, TierCriteria } from '../types/quality';
import { QualityService } from './qualityService';
import { isValidVideoId } from '../utils/validationUtils';

export class FilteringEngine {
    private static instance: FilteringEngine;
    private qualityService: QualityService;
    private readonly BATCH_SIZE = 50;
    private readonly MAX_RETRIES = 3;
    private readonly RETRY_DELAY = 1000;
    private readonly DEFAULT_TIERED_CRITERIA: TieredQualityCriteria = {
        tier1: {
            minAuthorityScore: 0.5,
            minQualityScore: 0.5,
            minEngagementScore: 0.5,
            minRelevancyScore: 0.5,
            minViewCount: 1000,
            minDuration: 60,
            maxDuration: 3600,
            maxAgeInDays: 365,
            requiresCompleteness: true
        },
        tier2: {
            minAuthorityScore: 0.5,
            minQualityScore: 0.5,
            minEngagementScore: 0.3,
            minRelevancyScore: 0.4,
            minViewCount: 500,
            minDuration: 45,
            maxDuration: 4500,
            maxAgeInDays: 730,
            requiresCompleteness: true
        },
        tier3: {
            minAuthorityScore: 0.4,
            minQualityScore: 0.4,
            minEngagementScore: 0.2,
            minRelevancyScore: 0.3,
            minViewCount: 200,
            minDuration: 30,
            maxDuration: 5400,
            maxAgeInDays: 1095,
            requiresCompleteness: false
        },
        minimumAcceptableTier: 3,
        enforceStrictTierTransition: true
    };

    private constructor() {
        this.qualityService = QualityService.getInstance();
    }

    public static getInstance(): FilteringEngine {
        if (!FilteringEngine.instance) {
            FilteringEngine.instance = new FilteringEngine();
        }
        return FilteringEngine.instance;
    }

    public async filterAndRankContent(
        videos: VideoDetails[],
        channels: Map<string, ChannelInfo>,
        preferences: UserPreferences,
        searchQuery?: string
    ): Promise<{ videos: VideoDetails[]; metrics: Map<string, QualityMetrics>; usedTier: number }> {
        try {
            if (!videos?.length) {
                console.warn('No videos provided to filter');
                return { videos: [], metrics: new Map(), usedTier: 0 };
            }

            // Pre-process videos with basic validation
            const processedVideos = this.preProcessVideos(videos);
            if (processedVideos.length === 0) {
                return { videos: [], metrics: new Map(), usedTier: 0 };
            }

            // Calculate metrics for all videos
            const videoMetrics = await this.calculateBatchMetrics(
                processedVideos,
                channels,
                searchQuery
            );

            // Apply tiered filtering
            const { filteredVideos, usedTier } = await this.applyTieredFiltering(
                processedVideos,
                videoMetrics,
                preferences
            );

            // Sort the filtered videos
            const sortedVideos = this.sortByWeightedScore(
                filteredVideos,
                videoMetrics,
                preferences.weights
            );

            return {
                videos: sortedVideos.slice(0, preferences.numberOfVideos),
                metrics: videoMetrics,
                usedTier
            };
        } catch (error) {
            console.error('Error in filterAndRankContent:', error);
            return { videos: [], metrics: new Map(), usedTier: 0 };
        }
    }

    private preProcessVideos(videos: VideoDetails[]): VideoDetails[] {
        return videos.filter(video => {
            if (!video || !video.id || !video.channelId) {
                console.warn(`Invalid video data: ${video?.id}`);
                return false;
            }
            return isValidVideoId(video.id);
        });
    }

    private async applyTieredFiltering(
        videos: VideoDetails[],
        metrics: Map<string, QualityMetrics>,
        preferences: UserPreferences
    ): Promise<{ filteredVideos: VideoDetails[]; usedTier: number }> {
        const tieredCriteria = this.generateTieredCriteria(preferences);
        let filteredVideos: VideoDetails[] = [];
        let currentTier = 1;

        while (currentTier <= 3) {
            const tierCriteria = tieredCriteria[`tier${currentTier}` as keyof TieredQualityCriteria] as TierCriteria;
            
            console.log(`[Filtering] Attempting Tier ${currentTier}:`);
            console.log(`- Authority Score: ${tierCriteria.minAuthorityScore}`);
            console.log(`- Quality Score: ${tierCriteria.minQualityScore}`);
            console.log(`- Engagement Score: ${tierCriteria.minEngagementScore}`);
            console.log(`- Relevancy Score: ${tierCriteria.minRelevancyScore}`);
            
            filteredVideos = this.filterByTierCriteria(
                videos,
                metrics,
                tierCriteria,
                preferences
            );

            console.log(`[Filtering] Tier ${currentTier} results: ${filteredVideos.length} videos`);

            // Check if we have enough results or should try next tier
            if (filteredVideos.length >= 3 || currentTier === 3) {
                console.log(`[Filtering] Using Tier ${currentTier} - Found sufficient results or reached final tier`);
                break;
            }

            // Cache results before moving to next tier if enforcing strict transition
            if (tieredCriteria.enforceStrictTierTransition) {
                const previousResults = [...filteredVideos];
                currentTier++;
                
                // Merge with next tier results if available
                if (currentTier <= 3) {
                    console.log(`[Filtering] Attempting to merge with Tier ${currentTier} results`);
                    const nextTierResults = this.filterByTierCriteria(
                        videos,
                        metrics,
                        tieredCriteria[`tier${currentTier}` as keyof TieredQualityCriteria] as TierCriteria,
                        preferences
                    );
                    filteredVideos = [...previousResults, ...nextTierResults];
                    console.log(`[Filtering] After merge: ${filteredVideos.length} total videos`);
                }
            } else {
                currentTier++;
            }
        }

        // If we still don't have enough results and are above minimum acceptable tier
        if (filteredVideos.length < 3 && currentTier > tieredCriteria.minimumAcceptableTier) {
            console.warn(`[Filtering] Warning: Insufficient results (${filteredVideos.length}) at tier ${currentTier}`);
        }

        console.log(`[Filtering] Final results: Using Tier ${currentTier} with ${filteredVideos.length} videos`);
        return { filteredVideos, usedTier: currentTier };
    }

    private filterByTierCriteria(
        videos: VideoDetails[],
        metrics: Map<string, QualityMetrics>,
        criteria: TierCriteria,
        preferences: UserPreferences
    ): VideoDetails[] {
        return videos.filter(video => {
            const videoMetrics = metrics.get(video.id);
            if (!videoMetrics) return false;

            // Check core quality metrics
            if (
                videoMetrics.authorityScore < criteria.minAuthorityScore ||
                videoMetrics.contentQualityScore < criteria.minQualityScore ||
                videoMetrics.engagementScore < criteria.minEngagementScore ||
                videoMetrics.relevancyScore < criteria.minRelevancyScore
            ) {
                return false;
            }

            // Check additional criteria
            const duration = this.parseDuration(video.duration || '');
            const ageInDays = this.calculateAgeInDays(video.publishedAt);
            
            if (
                video.viewCount < criteria.minViewCount ||
                duration < criteria.minDuration ||
                duration > criteria.maxDuration ||
                ageInDays > criteria.maxAgeInDays
            ) {
                return false;
            }

            // Check completeness if required
            if (criteria.requiresCompleteness) {
                if (
                    !video.description ||
                    !video.thumbnails?.high ||
                    !video.title ||
                    (video.tags?.length || 0) === 0
                ) {
                    return false;
                }
            }

            // Apply user-specific preferences that shouldn't be relaxed
            if (preferences.languagePreferences?.length) {
                const videoLanguage = video.defaultLanguage || 'en';
                if (!preferences.languagePreferences.includes(videoLanguage)) {
                    return false;
                }
            }

            if (preferences.regionCode && video.regionRestriction) {
                if (
                    video.regionRestriction.blocked?.includes(preferences.regionCode) ||
                    (video.regionRestriction.allowed && !video.regionRestriction.allowed.includes(preferences.regionCode))
                ) {
                    return false;
                }
            }

            return true;
        });
    }

    private generateTieredCriteria(preferences: UserPreferences): TieredQualityCriteria {
        // Start with default criteria
        const criteria = { ...this.DEFAULT_TIERED_CRITERIA };

        // Adjust based on user preferences while maintaining tier relationships
        if (preferences.minAuthorityScore > criteria.tier1.minAuthorityScore) {
            const diff = preferences.minAuthorityScore - criteria.tier1.minAuthorityScore;
            criteria.tier1.minAuthorityScore += diff;
            criteria.tier2.minAuthorityScore += diff * 0.8;
            criteria.tier3.minAuthorityScore += diff * 0.6;
        }

        // Similar adjustments for other metrics...
        return criteria;
    }

    private calculateAgeInDays(publishedAt: string): number {
        const publishDate = new Date(publishedAt);
        const now = new Date();
        return Math.floor((now.getTime() - publishDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    private async calculateBatchMetrics(
        videos: VideoDetails[],
        channels: Map<string, ChannelInfo>,
        searchQuery?: string
    ): Promise<Map<string, QualityMetrics>> {
        const metrics = new Map<string, QualityMetrics>();
        const batches = this.createBatches(videos, this.BATCH_SIZE);

        try {
            // Process batches sequentially to avoid rate limits
            for (const batch of batches) {
                await this.processBatchWithRetry(batch, channels, metrics, searchQuery);
            }
            return metrics;
        } catch (error) {
            console.error('Error in calculateBatchMetrics:', error);
            return metrics; // Return partial results instead of throwing
        }
    }

    private async processBatchWithRetry(
        batch: VideoDetails[],
        channels: Map<string, ChannelInfo>,
        metrics: Map<string, QualityMetrics>,
        searchQuery?: string,
        attempt = 0
    ): Promise<void> {
        try {
            await this.processBatch(batch, channels, metrics, searchQuery);
        } catch (error) {
            if (attempt < this.MAX_RETRIES) {
                await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * Math.pow(2, attempt)));
                return this.processBatchWithRetry(batch, channels, metrics, searchQuery, attempt + 1);
            }
            throw error;
        }
    }

    private async processBatch(
        batch: VideoDetails[],
        channels: Map<string, ChannelInfo>,
        metrics: Map<string, QualityMetrics>,
        searchQuery?: string
    ): Promise<void> {
        const promises = batch.map(async video => {
            try {
                const channel = channels.get(video.channelId);
                if (!channel) {
                    console.warn(`Channel not found for video ${video.id}`);
                    return;
                }

                const qualityMetrics = await this.qualityService.calculateVideoQuality(
                    video,
                    channel,
                    searchQuery
                );

                if (qualityMetrics) {
                    metrics.set(video.id, qualityMetrics);
                }
            } catch (error) {
                console.error(`Error processing video ${video.id}:`, error);
            }
        });

        await Promise.allSettled(promises);
    }

    private sortByWeightedScore(
        videos: VideoDetails[],
        metrics: Map<string, QualityMetrics>,
        weights: QualityWeights
    ): VideoDetails[] {
        return [...videos].sort((a, b) => {
            try {
                const metricsA = metrics.get(a.id);
                const metricsB = metrics.get(b.id);

                if (!metricsA || !metricsB) return 0;

                const scoreA = this.calculateWeightedScore(metricsA, weights);
                const scoreB = this.calculateWeightedScore(metricsB, weights);

                return scoreB - scoreA;
            } catch (error) {
                console.warn('Error sorting videos:', error);
                return 0;
            }
        });
    }

    private calculateWeightedScore(metrics: QualityMetrics, weights: QualityWeights): number {
        try {
            const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
            
            return (
                (metrics.engagementScore * weights.engagement +
                metrics.authorityScore * weights.authority +
                metrics.contentQualityScore * weights.quality +
                metrics.freshnessScore * weights.freshness +
                metrics.relevancyScore * weights.relevancy) / totalWeight
            );
        } catch (error) {
            console.warn('Error calculating weighted score:', error);
            return 0;
        }
    }

    private parseDuration(duration: string): number {
        try {
            const matches = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
            if (!matches) return 0;

            const [, hours, minutes, seconds] = matches;
            return (
                (parseInt(hours || '0') * 3600) +
                (parseInt(minutes || '0') * 60) +
                parseInt(seconds || '0')
            );
        } catch (error) {
            console.warn('Error parsing duration:', error);
            return 0;
        }
    }

    private createBatches<T>(items: T[], batchSize: number): T[][] {
        const batches: T[][] = [];
        for (let i = 0; i < items.length; i += batchSize) {
            batches.push(items.slice(i, i + batchSize));
        }
        return batches;
    }
} 