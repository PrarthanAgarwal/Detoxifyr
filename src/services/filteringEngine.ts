import { VideoDetails, ChannelInfo } from '../types/youtube';
import { QualityMetrics, UserPreferences, QualityWeights } from '../types/quality';
import { QualityService } from './qualityService';
import { isValidVideoId } from '../utils/validationUtils';

export class FilteringEngine {
    private static instance: FilteringEngine;
    private qualityService: QualityService;
    private readonly BATCH_SIZE = 50;
    private readonly MAX_RETRIES = 3;
    private readonly RETRY_DELAY = 1000;

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
    ): Promise<{ videos: VideoDetails[]; metrics: Map<string, QualityMetrics> }> {
        try {
            if (!videos?.length) {
                console.warn('No videos provided to filter');
                return { videos: [], metrics: new Map() };
            }

            // Pre-process videos with more lenient validation
            const processedVideos = videos.filter(video => {
                if (!video) {
                    console.warn('Null or undefined video in input');
                    return false;
                }

                // Basic validation only
                if (!video.id || !video.channelId) {
                    console.warn(`Missing required fields for video: ${video.id}`);
                    return false;
                }

                return true;
            });

            if (processedVideos.length === 0) {
                console.warn('No valid videos after basic validation');
                return { videos: [], metrics: new Map() };
            }

            // Step 1: Get available channel data
            const uniqueChannelIds = [...new Set(processedVideos.map(v => v.channelId))];
            const availableChannels = uniqueChannelIds.filter(id => channels.has(id));
            
            if (availableChannels.length === 0) {
                console.warn('No channel data available');
                return { videos: [], metrics: new Map() };
            }

            // Continue with videos that have channel data
            const videosWithChannels = processedVideos.filter(video => 
                channels.has(video.channelId)
            );

            if (videosWithChannels.length === 0) {
                console.warn('No videos with available channel data');
                return { videos: [], metrics: new Map() };
            }

            // Step 2: Calculate initial metrics with more lenient thresholds
            const videoMetrics = await this.calculateBatchMetrics(
                videosWithChannels, 
                channels,
                searchQuery
            );

            if (!videoMetrics.size) {
                console.warn('No quality metrics calculated');
                return { videos: [], metrics: new Map() };
            }

            // Step 3: Apply very lenient initial filtering
            const initialFiltered = this.applyPreferencesFilter(
                videosWithChannels,
                videoMetrics,
                {
                    ...preferences,
                    minEngagementScore: preferences.minEngagementScore * 0.6,
                    minQualityScore: preferences.minQualityScore * 0.6,
                    minAuthorityScore: preferences.minAuthorityScore * 0.6,
                    minRelevancyScore: preferences.minRelevancyScore * 0.6
                }
            );

            if (initialFiltered.length === 0) {
                console.warn('No videos passed initial filtering');
                return { videos: [], metrics: videoMetrics };
            }

            // Step 4: Apply more lenient advanced filtering
            const advancedFiltered = this.applyAdvancedFilters(
                initialFiltered,
                videoMetrics,
                {
                    ...preferences,
                    minViewCount: Math.floor(preferences.minViewCount * 0.7),
                    minDuration: Math.floor(preferences.minDuration * 0.8),
                    maxDuration: Math.ceil(preferences.maxDuration * 1.2)
                }
            );

            if (advancedFiltered.length === 0) {
                console.warn('No videos passed advanced filtering');
                return { videos: initialFiltered.slice(0, preferences.numberOfVideos), metrics: videoMetrics };
            }

            // Step 5: Sort by weighted score
            const sortedVideos = this.sortByWeightedScore(
                advancedFiltered,
                videoMetrics,
                preferences.weights
            );

            return { 
                videos: sortedVideos.slice(0, preferences.numberOfVideos),
                metrics: videoMetrics 
            };
        } catch (error) {
            console.error('Error in filterAndRankContent:', error);
            return { videos: [], metrics: new Map() };
        }
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

    private applyPreferencesFilter(
        videos: VideoDetails[],
        metrics: Map<string, QualityMetrics>,
        preferences: UserPreferences
    ): VideoDetails[] {
        return videos.filter(video => {
            // Validate video ID first
            if (!isValidVideoId(video.id)) {
                console.warn(`Skipping video with invalid ID: ${video.id}`);
                return false;
            }

            const videoMetrics = metrics.get(video.id);
            if (!videoMetrics) {
                console.warn(`No metrics found for video ${video.id}`);
                return false;
            }

            try {
                return this.meetsPreferences(videoMetrics, preferences);
            } catch (error) {
                console.error(`Error checking preferences for video ${video.id}:`, error);
                return false;
            }
        });
    }

    private applyAdvancedFilters(
        videos: VideoDetails[],
        _metrics: Map<string, QualityMetrics>,
        preferences: UserPreferences
    ): VideoDetails[] {
        return videos.filter(video => {
            try {
                // Apply view count threshold
                if (video.viewCount < preferences.minViewCount) return false;

                // Apply content length filter
                const duration = this.parseDuration(video.duration || '');
                if (duration < preferences.minDuration || duration > preferences.maxDuration) return false;

                // Apply language filter if specified
                if (preferences.languagePreferences && preferences.languagePreferences.length > 0) {
                    const videoLanguage = video.defaultLanguage || 'en';
                    if (!preferences.languagePreferences.includes(videoLanguage)) return false;
                }

                // Apply region code filter if specified
                if (preferences.regionCode && video.regionRestriction) {
                    if (video.regionRestriction.blocked?.includes(preferences.regionCode)) return false;
                    if (video.regionRestriction.allowed && !video.regionRestriction.allowed.includes(preferences.regionCode)) return false;
                }

                return true;
            } catch (error) {
                console.warn(`Error applying advanced filters to video ${video.id}:`, error);
                return false;
            }
        });
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

    private meetsPreferences(
        metrics: QualityMetrics,
        preferences: UserPreferences
    ): boolean {
        try {
            return (
                metrics.engagementScore >= preferences.minEngagementScore &&
                metrics.authorityScore >= preferences.minAuthorityScore &&
                metrics.contentQualityScore >= preferences.minQualityScore &&
                metrics.freshnessScore >= (1 - preferences.maxContentAge / 365) &&
                metrics.relevancyScore >= preferences.minRelevancyScore
            );
        } catch (error) {
            console.warn('Error checking preferences:', error);
            return false;
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