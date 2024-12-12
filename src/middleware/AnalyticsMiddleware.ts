import { AnalyticsService } from '../services/analytics/AnalyticsService';
import { VideoMetadata } from '.././types/VideoMetadata';

export class AnalyticsMiddleware {
  private static instance: AnalyticsMiddleware;
  private analyticsService: AnalyticsService;

  private constructor() {
    this.analyticsService = AnalyticsService.getInstance();
  }

  static getInstance(): AnalyticsMiddleware {
    if (!AnalyticsMiddleware.instance) {
      AnalyticsMiddleware.instance = new AnalyticsMiddleware();
    }
    return AnalyticsMiddleware.instance;
  }

  onAppStart(): void {
    this.analyticsService.startSession();
    window.addEventListener('beforeunload', () => {
      this.analyticsService.endSession();
    });
  }

  onVideoView(video: VideoMetadata): void {
    try {
      this.analyticsService.trackVideoView(video);
    } catch (error) {
      console.error('Failed to track video view:', error);
      this.analyticsService.trackError(error as Error, 'video_view_tracking');
    }
  }

  onSearch(query: string): void {
    try {
      this.analyticsService.trackSearch(query);
    } catch (error) {
      console.error('Failed to track search:', error);
      this.analyticsService.trackError(error as Error, 'search_tracking');
    }
  }

  onFilterApply(filterName: string): void {
    try {
      this.analyticsService.trackFilterUsage(filterName);
    } catch (error) {
      console.error('Failed to track filter usage:', error);
      this.analyticsService.trackError(error as Error, 'filter_tracking');
    }
  }

  onError(error: Error, context: string): void {
    try {
      this.analyticsService.trackError(error, context);
    } catch (trackingError) {
      console.error('Failed to track error:', trackingError);
    }
  }

  attachErrorBoundary(): void {
    window.addEventListener('error', (event: ErrorEvent) => {
      this.onError(event.error, 'global_error');
    });

    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      this.onError(new Error(event.reason), 'unhandled_promise_rejection');
    });
  }
} 