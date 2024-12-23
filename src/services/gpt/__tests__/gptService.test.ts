import { GPTService, GPTAnalysisOptions, GPTAnalysisType } from '../gptService';
import { LoggingService } from '../../loggingService';
import { GPTQueryOptimizer } from '../GPTQueryOptimizer';

jest.mock('../../loggingService');
jest.mock('../GPTQueryOptimizer');

describe('GPTService', () => {
    let service: GPTService;
    let mockLoggingService: jest.Mocked<LoggingService>;
    let mockQueryOptimizer: jest.Mocked<GPTQueryOptimizer>;

    beforeEach(() => {
        jest.clearAllMocks();

        mockLoggingService = {
            getInstance: jest.fn().mockReturnThis(),
            log: jest.fn(),
            logError: jest.fn()
        } as unknown as jest.Mocked<LoggingService>;

        mockQueryOptimizer = {
            optimizeQuery: jest.fn().mockReturnValue({
                prompt: 'optimized query',
                options: { type: 'semantic_similarity' },
                config: { maxTokens: 100 }
            })
        } as unknown as jest.Mocked<GPTQueryOptimizer>;

        // @ts-ignore - Constructor is actually public
        GPTQueryOptimizer.mockImplementation(() => mockQueryOptimizer);

        service = new GPTService(mockLoggingService);
    });

    describe('analyzeContent', () => {
        it('should analyze semantic similarity correctly', async () => {
            const options: GPTAnalysisOptions = {
                type: 'semantic_similarity',
                query: 'test query'
            };

            const result = await service.analyzeContent(options);

            expect(result.similarityScore).toBeDefined();
            expect(result.analysis).toContain('Mock semantic similarity analysis');
            expect(mockLoggingService.log).toHaveBeenCalled();
            expect(mockQueryOptimizer.optimizeQuery).toHaveBeenCalledWith(
                'semantic_similarity',
                { content: 'test query' },
                {}
            );
        });

        it('should analyze keyword importance correctly', async () => {
            const options: GPTAnalysisOptions = {
                type: 'keyword_importance',
                query: 'test keyword'
            };

            const result = await service.analyzeContent(options);

            expect(result.importanceScore).toBeDefined();
            expect(result.analysis).toContain('Mock keyword importance analysis');
            expect(mockLoggingService.log).toHaveBeenCalled();
        });

        it('should analyze content correctly', async () => {
            const options: GPTAnalysisOptions = {
                type: 'content_analysis',
                query: 'test content'
            };

            const result = await service.analyzeContent(options);

            expect(result.contentType).toBeDefined();
            expect(result.topicVolatility).toBeDefined();
            expect(result.updateFrequency).toBeDefined();
            expect(result.analysis).toContain('Mock content analysis');
            expect(mockLoggingService.log).toHaveBeenCalled();
        });

        it('should handle errors gracefully', async () => {
            const options: GPTAnalysisOptions = {
                type: 'semantic_similarity',
                query: 'test query'
            };

            mockQueryOptimizer.optimizeQuery.mockImplementation(() => {
                throw new Error('Optimization error');
            });

            await expect(service.analyzeContent(options)).rejects.toThrow('Optimization error');
            expect(mockLoggingService.logError).toHaveBeenCalled();
        });

        it('should throw error for unsupported analysis type', async () => {
            const options = {
                type: 'unsupported_type' as GPTAnalysisType,
                query: 'test query'
            };

            await expect(service.analyzeContent(options)).rejects.toThrow('Unsupported analysis type');
        });

        it('should pass custom config to query optimizer', async () => {
            const options: GPTAnalysisOptions = {
                type: 'semantic_similarity',
                query: 'test query'
            };

            const config = {
                maxTokens: 200,
                temperature: 0.8
            };

            await service.analyzeContent(options, config);

            expect(mockQueryOptimizer.optimizeQuery).toHaveBeenCalledWith(
                'semantic_similarity',
                { content: 'test query' },
                config
            );
        });
    });
}); 