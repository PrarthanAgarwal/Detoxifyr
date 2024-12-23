import { SimplifiedQualityService } from '../SimplifiedQualityService';
import { VideoDetails, ChannelInfo, ThumbnailInfo } from '../../../types/youtube';

jest.mock('../../loggingService');

describe('SimplifiedQualityService', () => {
    let qualityService: SimplifiedQualityService;

    beforeEach(() => {
        jest.clearAllMocks();
        qualityService = SimplifiedQualityService.getInstance();
    });

    const mockThumbnail: ThumbnailInfo = {
        url: '',
        width: 120,
        height: 90
    };

    const createMockVideo = (
        overrides: Partial<VideoDetails> = {}
    ): VideoDetails => ({
        id: 'test-video',
        title: 'Test Video',
        description: 'Test description that is long enough to be considered quality content',
        channelId: 'test-channel',
        channelTitle: 'Test Channel',
        publishedAt: new Date().toISOString(),
        thumbnails: {
            default: mockThumbnail,
            medium: mockThumbnail,
            high: mockThumbnail,
            maxres: mockThumbnail
        },
        viewCount: 10000,
        likeCount: 100,
        commentCount: 10,
        duration: 'PT5M',
        tags: ['test', 'video'],
        defaultLanguage: 'en',
        hasCaptions: true,
        ...overrides
    });

    const createMockChannel = (
        overrides: Partial<ChannelInfo> = {}
    ): ChannelInfo => ({
        id: 'test-channel',
        title: 'Test Channel',
        description: 'Test channel description',
        subscriberCount: 10000,
        videoCount: 100,
        totalViews: 1000000,
        createdAt: new Date().toISOString(),
        thumbnails: {
            default: mockThumbnail,
            medium: mockThumbnail,
            high: mockThumbnail
        },
        recentUploads: [],
        ...overrides
    });

    it('should calculate high engagement score for videos with good metrics', async () => {
        const video = createMockVideo({
            viewCount: 10000,
            likeCount: 500,
            commentCount: 50
        });

        const result = await qualityService.calculateVideoQuality(
            video,
            createMockChannel()
        );

        expect(result.engagementScore).toBeGreaterThan(0.7);
    });

    it('should calculate low engagement score for videos with poor metrics', async () => {
        const video = createMockVideo({
            viewCount: 10000,
            likeCount: 10,
            commentCount: 1
        });

        const result = await qualityService.calculateVideoQuality(
            video,
            createMockChannel()
        );

        expect(result.engagementScore).toBeLessThan(0.3);
    });

    it('should calculate high authority score for channels with many subscribers', async () => {
        const channel = createMockChannel({
            subscriberCount: 1000000,
            totalViews: 50000000,
            videoCount: 500
        });

        const result = await qualityService.calculateVideoQuality(
            createMockVideo(),
            channel
        );

        expect(result.authorityScore).toBeGreaterThan(0.7);
    });

    it('should calculate low authority score for new channels', async () => {
        const channel = createMockChannel({
            subscriberCount: 100,
            totalViews: 5000,
            videoCount: 10
        });

        const result = await qualityService.calculateVideoQuality(
            createMockVideo(),
            channel
        );

        expect(result.authorityScore).toBeLessThan(0.3);
    });

    it('should calculate high content quality score for well-produced videos', async () => {
        const video = createMockVideo({
            hasCaptions: true,
            description: 'A very detailed description of the video content...',
            tags: ['test', 'video', 'quality']
        });

        const result = await qualityService.calculateVideoQuality(
            video,
            createMockChannel()
        );

        expect(result.contentQualityScore).toBeGreaterThan(0.7);
    });

    it('should calculate low content quality score for poorly produced videos', async () => {
        const video = createMockVideo({
            hasCaptions: false,
            description: '',
            tags: [],
            thumbnails: {
                default: mockThumbnail,
                medium: mockThumbnail,
                high: mockThumbnail,
                maxres: mockThumbnail
            }
        });

        const result = await qualityService.calculateVideoQuality(
            video,
            createMockChannel()
        );

        expect(result.contentQualityScore).toBeLessThan(0.3);
    });

    it('should calculate high relevancy score for matching content', async () => {
        const video = createMockVideo({
            title: 'Test video about cats',
            description: 'A video about cats and their behavior',
            tags: ['cats', 'pets', 'animals']
        });

        const result = await qualityService.calculateVideoQuality(
            video,
            createMockChannel(),
            'cats'
        );

        expect(result.relevancyScore).toBeGreaterThan(0.7);
    });

    it('should calculate low relevancy score for unrelated content', async () => {
        const video = createMockVideo({
            title: 'Test video about dogs',
            description: 'A video about dogs and their behavior',
            tags: ['dogs', 'pets', 'animals']
        });

        const result = await qualityService.calculateVideoQuality(
            video,
            createMockChannel(),
            'cats'
        );

        expect(result.relevancyScore).toBeLessThan(0.3);
    });

    it('should handle missing data gracefully', async () => {
        const video = createMockVideo({
            viewCount: undefined,
            likeCount: undefined,
            commentCount: undefined,
            tags: undefined,
            description: undefined
        });

        const result = await qualityService.calculateVideoQuality(
            video,
            createMockChannel()
        );

        expect(result.engagementScore).toBeDefined();
        expect(result.contentQualityScore).toBeDefined();
        expect(result.overallScore).toBeDefined();
        expect(result.confidence).toBe(1);
    });

    it('should calculate freshness score based on publish date', async () => {
        const recentVideo = createMockVideo({
            publishedAt: new Date().toISOString()
        });

        const oldVideo = createMockVideo({
            publishedAt: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString() // 400 days old
        });

        const recentResult = await qualityService.calculateVideoQuality(
            recentVideo,
            createMockChannel()
        );

        const oldResult = await qualityService.calculateVideoQuality(
            oldVideo,
            createMockChannel()
        );

        expect(recentResult.freshnessScore).toBeGreaterThan(0.9);
        expect(oldResult.freshnessScore).toBeLessThan(0.1);
    });
}); 