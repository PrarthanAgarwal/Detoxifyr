import { GPTRelevancyScoring } from '../GPTRelevancyScoring';
import { GPTService } from '../../gpt/gptService';
import { VideoDetails } from '../../../types/youtube';

jest.mock('../../gpt/gptService');
jest.mock('../../loggingService');

describe('GPTRelevancyScoring', () => {
    let gptRelevancyScoring: GPTRelevancyScoring;
    let mockGPTService: jest.Mocked<GPTService>;

    beforeEach(() => {
        jest.clearAllMocks();
        gptRelevancyScoring = GPTRelevancyScoring.getInstance();
        mockGPTService = GPTService.getInstance() as jest.Mocked<GPTService>;
    });

    const mockVideo: VideoDetails = {
        id: 'test-video',
        title: 'How to Build a React App',
        description: 'A comprehensive tutorial on building modern React applications with best practices.',
        publishedAt: new Date(),
        thumbnails: {
            default: { url: '', width: 120, height: 90 },
            medium: { url: '', width: 320, height: 180 },
            high: { url: '', width: 480, height: 360 }
        },
        channelId: 'test-channel',
        channelTitle: 'Tech Tutorials',
        tags: ['react', 'javascript', 'web development', 'tutorial'],
        statistics: {
            viewCount: 1000,
            likeCount: 100,
            commentCount: 50
        },
        contentDetails: {
            duration: 'PT15M',
            dimension: 'hd',
            definition: 'hd',
            caption: true,
            licensedContent: true,
            projection: 'rectangular'
        }
    };

    it('should analyze relevancy with GPT integration', async () => {
        mockGPTService.analyzeContent.mockResolvedValue({
            similarityScore: 0.85,
            analysis: 'High relevance detected',
            topicalRelevance: 0.9,
            contextualRelevance: 0.8,
            intentAlignment: 0.85,
            contentDepth: 0.75
        });

        const result = await gptRelevancyScoring.analyzeRelevancy(
            mockVideo,
            'react tutorial for beginners'
        );

        expect(result.score).toBeGreaterThan(0.8);
        expect(result.confidence).toBe(0.85);
        expect(result.aspects.topicalRelevance).toBe(0.9);
        expect(result.explanation).toContain('Content is highly relevant to the search topic');
    });

    it('should handle GPT service errors gracefully', async () => {
        mockGPTService.analyzeContent.mockRejectedValue(new Error('GPT service error'));

        const result = await gptRelevancyScoring.analyzeRelevancy(
            mockVideo,
            'react tutorial'
        );

        expect(result.score).toBe(0.5);
        expect(result.confidence).toBe(0.5);
        expect(result.explanation).toContain('Fallback scoring used due to analysis error');
    });

    it('should provide detailed aspect analysis', async () => {
        mockGPTService.analyzeContent.mockResolvedValue({
            similarityScore: 0.75,
            analysis: 'Good relevance with detailed content',
            topicalRelevance: 0.8,
            contextualRelevance: 0.7,
            intentAlignment: 0.75,
            contentDepth: 0.9
        });

        const result = await gptRelevancyScoring.analyzeRelevancy(
            mockVideo,
            'react development guide'
        );

        expect(result.aspects).toEqual({
            topicalRelevance: 0.8,
            contextualRelevance: 0.7,
            intentAlignment: 0.75,
            contentDepth: 0.9
        });
        expect(result.explanation).toContain('Content provides comprehensive information');
    });

    it('should consider user context in analysis', async () => {
        const userContext = {
            skillLevel: 'beginner',
            preferredDuration: 'medium',
            topics: ['frontend', 'react']
        };

        mockGPTService.analyzeContent.mockResolvedValue({
            similarityScore: 0.9,
            analysis: 'Perfect match for beginner context',
            topicalRelevance: 0.95,
            contextualRelevance: 0.9,
            intentAlignment: 0.85,
            contentDepth: 0.8
        });

        const result = await gptRelevancyScoring.analyzeRelevancy(
            mockVideo,
            'react basics',
            userContext
        );

        expect(result.score).toBeGreaterThan(0.85);
        expect(result.aspects.contextualRelevance).toBe(0.9);
        expect(mockGPTService.analyzeContent).toHaveBeenCalledWith(
            expect.objectContaining({
                query: expect.stringContaining('User Context')
            })
        );
    });

    it('should fallback to basic relevancy calculation when GPT provides partial results', async () => {
        mockGPTService.analyzeContent.mockResolvedValue({
            similarityScore: 0.7,
            analysis: 'Partial analysis available'
            // Missing other aspects
        });

        const result = await gptRelevancyScoring.analyzeRelevancy(
            mockVideo,
            'react tutorial'
        );

        expect(result.score).toBeDefined();
        expect(result.aspects.topicalRelevance).toBeDefined();
        expect(result.aspects.contentDepth).toBeDefined();
        expect(result.explanation.length).toBeGreaterThan(0);
    });
}); 