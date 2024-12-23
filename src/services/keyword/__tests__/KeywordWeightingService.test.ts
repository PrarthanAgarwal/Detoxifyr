import { KeywordWeightingService } from '../KeywordWeightingService';
import { GPTService } from '../../gpt/gptService';
import { LoggingService } from '../../loggingService';
import { SearchContext, UserFeedback } from '../../../types/semantic.types';

describe('KeywordWeightingService', () => {
    let service: KeywordWeightingService;
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
        service = new KeywordWeightingService(mockGPTService, mockLoggingService);
    });

    describe('calculateWeight', () => {
        it('should calculate weights for a keyword with full context', async () => {
            const context: SearchContext = {
                userPreferences: ['tech', 'programming'],
                searchHistory: ['javascript', 'typescript'],
                currentCategory: 'development',
                lastUsedTimestamp: Date.now() - 24 * 60 * 60 * 1000, // 1 day ago
                historicalPerformance: [0.7, 0.8, 0.9]
            };

            const result = await service.calculateWeight('react', context);

            expect(result.keyword).toBe('react');
            expect(result.baseWeight).toBeGreaterThan(0);
            expect(result.contextualWeight).toBeGreaterThan(0);
            expect(result.temporalWeight).toBeGreaterThan(0);
            expect(result.performanceWeight).toBeGreaterThan(0);

            expect(mockGPTService.analyzeContent).toHaveBeenCalledTimes(2);
            expect(mockLoggingService.log).toHaveBeenCalled();
        });

        it('should handle missing context gracefully', async () => {
            const context: SearchContext = {};
            const result = await service.calculateWeight('react', context);

            expect(result.keyword).toBe('react');
            expect(result.baseWeight).toBeGreaterThan(0);
            expect(result.baseWeight).toBeLessThanOrEqual(0.4);
            expect(result.contextualWeight).toBeGreaterThan(0);
            expect(result.contextualWeight).toBeLessThanOrEqual(0.3);
            expect(result.temporalWeight).toBe(0.2);
            expect(result.performanceWeight).toBe(0.1);
        });

        it('should handle GPT service errors', async () => {
            const error = new Error('GPT service error');
            mockGPTService.analyzeContent.mockRejectedValue(error);

            const context: SearchContext = {};
            const result = await service.calculateWeight('react', context);

            expect(result.keyword).toBe('react');
            expect(result.baseWeight).toBe(0.4);
            expect(mockLoggingService.logError).toHaveBeenCalledWith(
                'Error calculating base weight for react',
                error
            );
        });
    });

    describe('adjustWeight', () => {
        it('should boost weight for relevant feedback', () => {
            const initialWeight = {
                keyword: 'react',
                baseWeight: 0.4,
                contextualWeight: 0.3,
                temporalWeight: 0.2,
                performanceWeight: 0.5
            };

            const feedback: UserFeedback = {
                isRelevant: true,
                score: 0.9,
                timestamp: Date.now()
            };

            const result = service.adjustWeight(initialWeight, feedback);

            expect(result.performanceWeight).toBeGreaterThan(initialWeight.performanceWeight);
            expect(mockLoggingService.log).toHaveBeenCalled();
        });

        it('should reduce weight for irrelevant feedback', () => {
            const initialWeight = {
                keyword: 'react',
                baseWeight: 0.4,
                contextualWeight: 0.3,
                temporalWeight: 0.2,
                performanceWeight: 0.5
            };

            const feedback: UserFeedback = {
                isRelevant: false,
                score: 0.2,
                timestamp: Date.now()
            };

            const result = service.adjustWeight(initialWeight, feedback);

            expect(result.performanceWeight).toBeLessThan(initialWeight.performanceWeight);
            expect(mockLoggingService.log).toHaveBeenCalled();
        });

        it('should handle errors gracefully', () => {
            const initialWeight = {
                keyword: 'react',
                baseWeight: 0.4,
                contextualWeight: 0.3,
                temporalWeight: 0.2,
                performanceWeight: 0.5
            };

            mockLoggingService.log.mockImplementation(() => {
                throw new Error('Logging error');
            });

            const feedback: UserFeedback = {
                isRelevant: true,
                score: 0.9,
                timestamp: Date.now()
            };

            const result = service.adjustWeight(initialWeight, feedback);

            expect(result).toEqual(initialWeight);
            expect(mockLoggingService.logError).toHaveBeenCalled();
        });
    });
}); 