export class LoggingService {
    private static instance: LoggingService;
    private readonly logQueue: string[] = [];
    private readonly MAX_QUEUE_SIZE = 1000;

    private constructor() {}

    public static getInstance(): LoggingService {
        if (!LoggingService.instance) {
            LoggingService.instance = new LoggingService();
        }
        return LoggingService.instance;
    }

    public log(message: string, data?: any): void {
        const timestamp = new Date().toISOString();
        const logMessage = data
            ? `[${timestamp}] ${message} ${JSON.stringify(data)}`
            : `[${timestamp}] ${message}`;

        console.log(logMessage);
        this.queueLog(logMessage);
    }

    public logError(message: string, error?: any): void {
        const timestamp = new Date().toISOString();
        const errorDetails = error ? `: ${error.message || JSON.stringify(error)}` : '';
        const logMessage = `[${timestamp}] ERROR: ${message}${errorDetails}`;

        console.error(logMessage);
        this.queueLog(logMessage);
    }

    public logGPTError(error: Error, context: string): void {
        this.logError(`${context}: ${error.message}`, {
            name: error.name,
            stack: error.stack
        });
    }

    public startProcessing(): void {
        this.log('Starting processing');
    }

    public logInitialSearchResults(results: any[]): void {
        this.log(`Initial search results received`, { count: results.length });
    }

    public logStatisticalSummary(metrics: Map<string, any>): void {
        this.log('Statistical summary', Object.fromEntries(metrics));
    }

    public logPerformanceMetrics(): void {
        // TODO: Implement performance metrics logging
        this.log('Performance metrics logged');
    }

    public async saveLogs(): Promise<void> {
        // TODO: Implement log saving to file
        this.log('Logs saved');
    }

    private queueLog(message: string): void {
        this.logQueue.push(message);
        if (this.logQueue.length > this.MAX_QUEUE_SIZE) {
            this.logQueue.shift();
        }
    }

    public getLogs(): string[] {
        return [...this.logQueue];
    }

    public clearLogs(): void {
        this.logQueue.length = 0;
    }

    public logWarning(message: string, data?: any): void {
        const timestamp = new Date().toISOString();
        const logMessage = data
            ? `[${timestamp}] WARNING: ${message} ${JSON.stringify(data)}`
            : `[${timestamp}] WARNING: ${message}`;

        console.warn(logMessage);
        this.queueLog(logMessage);
    }

    public logEngagementScoreComponents(components: any): void {
        this.log('Engagement score components:', components);
    }

    public logAuthorityScoreComponents(components: any): void {
        this.log('Authority score components:', components);
    }

    public logQualityScoreComponents(components: any): void {
        this.log('Quality score components:', components);
    }

    public logRelevancyScoreComponents(components: any): void {
        this.log('Relevancy score components:', components);
    }

    public logTierAttempt(
        tier: number,
        criteria: any,
        failedVideos: Map<string, { videoId: string; metrics: any; failedCriteria: string[] }>
    ): void {
        this.log('Tier filtering attempt', {
            tier,
            criteria,
            failedVideosCount: failedVideos.size,
            failedVideos: Array.from(failedVideos.values()).map(v => ({
                videoId: v.videoId,
                failedCriteria: v.failedCriteria
            }))
        });
    }
} 