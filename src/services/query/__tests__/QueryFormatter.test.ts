import { QueryFormatter, QueryPreferences } from '../QueryFormatter';
import { LoggingService } from '../../loggingService';

jest.mock('../../loggingService');

describe('QueryFormatter', () => {
    let formatter: QueryFormatter;
    let mockLoggingService: jest.Mocked<LoggingService>;

    beforeEach(() => {
        jest.clearAllMocks();

        mockLoggingService = {
            getInstance: jest.fn().mockReturnThis(),
            log: jest.fn(),
            logError: jest.fn()
        } as unknown as jest.Mocked<LoggingService>;

        formatter = new QueryFormatter(mockLoggingService);
    });

    describe('formatQuery', () => {
        it('should format keywords correctly', () => {
            const keywords = ['test', 'example'];
            const preferences: QueryPreferences = {
                videoLength: 'medium',
                contentAge: 'allTime',
                maxResults: 10
            };

            const result = formatter.formatQuery(keywords, preferences);

            expect(result.q).toBe('"test" | "example"');
            expect(result.maxResults).toBe(10);
            expect(result.videoDuration).toBe('medium');
            expect(result.publishedAfter).toBeUndefined();
        });

        it('should handle recent content age preference', () => {
            const keywords = ['test'];
            const preferences: QueryPreferences = {
                videoLength: 'short',
                contentAge: 'recent',
                maxResults: 5
            };

            const result = formatter.formatQuery(keywords, preferences);

            expect(result.publishedAfter).toBeDefined();
            const publishedAfter = new Date(result.publishedAfter!);
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            
            // Allow 1 second difference for test execution time
            expect(Math.abs(publishedAfter.getTime() - oneYearAgo.getTime())).toBeLessThan(1000);
        });

        it('should limit maxResults to 50', () => {
            const keywords = ['test'];
            const preferences: QueryPreferences = {
                videoLength: 'medium',
                contentAge: 'allTime',
                maxResults: 100
            };

            const result = formatter.formatQuery(keywords, preferences);

            expect(result.maxResults).toBe(50);
        });

        it('should handle empty keywords array', () => {
            const keywords: string[] = [];
            const preferences: QueryPreferences = {
                videoLength: 'medium',
                contentAge: 'allTime',
                maxResults: 10
            };

            const result = formatter.formatQuery(keywords, preferences);

            expect(result.q).toBe('');
            expect(result.type).toBe('video');
            expect(result.part).toBe('snippet,contentDetails,statistics');
        });

        it('should trim whitespace from keywords', () => {
            const keywords = [' test ', '  example  '];
            const preferences: QueryPreferences = {
                videoLength: 'long',
                contentAge: 'allTime',
                maxResults: 10
            };

            const result = formatter.formatQuery(keywords, preferences);

            expect(result.q).toBe('"test" | "example"');
        });

        it('should handle errors gracefully', () => {
            const keywords = ['test'];
            const preferences = null as unknown as QueryPreferences;

            expect(() => {
                formatter.formatQuery(keywords, preferences);
            }).toThrow();

            expect(mockLoggingService.logError).toHaveBeenCalled();
        });
    });
}); 