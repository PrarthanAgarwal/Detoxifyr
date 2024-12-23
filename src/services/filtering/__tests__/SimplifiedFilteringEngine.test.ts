import { SimplifiedFilteringEngine } from '../SimplifiedFilteringEngine';
import { SimplifiedQualityService } from '../SimplifiedQualityService';
import { VideoDetails, ChannelInfo, ThumbnailInfo } from '../../../types/youtube';
import { QualityMetrics, UserPreferences } from '../../../types/quality';

jest.mock('../../qualityService');
jest.mock('../../loggingService');

describe('SimplifiedFilteringEngine', () => {
    let filteringEngine: SimplifiedFilteringEngine;
    let mockQualityService: jest.Mocked<SimplifiedQualityService>;

    beforeEach(() => {
        jest.clearAllMocks();
        filteringEngine = SimplifiedFilteringEngine.getInstance();
        mockQualityService = SimplifiedQualityService.getInstance() as jest.Mocked<SimplifiedQualityService>;
    });

    const mockThumbnail: ThumbnailInfo = {
        url: '',
        width: 120,
        height: 90
    };

    const mockVideo = (id: string, viewCount: number, duration: string): VideoDetails => ({
        id,
        title: `Video ${id}`,
        description: 'Test description',
        channelId: 'channel1',
        channelTitle: 'Test Channel',
        publishedAt: new Date(),
        thumbnails: {
            default: mockThumbnail,
            medium: mockThumbnail,
            high: mockThumbnail,
            maxres: mockThumbnail
        },
        tags: ['test'],
        statistics: {
            viewCount,
            likeCount: 100,
            commentCount: 50
        },
        contentDetails: {
            duration,
            dimension: 'hd',
            definition: 'hd',
            caption: true,
            licensedContent: true,
            projection: 'rectangular'
        }
    });

    const mockChannel = (id: string): ChannelInfo => ({
        id,
        title: 'Test Channel',
        description: 'Channel description',
        thumbnails: {
            default: mockThumbnail,
            medium: mockThumbnail,
            high: mockThumbnail
        },
        statistics: {
            viewCount: 1000000,
            subscriberCount: 10000,
            videoCount: 100
        },
        publishedAt: new Date(),
        subscriberCount: 10000,
        videoCount: 100,
        totalViews: 1000000,
        createdAt: new Date().toISOString(),
        recentUploads: []
    });

    const mockPreferences: UserPreferences = {
        numberOfVideos: 2,
        minEngagementScore: 0.3,
        minAuthorityScore: 0.4,
        minQualityScore: 0.4,
        minRelevancyScore: 0.3,
        maxContentAge: 365,
        minViewCount: 500,
        minDuration: 30,
        maxDuration: 5400,
        languagePreferences: ['en'],
        regionCode: 'US',
        videoLength: 'medium',
        contentAge: 'recent',
        weights: {
            engagement: 1,
            authority: 1,
            quality: 1,
            freshness: 1,
            relevancy: 1
        }
    };

    const mockMetrics = (
        authorityScore: number,
        qualityScore: number,
        engagementScore: number,
        relevancyScore: number
    ): QualityMetrics => ({
        authorityScore,
        contentQualityScore: qualityScore,
        engagementScore,
        relevancyScore,
        freshnessScore: 1,
        overallScore: 0,
        confidence: 1
    });

    it('should filter videos based on high quality tier criteria', async () => {
        const videos = [
            mockVideo('high1', 2000, 'PT2M'),
            mockVideo('high2', 1500, 'PT5M'),
            mockVideo('low1', 500, 'PT1M'),
            mockVideo('low2', 300, 'PT30S')
        ];

        const channels = new Map([['channel1', mockChannel('channel1')]]);

        mockQualityService.calculateVideoQuality.mockImplementation(async (video) => {
            if (video.id.startsWith('high')) {
                return mockMetrics(0.6, 0.6, 0.6, 0.6);
            }
            return mockMetrics(0.3, 0.3, 0.3, 0.3);
        });

        const result = await filteringEngine.filterAndRankContent(videos, channels, mockPreferences);

        expect(result.videos).toHaveLength(2);
        expect(result.videos.map(v => v.id)).toEqual(['high1', 'high2']);
        expect(result.usedTier).toBe('high');
    });

    it('should fall back to standard tier when not enough high quality videos', async () => {
        const videos = [
            mockVideo('med1', 800, 'PT3M'),
            mockVideo('med2', 600, 'PT4M'),
            mockVideo('low1', 400, 'PT2M')
        ];

        const channels = new Map([['channel1', mockChannel('channel1')]]);

        mockQualityService.calculateVideoQuality.mockImplementation(async (video) => {
            if (video.id.startsWith('med')) {
                return mockMetrics(0.45, 0.45, 0.35, 0.35);
            }
            return mockMetrics(0.2, 0.2, 0.2, 0.2);
        });

        const result = await filteringEngine.filterAndRankContent(videos, channels, mockPreferences);

        expect(result.videos).toHaveLength(2);
        expect(result.videos.map(v => v.id)).toEqual(['med1', 'med2']);
        expect(result.usedTier).toBe('standard');
    });

    it('should handle empty video list', async () => {
        const result = await filteringEngine.filterAndRankContent([], new Map(), mockPreferences);

        expect(result.videos).toHaveLength(0);
        expect(result.metrics.size).toBe(0);
        expect(result.usedTier).toBe('standard');
    });

    it('should handle missing channel information', async () => {
        const videos = [mockVideo('test1', 1000, 'PT3M')];
        const result = await filteringEngine.filterAndRankContent(videos, new Map(), mockPreferences);

        expect(result.videos).toHaveLength(0);
        expect(result.usedTier).toBe('standard');
    });

    it('should sort videos by overall quality score', async () => {
        const videos = [
            mockVideo('high1', 2000, 'PT5M'),
            mockVideo('high2', 2500, 'PT4M')
        ];

        const channels = new Map([['channel1', mockChannel('channel1')]]);

        mockQualityService.calculateVideoQuality.mockImplementation(async (video) => {
            return video.id === 'high1' 
                ? mockMetrics(0.8, 0.8, 0.8, 0.8)
                : mockMetrics(0.6, 0.6, 0.6, 0.6);
        });

        const result = await filteringEngine.filterAndRankContent(videos, channels, mockPreferences);

        expect(result.videos.map(v => v.id)).toEqual(['high1', 'high2']);
    });
}); 