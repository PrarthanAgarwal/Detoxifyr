import { VideoDetails, ChannelInfo } from '../types/youtube';
import { QualityMetrics, TierCriteria } from '../types/quality';

export class LoggingService {
    private static instance: LoggingService;
    private logBuffer: string[] = [];
    private startTime: number = 0;
    private apiCallCount: number = 0;
    private cacheHits: number = 0;
    private cacheMisses: number = 0;

    private constructor() {}

    public static getInstance(): LoggingService {
        if (!LoggingService.instance) {
            LoggingService.instance = new LoggingService();
        }
        return LoggingService.instance;
    }

    public startProcessing(): void {
        this.startTime = Date.now();
        this.logBuffer = [];
        this.apiCallCount = 0;
        this.cacheHits = 0;
        this.cacheMisses = 0;
    }

    public logInitialSearchResults(videos: VideoDetails[]): void {
        this.log('=== Initial Search Results ===');
        this.log(`Total videos found: ${videos.length}`);
        
        videos.forEach((video, index) => {
            this.log(`\nVideo ${index + 1}:`);
            this.log(`Title: ${video.title}`);
            this.log(`Channel: ${video.channelId}`);
            this.log(`Views: ${video.viewCount}`);
            this.log(`Likes: ${video.likeCount}`);
            this.log(`Comments: ${video.commentCount}`);
        });
    }

    public logAuthorityScoreComponents(
        video: VideoDetails,
        channel: ChannelInfo,
        subscriberScore: number,
        verificationScore: number,
        viewScore: number,
        finalScore: number
    ): void {
        this.log(`\n=== Authority Score Components for ${video.id} ===`);
        this.log(`Subscriber Count (${channel.subscriberCount}): ${subscriberScore}`);
        this.log(`Channel Age: ${this.calculateChannelAge(channel.createdAt)} years`);
        this.log(`Verification Status: ${verificationScore}`);
        this.log(`View Score (${channel.totalViews}): ${viewScore}`);
        this.log(`Final Authority Score: ${finalScore}`);
    }

    public logQualityScoreComponents(
        video: VideoDetails,
        hdScore: number,
        captionScore: number,
        descriptionScore: number,
        titleScore: number,
        finalScore: number
    ): void {
        this.log(`\n=== Quality Score Components for ${video.id} ===`);
        this.log(`HD Resolution: ${hdScore}`);
        this.log(`Captions Available: ${captionScore}`);
        this.log(`Description Quality: ${descriptionScore}`);
        this.log(`Title Quality: ${titleScore}`);
        this.log(`Final Quality Score: ${finalScore}`);
    }

    public logEngagementScoreComponents(
        video: VideoDetails,
        likeScore: number,
        commentScore: number,
        viewScore: number,
        finalScore: number
    ): void {
        this.log(`\n=== Engagement Score Components for ${video.id} ===`);
        this.log(`View-to-Like Ratio: ${likeScore}`);
        this.log(`Comment-to-View Ratio: ${commentScore}`);
        this.log(`Average Daily Views: ${viewScore}`);
        this.log(`Final Engagement Score: ${finalScore}`);
    }

    public logRelevancyScoreComponents(
        video: VideoDetails,
        titleMatch: number,
        descriptionMatch: number,
        keywordMatch: number,
        finalScore: number
    ): void {
        this.log(`\n=== Relevancy Score Components for ${video.id} ===`);
        this.log(`Title Match: ${titleMatch}`);
        this.log(`Description Match: ${descriptionMatch}`);
        this.log(`Keyword Match: ${keywordMatch}`);
        this.log(`Final Relevancy Score: ${finalScore}`);
    }

    public logTierAttempt(
        tier: number,
        criteria: TierCriteria,
        failedVideos: Map<string, { 
            videoId: string,
            metrics: QualityMetrics,
            failedCriteria: string[]
        }>
    ): void {
        this.log(`\n=== Tier ${tier} Filtering Attempt ===`);
        this.log('Required Thresholds:');
        this.log(`Authority: ${criteria.minAuthorityScore}`);
        this.log(`Quality: ${criteria.minQualityScore}`);
        this.log(`Engagement: ${criteria.minEngagementScore}`);
        this.log(`Relevancy: ${criteria.minRelevancyScore}`);

        this.log('\nFailed Videos Analysis:');
        failedVideos.forEach((data) => {
            this.log(`\nVideo ${data.videoId}:`);
            data.failedCriteria.forEach(criterion => {
                this.log(`Failed ${criterion}`);
            });
        });
    }

    public logStatisticalSummary(
        metrics: Map<string, QualityMetrics>
    ): void {
        this.log('\n=== Statistical Summary ===');
        
        const allMetrics = Array.from(metrics.values());
        const scores = {
            authority: allMetrics.map(m => m.authorityScore),
            quality: allMetrics.map(m => m.contentQualityScore),
            engagement: allMetrics.map(m => m.engagementScore),
            relevancy: allMetrics.map(m => m.relevancyScore)
        };

        Object.entries(scores).forEach(([type, values]) => {
            const stats = this.calculateStats(values);
            this.log(`\n${type.charAt(0).toUpperCase() + type.slice(1)} Scores:`);
            this.log(`Min: ${stats.min}`);
            this.log(`Max: ${stats.max}`);
            this.log(`Average: ${stats.avg}`);
            this.log(`Median: ${stats.median}`);
        });
    }

    public logPerformanceMetrics(): void {
        const duration = Date.now() - this.startTime;
        this.log('\n=== Performance Metrics ===');
        this.log(`Total Processing Time: ${duration}ms`);
        this.log(`API Calls: ${this.apiCallCount}`);
        this.log(`Cache Hit Ratio: ${this.cacheHits}/${this.cacheHits + this.cacheMisses}`);
    }

    public incrementApiCall(): void {
        this.apiCallCount++;
    }

    public incrementCacheHit(): void {
        this.cacheHits++;
    }

    public incrementCacheMiss(): void {
        this.cacheMisses++;
    }

    public getFullLog(): string {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        return `=== Detoxifyr Filtering Log (${timestamp}) ===\n\n${this.logBuffer.join('\n')}`;
    }

    public async saveLogs(): Promise<void> {
        try {
            const logContent = this.getFullLog();
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `filtering-log-${timestamp}.txt`;

            // Create a download URL for the log content
            const blob = new Blob([logContent], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);

            // Use chrome.downloads API to save the file
            chrome.downloads.download({
                url: url,
                filename: `Logs/${filename}`,
                saveAs: false,
                conflictAction: 'uniquify'
            }, (downloadId) => {
                // Clean up the URL after download starts
                URL.revokeObjectURL(url);
                
                if (chrome.runtime.lastError) {
                    console.error('Error saving logs:', chrome.runtime.lastError);
                } else {
                    console.log(`Logs saved with download ID: ${downloadId}`);
                }
            });
        } catch (error) {
            console.error('Error saving logs:', error);
            throw error;
        }
    }

    private log(message: string): void {
        this.logBuffer.push(message);
        console.log(message);
    }

    private calculateStats(values: number[]): { min: number; max: number; avg: number; median: number } {
        const sorted = [...values].sort((a, b) => a - b);
        return {
            min: sorted[0],
            max: sorted[sorted.length - 1],
            avg: values.reduce((a, b) => a + b, 0) / values.length,
            median: sorted[Math.floor(sorted.length / 2)]
        };
    }

    private calculateChannelAge(createdAt: string): number {
        const channelCreation = new Date(createdAt);
        const now = new Date();
        return (now.getTime() - channelCreation.getTime()) / (1000 * 60 * 60 * 24 * 365);
    }
} 