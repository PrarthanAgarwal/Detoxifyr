import { AnalyticsEvent, SessionMetrics } from './AnalyticsService';

export interface AggregatedMetrics {
  totalSessions: number;
  averageSessionDuration: number;
  totalVideosViewed: number;
  popularSearchQueries: Array<{ query: string; count: number }>;
  popularFilters: Array<{ filter: string; count: number }>;
  errorRate: number;
}

export interface TimeRange {
  startTime: number;
  endTime: number;
}

export class ReportingService {
  private static instance: ReportingService;

  private constructor() {}

  static getInstance(): ReportingService {
    if (!ReportingService.instance) {
      ReportingService.instance = new ReportingService();
    }
    return ReportingService.instance;
  }

  generateReport(events: AnalyticsEvent[], timeRange?: TimeRange): AggregatedMetrics {
    const filteredEvents = this.filterEventsByTimeRange(events, timeRange);
    const sessions = this.extractSessions(filteredEvents);

    return {
      totalSessions: sessions.length,
      averageSessionDuration: this.calculateAverageSessionDuration(sessions),
      totalVideosViewed: this.countVideoViews(filteredEvents),
      popularSearchQueries: this.aggregateSearchQueries(filteredEvents),
      popularFilters: this.aggregateFilterUsage(filteredEvents),
      errorRate: this.calculateErrorRate(filteredEvents)
    };
  }

  private filterEventsByTimeRange(events: AnalyticsEvent[], timeRange?: TimeRange): AnalyticsEvent[] {
    if (!timeRange) return events;
    
    return events.filter(event => 
      event.timestamp >= timeRange.startTime && 
      event.timestamp <= timeRange.endTime
    );
  }

  private extractSessions(events: AnalyticsEvent[]): SessionMetrics[] {
    const sessions: SessionMetrics[] = [];
    let currentSession: Partial<SessionMetrics> | null = null;

    events.forEach(event => {
      if (event.eventType === 'session_start') {
        currentSession = {
          sessionId: event.data.sessionId,
          startTime: event.timestamp,
          videosViewed: 0,
          searchQueries: [],
          filterUsage: {}
        };
      } else if (event.eventType === 'session_end' && currentSession) {
        currentSession.endTime = event.timestamp;
        sessions.push(currentSession as SessionMetrics);
        currentSession = null;
      }
    });

    return sessions;
  }

  private calculateAverageSessionDuration(sessions: SessionMetrics[]): number {
    if (sessions.length === 0) return 0;

    const totalDuration = sessions.reduce((sum, session) => {
      if (session.endTime) {
        return sum + (session.endTime - session.startTime);
      }
      return sum;
    }, 0);

    return totalDuration / sessions.length;
  }

  private countVideoViews(events: AnalyticsEvent[]): number {
    return events.filter(event => event.eventType === 'video_view').length;
  }

  private aggregateSearchQueries(events: AnalyticsEvent[]): Array<{ query: string; count: number }> {
    const queryCount = new Map<string, number>();

    events
      .filter(event => event.eventType === 'search_performed')
      .forEach(event => {
        const query = event.data.query;
        queryCount.set(query, (queryCount.get(query) || 0) + 1);
      });

    return Array.from(queryCount.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private aggregateFilterUsage(events: AnalyticsEvent[]): Array<{ filter: string; count: number }> {
    const filterCount = new Map<string, number>();

    events
      .filter(event => event.eventType === 'filter_used')
      .forEach(event => {
        const filter = event.data.filterName;
        filterCount.set(filter, (filterCount.get(filter) || 0) + 1);
      });

    return Array.from(filterCount.entries())
      .map(([filter, count]) => ({ filter, count }))
      .sort((a, b) => b.count - a.count);
  }

  private calculateErrorRate(events: AnalyticsEvent[]): number {
    const totalEvents = events.length;
    if (totalEvents === 0) return 0;

    const errorEvents = events.filter(event => event.eventType === 'error').length;
    return (errorEvents / totalEvents) * 100;
  }

  exportReport(metrics: AggregatedMetrics): string {
    return JSON.stringify(metrics, null, 2);
  }
} 