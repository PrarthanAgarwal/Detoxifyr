import { VideoMetadata } from '../../types/VideoMetadata';

export interface AnalyticsEvent {
  eventType: string;
  timestamp: number;
  data: Record<string, any>;
}

export interface SessionMetrics {
  sessionId: string;
  startTime: number;
  endTime?: number;
  videosViewed: number;
  searchQueries: string[];
  filterUsage: Record<string, number>;
}

export class AnalyticsService {
  private static instance: AnalyticsService;
  private currentSession: SessionMetrics | null = null;
  private events: AnalyticsEvent[] = [];
  private readonly LOCAL_STORAGE_KEY = 'detoxifyr_analytics';

  private constructor() {
    this.loadEventsFromStorage();
  }

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  startSession(): void {
    this.currentSession = {
      sessionId: this.generateSessionId(),
      startTime: Date.now(),
      videosViewed: 0,
      searchQueries: [],
      filterUsage: {}
    };
    this.trackEvent('session_start', { sessionId: this.currentSession.sessionId });
  }

  endSession(): void {
    if (this.currentSession) {
      this.currentSession.endTime = Date.now();
      this.trackEvent('session_end', {
        sessionId: this.currentSession.sessionId,
        duration: this.currentSession.endTime - this.currentSession.startTime,
        metrics: this.currentSession
      });
      this.currentSession = null;
    }
  }

  trackVideoView(video: VideoMetadata): void {
    if (this.currentSession) {
      this.currentSession.videosViewed++;
      this.trackEvent('video_view', {
        videoId: video.videoId,
        sessionId: this.currentSession.sessionId,
        metrics: {
          creatorAuthorityScore: video.creatorAuthorityScore,
          contentQualityScore: video.contentQualityScore,
          engagementRatio: video.engagementRatio
        }
      });
    }
  }

  trackSearch(query: string): void {
    if (this.currentSession) {
      this.currentSession.searchQueries.push(query);
      this.trackEvent('search_performed', {
        query,
        sessionId: this.currentSession.sessionId
      });
    }
  }

  trackFilterUsage(filterName: string): void {
    if (this.currentSession) {
      this.currentSession.filterUsage[filterName] = 
        (this.currentSession.filterUsage[filterName] || 0) + 1;
      this.trackEvent('filter_used', {
        filterName,
        sessionId: this.currentSession.sessionId
      });
    }
  }

  trackError(error: Error, context?: string): void {
    this.trackEvent('error', {
      message: error.message,
      stack: error.stack,
      context,
      sessionId: this.currentSession?.sessionId
    });
  }

  private trackEvent(eventType: string, data: Record<string, any>): void {
    const event: AnalyticsEvent = {
      eventType,
      timestamp: Date.now(),
      data
    };
    this.events.push(event);
    this.persistEvents();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private persistEvents(): void {
    try {
      localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(this.events));
    } catch (error) {
      console.error('Failed to persist analytics events:', error);
    }
  }

  private loadEventsFromStorage(): void {
    try {
      const storedEvents = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      if (storedEvents) {
        this.events = JSON.parse(storedEvents);
      }
    } catch (error) {
      console.error('Failed to load analytics events:', error);
    }
  }

  getEvents(): AnalyticsEvent[] {
    return this.events;
  }

  clearEvents(): void {
    this.events = [];
    localStorage.removeItem(this.LOCAL_STORAGE_KEY);
  }
} 