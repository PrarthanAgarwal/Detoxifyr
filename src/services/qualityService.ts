import { 
    QualityMetrics, 
    EngagementMetrics, 
    AuthorityMetrics,
    ContentQualityMetrics,
    VideoMetadata
} from '../types/quality';
import { VideoDetails, ChannelInfo } from '../types/youtube';

// First, define the weights interface
interface QualityWeights {
    engagement: number;
    authority: number;
    quality: number;
    freshness: number;
    relevancy: number;
}

export class QualityService {
    private static instance: QualityService;
    private readonly SUBSCRIBER_THRESHOLD = 100000;
    private readonly VIEW_RATIO_THRESHOLD = 0.01; // 1% engagement
    private readonly COMMENT_RATIO_THRESHOLD = 0.001; // 0.1% comment rate
    private readonly MAX_AGE_DAYS = 365; // 1 year
    private readonly MIN_DESCRIPTION_LENGTH = 100;

    private constructor() {}

    public static getInstance(): QualityService {
        if (!QualityService.instance) {
            QualityService.instance = new QualityService();
        }
        return QualityService.instance;
    }

    public async calculateVideoQuality(
        video: VideoDetails,
        channel: ChannelInfo,
        searchQuery?: string
    ): Promise<QualityMetrics> {
        try {
            const metadata = this.extractVideoMetadata(video);
            const engagementMetrics = this.calculateEngagementMetrics(video);
            const authorityMetrics = this.calculateAuthorityMetrics(channel);
            const contentQualityMetrics = this.calculateContentQualityMetrics(video);

            const engagementScore = this.calculateEngagementScore(engagementMetrics);
            const authorityScore = this.calculateAuthorityScore(authorityMetrics);
            const contentQualityScore = this.calculateContentQualityScore(contentQualityMetrics);
            const freshnessScore = this.calculateFreshnessScore(metadata.publishDate);
            const relevancyScore = searchQuery ? 
                this.calculateRelevancyScore(video, metadata, searchQuery) : 1;

            const metrics = {
                engagementScore,
                authorityScore,
                contentQualityScore,
                freshnessScore,
                relevancyScore,
                overallScore: 0,
                confidence: this.calculateConfidenceScore({
                    engagementScore,
                    authorityScore,
                    contentQualityScore,
                    freshnessScore,
                    relevancyScore,
                    overallScore: 0,
                    confidence: 0
                })
            };

            metrics.overallScore = this.calculateOverallScore(metrics);

            return metrics;
        } catch (error) {
            console.error('Error calculating video quality:', error);
            throw new Error(`Failed to calculate video quality: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private calculateEngagementMetrics(video: VideoDetails): EngagementMetrics {
        try {
            const viewCount = video.viewCount || 0;
            const likeCount = video.likeCount || 0;
            const commentCount = video.commentCount || 0;
            const publishDate = new Date(video.publishedAt);
            const daysSincePublish = Math.max(1, (Date.now() - publishDate.getTime()) / (1000 * 60 * 60 * 24));

            const totalEngagements = likeCount + commentCount;
            const engagementTrend = totalEngagements / daysSincePublish;

            return {
                viewToLikeRatio: viewCount > 0 ? likeCount / viewCount : 0,
                viewToCommentRatio: viewCount > 0 ? commentCount / viewCount : 0,
                avgDailyViews: viewCount / daysSincePublish,
                totalEngagements,
                engagementTrend
            };
        } catch (error) {
            console.error('Error calculating engagement metrics:', error);
            throw new Error('Failed to calculate engagement metrics');
        }
    }

    private calculateAuthorityMetrics(channel: ChannelInfo): AuthorityMetrics {
        try {
            const channelAge = (Date.now() - new Date(channel.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 365);
            const uploadFrequency = channel.videoCount / channelAge;
            const consistencyScore = this.calculateConsistencyScore(channel);

            return {
                subscriberCount: channel.subscriberCount,
                isVerified: channel.subscriberCount > this.SUBSCRIBER_THRESHOLD,
                totalViews: channel.totalViews,
                avgVideoViews: channel.totalViews / Math.max(1, channel.videoCount),
                channelAge,
                uploadFrequency,
                consistencyScore
            };
        } catch (error) {
            console.error('Error calculating authority metrics:', error);
            throw new Error('Failed to calculate authority metrics');
        }
    }

    private calculateContentQualityMetrics(video: VideoDetails): ContentQualityMetrics {
        try {
            const thumbnailQuality = this.calculateThumbnailQuality(video.thumbnails);
            const productionValue = this.calculateProductionValue(video);
            const audioQuality = this.estimateAudioQuality(video);

            return {
                hasHDVideo: video.thumbnails.high !== undefined,
                hasCaptions: video.hasCaptions || false,
                descriptionQuality: this.calculateDescriptionQuality(video.description),
                titleQuality: this.calculateTitleQuality(video.title),
                thumbnailQuality,
                productionValue,
                audioQuality
            };
        } catch (error) {
            console.error('Error calculating content quality metrics:', error);
            throw new Error('Failed to calculate content quality metrics');
        }
    }

    private extractVideoMetadata(video: VideoDetails): VideoMetadata {
        return {
            publishDate: new Date(video.publishedAt),
            keywords: this.extractKeywords(video.description),
            category: 'default', // This would need to be fetched from API
            duration: 0 // This would need to be fetched from API
        };
    }

    private calculateEngagementScore(metrics: EngagementMetrics): number {
        const likeScore = Math.min(1, metrics.viewToLikeRatio / this.VIEW_RATIO_THRESHOLD);
        const commentScore = Math.min(1, metrics.viewToCommentRatio / this.COMMENT_RATIO_THRESHOLD);
        const viewScore = Math.min(1, Math.log10(metrics.avgDailyViews) / 5);

        return (likeScore * 0.4 + commentScore * 0.3 + viewScore * 0.3);
    }

    private calculateAuthorityScore(metrics: AuthorityMetrics): number {
        const subscriberScore = Math.min(1, Math.log10(metrics.subscriberCount) / 7);
        const verificationScore = metrics.isVerified ? 1 : 0.5;
        const viewScore = Math.min(1, Math.log10(metrics.avgVideoViews) / 6);

        return (subscriberScore * 0.4 + verificationScore * 0.3 + viewScore * 0.3);
    }

    private calculateContentQualityScore(metrics: ContentQualityMetrics): number {
        const hdScore = metrics.hasHDVideo ? 1 : 0.5;
        const captionScore = metrics.hasCaptions ? 1 : 0.7;
        
        return (
            hdScore * 0.3 +
            captionScore * 0.2 +
            metrics.descriptionQuality * 0.25 +
            metrics.titleQuality * 0.25
        );
    }

    private calculateFreshnessScore(publishDate: Date): number {
        const ageInDays = (Date.now() - publishDate.getTime()) / (1000 * 60 * 60 * 24);
        return Math.max(0, 1 - (ageInDays / this.MAX_AGE_DAYS));
    }

    private calculateRelevancyScore(
        video: VideoDetails,
        metadata: VideoMetadata,
        searchQuery: string
    ): number {
        try {
            // Normalize all text for comparison
            const normalizedQuery = searchQuery.toLowerCase();
            const normalizedTitle = video.title.toLowerCase();
            const normalizedDescription = video.description.toLowerCase();
            const normalizedKeywords = metadata.keywords.map(k => k.toLowerCase());

            // Calculate exact matches first
            const exactMatchScore = this.calculateExactMatchScore(
                normalizedQuery,
                normalizedTitle,
                normalizedDescription,
                normalizedKeywords
            );

            // Calculate partial matches
            const queryTerms = new Set(normalizedQuery.split(/\s+/).filter(term => term.length > 2));
            const titleTerms = new Set(normalizedTitle.split(/\s+/));
            const descriptionTerms = new Set(normalizedDescription.split(/\s+/));

            const titleMatchScore = this.calculateTermOverlap(queryTerms, titleTerms);
            const descriptionMatchScore = this.calculateTermOverlap(queryTerms, descriptionTerms);
            const keywordMatchScore = this.calculateTermOverlap(
                queryTerms,
                new Set(normalizedKeywords)
            );

            // Combine scores with weights
            return (
                exactMatchScore * 0.4 +
                titleMatchScore * 0.3 +
                descriptionMatchScore * 0.2 +
                keywordMatchScore * 0.1
            );
        } catch (error) {
            console.warn('Error calculating relevancy score:', error);
            return 0.5; // Return neutral score on error
        }
    }

    private calculateExactMatchScore(
        query: string,
        title: string,
        description: string,
        keywords: string[]
    ): number {
        const hasExactTitleMatch = title.includes(query);
        const hasExactDescriptionMatch = description.includes(query);
        const hasExactKeywordMatch = keywords.some(k => k.includes(query));

        return (
            (hasExactTitleMatch ? 1 : 0) * 0.5 +
            (hasExactDescriptionMatch ? 1 : 0) * 0.3 +
            (hasExactKeywordMatch ? 1 : 0) * 0.2
        );
    }

    private calculateTermOverlap(queryTerms: Set<string>, contentTerms: Set<string>): number {
        if (queryTerms.size === 0) return 1;
        
        let matchCount = 0;
        for (const term of queryTerms) {
            for (const contentTerm of contentTerms) {
                if (contentTerm.includes(term)) {
                    matchCount++;
                    break;
                }
            }
        }
        
        return matchCount / queryTerms.size;
    }

    private calculateOverallScore(metrics: QualityMetrics): number {
        return (
            metrics.engagementScore * 0.25 +
            metrics.authorityScore * 0.25 +
            metrics.contentQualityScore * 0.2 +
            metrics.freshnessScore * 0.15 +
            metrics.relevancyScore * 0.15
        );
    }

    private calculateWeightedScore(metrics: QualityMetrics, weights: QualityWeights): number {
        const scores = {
            engagement: metrics.engagementScore * weights.engagement,
            authority: metrics.authorityScore * weights.authority,
            quality: metrics.contentQualityScore * weights.quality,
            freshness: metrics.freshnessScore * weights.freshness,
            relevancy: metrics.relevancyScore * weights.relevancy
        };

        const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
        const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
        
        return totalScore / totalWeight;
    }

    private calculateConfidenceScore(metrics: QualityMetrics): number {
        const validScores = [
            metrics.engagementScore,
            metrics.authorityScore,
            metrics.contentQualityScore,
            metrics.freshnessScore,
            metrics.relevancyScore
        ].filter(score => score !== undefined && score !== null && !isNaN(score));

        return validScores.length / 5;
    }

    public calculateOverallQuality(
        metrics: QualityMetrics, 
        weights: QualityWeights
    ): { score: number; confidence: number } {
        return {
            score: this.calculateWeightedScore(metrics, weights),
            confidence: this.calculateConfidenceScore(metrics)
        };
    }

    private calculateDescriptionQuality(description: string): number {
        const length = description.length;
        const hasLinks = description.includes('http');
        const hasFormatting = description.includes('\n');
        
        const lengthScore = Math.min(1, length / this.MIN_DESCRIPTION_LENGTH);
        const formatScore = (hasLinks ? 0.5 : 0) + (hasFormatting ? 0.5 : 0);
        
        return (lengthScore * 0.7 + formatScore * 0.3);
    }

    private calculateTitleQuality(title: string): number {
        const length = title.length;
        const hasKeywords = title.split(' ').length >= 3;
        const isClickbait = this.detectClickbait(title);
        
        const lengthScore = Math.min(1, length / 50);
        const keywordScore = hasKeywords ? 1 : 0.5;
        const clickbaitPenalty = isClickbait ? 0.5 : 1;
        
        return (lengthScore * 0.3 + keywordScore * 0.3 + clickbaitPenalty * 0.4);
    }

    private extractKeywords(text: string): string[] {
        // Remove special characters and split into words
        const words = text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2);

        // Remove common stop words and duplicates
        const stopWords = new Set(['the', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'with']);
        return [...new Set(words)].filter(word => !stopWords.has(word));
    }

    private detectClickbait(title: string): boolean {
        const clickbaitPatterns = [
            /you won't believe/i,
            /shocking/i,
            /amazing/i,
            /\d+ (things|ways|reasons)/i,
            /\(.*gone.*wrong\)/i,
            /!{2,}/
        ];
        return clickbaitPatterns.some(pattern => pattern.test(title));
    }

    private calculateConsistencyScore(channel: ChannelInfo): number {
        try {
            if (!channel.recentUploads || channel.recentUploads.length < 2) {
                return 0.5; // Default score for insufficient data
            }

            // Sort uploads by date in descending order
            const sortedUploads = [...channel.recentUploads].sort((a, b) => 
                new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
            );

            // Calculate time gaps between consecutive uploads
            const uploadGaps = sortedUploads.slice(1).map((upload, index) => {
                const currentDate = new Date(upload.publishedAt).getTime();
                const previousDate = new Date(sortedUploads[index].publishedAt).getTime();
                return currentDate - previousDate;
            });

            if (uploadGaps.length === 0) return 0.5;

            // Calculate average gap and variance
            const avgGap = uploadGaps.reduce((sum, gap) => sum + gap, 0) / uploadGaps.length;
            const gapVariance = uploadGaps.reduce((sum, gap) => sum + Math.pow(gap - avgGap, 2), 0) / uploadGaps.length;
            
            // Normalize the consistency score
            return Math.max(0, 1 - Math.sqrt(gapVariance) / avgGap);
        } catch (error) {
            console.warn('Error calculating consistency score:', error);
            return 0.5;
        }
    }

    private calculateThumbnailQuality(thumbnails: VideoDetails['thumbnails']): number {
        try {
            const hasHighRes = thumbnails.maxres || thumbnails.high;
            const hasCustomThumbnail = !thumbnails.default?.url.includes('vi/');
            const aspectRatio = thumbnails.high ? thumbnails.high.width / thumbnails.high.height : 16/9;
            
            return (
                (hasHighRes ? 0.4 : 0) +
                (hasCustomThumbnail ? 0.4 : 0) +
                (Math.abs(aspectRatio - 16/9) < 0.1 ? 0.2 : 0)
            );
        } catch (error) {
            console.warn('Error calculating thumbnail quality:', error);
            return 0.5;
        }
    }

    private calculateProductionValue(video: VideoDetails): number {
        try {
            const hasHighQualityThumbnail = video.thumbnails.maxres !== undefined;
            const hasDescription = video.description.length > 100;
            const hasTags = (video.tags?.length ?? 0) > 0;
            const hasCustomTitle = !video.title.toLowerCase().includes('video') && video.title.length > 20;

            return (
                (hasHighQualityThumbnail ? 0.3 : 0) +
                (hasDescription ? 0.3 : 0) +
                (hasTags ? 0.2 : 0) +
                (hasCustomTitle ? 0.2 : 0)
            );
        } catch (error) {
            console.warn('Error calculating production value:', error);
            return 0.5;
        }
    }

    private estimateAudioQuality(video: VideoDetails): number {
        try {
            // Estimate audio quality based on available metadata
            const hasHighQualityAudio = video.contentDetails?.audioQuality === 'hd';
            const hasCaptions = video.hasCaptions;
            const isMusic = video.categoryId === '10'; // Music category

            return (
                (hasHighQualityAudio ? 0.5 : 0.3) +
                (hasCaptions ? 0.3 : 0) +
                (isMusic ? 0.2 : 0.1)
            );
        } catch (error) {
            console.warn('Error estimating audio quality:', error);
            return 0.5;
        }
    }
} 