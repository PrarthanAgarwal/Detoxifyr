import { VideoDetails, ChannelInfo } from '../../types/youtube';
import { QualityMetrics } from '../../types/quality';
import { LoggingService } from '../loggingService';

export class SimplifiedQualityService {
    private static instance: SimplifiedQualityService;
    private loggingService: LoggingService;

    private readonly VIEW_RATIO_THRESHOLD = 0.01;
    private readonly COMMENT_RATIO_THRESHOLD = 0.001;
    private readonly SUBSCRIBER_THRESHOLD = 100000;

    private constructor() {
        this.loggingService = LoggingService.getInstance();
    }

    public static getInstance(): SimplifiedQualityService {
        if (!SimplifiedQualityService.instance) {
            SimplifiedQualityService.instance = new SimplifiedQualityService();
        }
        return SimplifiedQualityService.instance;
    }

    public async calculateVideoQuality(
        video: VideoDetails,
        channel: ChannelInfo,
        searchQuery?: string
    ): Promise<QualityMetrics> {
        try {
            const engagementScore = this.calculateEngagementScore(video);
            const authorityScore = this.calculateAuthorityScore(channel);
            const contentQualityScore = this.calculateContentQualityScore(video);
            const freshnessScore = this.calculateFreshnessScore(video.publishedAt);
            const relevancyScore = searchQuery ? this.calculateRelevancyScore(video, searchQuery) : 1;

            return {
                engagementScore,
                authorityScore,
                contentQualityScore,
                freshnessScore,
                relevancyScore,
                overallScore: this.calculateOverallScore({
                    engagementScore,
                    authorityScore,
                    contentQualityScore,
                    freshnessScore,
                    relevancyScore,
                    overallScore: 0,
                    confidence: 1
                }),
                confidence: 1
            };
        } catch (error) {
            this.loggingService.log('Error calculating video quality:', { error });
            throw error;
        }
    }

    private calculateEngagementScore(video: VideoDetails): number {
        const viewCount = video.statistics.viewCount || 0;
        const likeCount = video.statistics.likeCount || 0;
        const commentCount = video.statistics.commentCount || 0;

        const viewToLikeRatio = viewCount > 0 ? likeCount / viewCount : 0;
        const viewToCommentRatio = viewCount > 0 ? commentCount / viewCount : 0;

        const likeScore = Math.min(1, viewToLikeRatio / this.VIEW_RATIO_THRESHOLD);
        const commentScore = Math.min(1, viewToCommentRatio / this.COMMENT_RATIO_THRESHOLD);

        this.loggingService.logEngagementScoreComponents({
            likeScore,
            commentScore,
            viewToLikeRatio,
            viewToCommentRatio,
            finalScore: (likeScore * 0.6 + commentScore * 0.4)
        });

        return (likeScore * 0.6 + commentScore * 0.4);
    }

    private calculateAuthorityScore(channel: ChannelInfo): number {
        const subscriberCount = channel.statistics.subscriberCount;
        const viewCount = channel.statistics.viewCount;
        const videoCount = channel.statistics.videoCount;

        const subscriberScore = Math.min(1, Math.log10(subscriberCount) / Math.log10(this.SUBSCRIBER_THRESHOLD));
        const viewScore = Math.min(1, Math.log10(viewCount / Math.max(1, videoCount)) / 6);

        this.loggingService.logAuthorityScoreComponents({
            subscriberScore,
            viewScore,
            subscriberCount,
            totalViews: viewCount,
            videoCount,
            finalScore: (subscriberScore * 0.7 + viewScore * 0.3)
        });

        return (subscriberScore * 0.7 + viewScore * 0.3);
    }

    private calculateContentQualityScore(video: VideoDetails): number {
        const hasHD = video.thumbnails.high !== undefined;
        const hasCaptions = video.contentDetails.caption || false;
        const hasDescription = video.description.length > 100;
        const hasTags = (video.tags?.length || 0) > 0;

        const hdScore = hasHD ? 0.3 : 0;
        const captionScore = hasCaptions ? 0.3 : 0;
        const descriptionScore = hasDescription ? 0.2 : 0;
        const tagScore = hasTags ? 0.2 : 0;

        this.loggingService.logQualityScoreComponents({
            hdScore,
            captionScore,
            descriptionScore,
            tagScore,
            hasHD,
            hasCaptions,
            hasDescription,
            hasTags,
            finalScore: hdScore + captionScore + descriptionScore + tagScore
        });

        return hdScore + captionScore + descriptionScore + tagScore;
    }

    private calculateFreshnessScore(publishDate: Date): number {
        const ageInDays = (Date.now() - publishDate.getTime()) / (1000 * 60 * 60 * 24);
        return Math.max(0, 1 - (ageInDays / 365)); // Linear decay over one year
    }

    private calculateRelevancyScore(video: VideoDetails, searchQuery: string): number {
        const normalizedQuery = searchQuery.toLowerCase();
        const normalizedTitle = video.title.toLowerCase();
        const normalizedDescription = video.description.toLowerCase();
        const normalizedTags = video.tags?.map(tag => tag.toLowerCase()) || [];

        const titleMatch = normalizedTitle.includes(normalizedQuery) ? 1 : 0;
        const descriptionMatch = normalizedDescription.includes(normalizedQuery) ? 0.7 : 0;
        const keywordMatch = normalizedTags.some(tag => tag.includes(normalizedQuery)) ? 0.5 : 0;

        const finalScore = Math.min(1, titleMatch + descriptionMatch + keywordMatch);

        this.loggingService.logRelevancyScoreComponents({
            titleMatch,
            descriptionMatch,
            keywordMatch,
            query: searchQuery,
            finalScore
        });

        return finalScore;
    }

    private calculateOverallScore(metrics: QualityMetrics): number {
        return (
            metrics.engagementScore * 0.3 +
            metrics.authorityScore * 0.3 +
            metrics.contentQualityScore * 0.2 +
            metrics.freshnessScore * 0.1 +
            metrics.relevancyScore * 0.1
        );
    }
} 