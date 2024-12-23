import { GPTQueryOptimizer } from '../GPTQueryOptimizer';
import { LoggingService } from '../../loggingService';

describe('GPTQueryOptimizer', () => {
    let optimizer: GPTQueryOptimizer;
    let mockLoggingService: jest.Mocked<LoggingService>;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Setup mock implementations
        mockLoggingService = {
            getInstance: jest.fn().mockReturnThis(),
            log: jest.fn(),
            logError: jest.fn()
        } as unknown as jest.Mocked<LoggingService>;

        // Create a new instance with mocked dependencies
        optimizer = new GPTQueryOptimizer(mockLoggingService);
    });

    describe('optimizeQuery', () => {
        it('should format semantic similarity query correctly', () => {
            const params = {
                concept1: 'machine learning',
                concept2: 'artificial intelligence'
            };

            const result = optimizer.optimizeQuery('semantic_similarity', params);

            expect(result.prompt).toContain('Concept 1: machine learning');
            expect(result.prompt).toContain('Concept 2: artificial intelligence');
            expect(result.options.type).toBe('semantic_similarity');
            expect(mockLoggingService.log).toHaveBeenCalled();
        });

        it('should format keyword importance query correctly', () => {
            const params = {
                keyword: 'neural networks'
            };

            const result = optimizer.optimizeQuery('keyword_importance', params);

            expect(result.prompt).toContain('Keyword: neural networks');
            expect(result.options.type).toBe('keyword_importance');
            expect(mockLoggingService.log).toHaveBeenCalled();
        });

        it('should handle custom configuration', () => {
            const params = {
                concept1: 'test',
                concept2: 'example'
            };

            const config = {
                maxTokens: 200,
                temperature: 0.5
            };

            const result = optimizer.optimizeQuery('semantic_similarity', params, config);

            expect(result.config.maxTokens).toBe(200);
            expect(result.config.temperature).toBe(0.5);
            expect(result.config.retryCount).toBe(3); // Default value
        });

        it('should truncate long queries', () => {
            const longText = 'a'.repeat(1000);
            const params = {
                content: longText,
                context: 'test context'
            };

            const result = optimizer.optimizeQuery('content_analysis', params);

            expect(result.prompt.length).toBeLessThan(longText.length);
            expect(result.prompt).toContain('...');
            expect(mockLoggingService.log).toHaveBeenCalledWith(
                'Query exceeds context window, truncating...'
            );
        });

        it('should handle missing parameters gracefully', () => {
            const params = {
                concept1: 'test'
                // concept2 is missing
            };

            const result = optimizer.optimizeQuery('semantic_similarity', params);

            expect(result.prompt).toContain('Concept 1: test');
            expect(result.prompt).toContain('Concept 2: {concept2}');
        });

        it('should handle errors gracefully', () => {
            mockLoggingService.log.mockImplementation(() => {
                throw new Error('Logging error');
            });

            expect(() => {
                optimizer.optimizeQuery('semantic_similarity', {});
            }).toThrow();

            expect(mockLoggingService.logError).toHaveBeenCalled();
        });
    });
}); 