import { LoggingService } from '../loggingService';

export interface QueryPreferences {
    videoLength: 'short' | 'medium' | 'long';
    contentAge: 'recent' | 'allTime';
    maxResults: number;
}

export interface FormattedQuery {
    q: string;
    maxResults: number;
    videoDuration?: string;
    publishedAfter?: string;
    type: 'video';
    part: 'snippet,contentDetails,statistics';
}

export class QueryFormatter {
    private static instance: QueryFormatter;
    private readonly loggingService: LoggingService;

    private readonly VIDEO_DURATION_MAP = {
        short: 'short',      // < 4 minutes
        medium: 'medium',    // 4-20 minutes
        long: 'long'        // > 20 minutes
    };

    constructor(loggingService?: LoggingService) {
        this.loggingService = loggingService || LoggingService.getInstance();
    }

    public static getInstance(): QueryFormatter {
        if (!QueryFormatter.instance) {
            QueryFormatter.instance = new QueryFormatter();
        }
        return QueryFormatter.instance;
    }

    public formatQuery(keywords: string[], preferences: QueryPreferences): FormattedQuery {
        try {
            this.loggingService.log('Formatting YouTube API query', { keywords, preferences });

            const query: FormattedQuery = {
                q: this.formatKeywords(keywords),
                maxResults: this.calculateMaxResults(preferences.maxResults),
                type: 'video',
                part: 'snippet,contentDetails,statistics'
            };

            // Add video duration filter
            if (preferences.videoLength) {
                query.videoDuration = this.VIDEO_DURATION_MAP[preferences.videoLength];
            }

            // Add content age filter
            if (preferences.contentAge === 'recent') {
                query.publishedAfter = this.getLastYearDate();
            }

            this.loggingService.log('Formatted query', query);
            return query;
        } catch (error) {
            this.loggingService.logError('Error formatting query:', error);
            throw error;
        }
    }

    private formatKeywords(keywords: string[]): string {
        // Join keywords with proper YouTube search operators
        return keywords
            .map(keyword => `"${keyword.trim()}"`)
            .join(' | '); // Using OR operator for broader results
    }

    private calculateMaxResults(requested: number): number {
        // YouTube API has a max limit of 50 per request
        const MAX_RESULTS = 50;
        return Math.min(Math.max(1, requested), MAX_RESULTS);
    }

    private getLastYearDate(): string {
        const date = new Date();
        date.setFullYear(date.getFullYear() - 1);
        return date.toISOString();
    }
} 