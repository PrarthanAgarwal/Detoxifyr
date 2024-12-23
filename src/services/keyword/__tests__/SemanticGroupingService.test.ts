import { SemanticGroupingService } from '../SemanticGroupingService';
import { GPTService } from '../../gpt/gptService';
import { LoggingService } from '../../loggingService';

jest.mock('../../gpt/gptService');
jest.mock('../../loggingService');

describe('SemanticGroupingService', () => {
    let service: SemanticGroupingService;
    let mockGPTService: jest.Mocked<GPTService>;
    let mockLoggingService: jest.Mocked<LoggingService>;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Setup mock implementations
        mockGPTService = {
            getInstance: jest.fn().mockReturnThis(),
            analyzeContent: jest.fn().mockResolvedValue({ similarityScore: 0.8 })
        } as unknown as jest.Mocked<GPTService>;

        mockLoggingService = {
            getInstance: jest.fn().mockReturnThis(),
            log: jest.fn(),
            logError: jest.fn()
        } as unknown as jest.Mocked<LoggingService>;

        // Create a new instance with mocked dependencies
        service = new SemanticGroupingService(mockGPTService, mockLoggingService);
    });

    describe('groupKeywords', () => {
        it('should group similar keywords together', async () => {
            const keywords = ['video', 'videos', 'film', 'movie', 'cinema'];
            
            // Mock similarity scores for different combinations
            mockGPTService.analyzeContent.mockImplementation(({ query }) => {
                // High similarity between video-related terms
                if (query.includes('"video"') && query.includes('"videos"')) {
                    return Promise.resolve({ 
                        similarityScore: 0.9,
                        analysis: 'High similarity between video terms'
                    });
                }
                // High similarity between film-related terms
                if ((query.includes('"film"') && query.includes('"movie"')) ||
                    (query.includes('"film"') && query.includes('"cinema"')) ||
                    (query.includes('"movie"') && query.includes('"cinema"'))) {
                    return Promise.resolve({ 
                        similarityScore: 0.85,
                        analysis: 'High similarity between film terms'
                    });
                }
                // Low similarity between video and film terms
                if ((query.includes('"video"') || query.includes('"videos"')) &&
                    (query.includes('"film"') || query.includes('"movie"') || query.includes('"cinema"'))) {
                    return Promise.resolve({ 
                        similarityScore: 0.3,
                        analysis: 'Low similarity between video and film terms'
                    });
                }
                return Promise.resolve({ 
                    similarityScore: 0.3,
                    analysis: 'Default low similarity'
                });
            });

            const result = await service.groupKeywords(keywords);

            expect(result).toHaveLength(2); // Should create 2 groups
            
            // Video group
            const videoGroup = result.find(g => g.primaryKeyword === 'video');
            expect(videoGroup).toBeDefined();
            expect(videoGroup?.relatedKeywords).toContain('videos');
            expect(videoGroup?.relatedKeywords).not.toContain('film');
            expect(videoGroup?.relatedKeywords).not.toContain('movie');
            expect(videoGroup?.relatedKeywords).not.toContain('cinema');

            // Film group
            const filmGroup = result.find(g => g.primaryKeyword === 'film');
            expect(filmGroup).toBeDefined();
            expect(filmGroup?.relatedKeywords).toContain('movie');
            expect(filmGroup?.relatedKeywords).toContain('cinema');
            expect(filmGroup?.relatedKeywords).not.toContain('video');
            expect(filmGroup?.relatedKeywords).not.toContain('videos');
        });

        it('should handle empty keyword list', async () => {
            const result = await service.groupKeywords([]);
            expect(result).toHaveLength(0);
        });

        it('should handle single keyword', async () => {
            const result = await service.groupKeywords(['test']);
            expect(result).toHaveLength(1);
            expect(result[0].primaryKeyword).toBe('test');
            expect(result[0].relatedKeywords).toHaveLength(0);
        });

        it('should respect maxGroupSize configuration', async () => {
            const keywords = ['a', 'b', 'c', 'd', 'e', 'f'];
            mockGPTService.analyzeContent.mockResolvedValue({ 
                similarityScore: 0.8,
                analysis: 'Mock similarity analysis'
            });

            const result = await service.groupKeywords(keywords, { maxGroupSize: 3 });

            result.forEach(group => {
                expect(group.relatedKeywords.length).toBeLessThanOrEqual(2); // primary + 2 related = 3 total
            });
        });

        it('should handle GPT service errors gracefully', async () => {
            const keywords = ['test1', 'test2'];
            const error = new Error('GPT service error');
            mockGPTService.analyzeContent.mockRejectedValue(error);

            const result = await service.groupKeywords(keywords);

            expect(result).toHaveLength(2);
            expect(mockLoggingService.logError).toHaveBeenCalledWith(
                'Error calculating keyword similarity',
                error
            );
            result.forEach(group => {
                expect(group.semanticScore).toBe(0.5); // Default score on error
            });
        });
    });

    describe('calculateSimilarity', () => {
        it('should return similarity score from GPT service', async () => {
            const expectedScore = 0.75;
            mockGPTService.analyzeContent.mockResolvedValue({ 
                similarityScore: expectedScore,
                analysis: 'Mock similarity analysis'
            });

            const result = await service.calculateSimilarity('word1', 'word2');
            expect(result).toBe(expectedScore);
            expect(mockGPTService.analyzeContent).toHaveBeenCalledWith({
                type: 'semantic_similarity',
                query: 'Compare the semantic similarity between "word1" and "word2"'
            });
        });

        it('should handle GPT service errors', async () => {
            const error = new Error('GPT service error');
            mockGPTService.analyzeContent.mockRejectedValue(error);

            const result = await service.calculateSimilarity('word1', 'word2');
            expect(result).toBe(0.5); // Default score on error
            expect(mockLoggingService.logError).toHaveBeenCalledWith(
                'Error calculating keyword similarity',
                error
            );
        });
    });
}); 