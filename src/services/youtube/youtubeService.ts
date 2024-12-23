import { LoggingService } from '../loggingService';
import { VideoDetails, ChannelInfo } from '../../types/youtube';

interface YouTubeSearchParams {
    query: string;
    maxResults?: number;
    relevanceLanguage?: string;
    regionCode?: string;
    safeSearch?: 'none' | 'moderate' | 'strict';
    type?: 'video' | 'channel' | 'playlist';
    [key: string]: any;
}

export class YouTubeService {
    private static instance: YouTubeService;
    private readonly loggingService: LoggingService;
    private readonly API_KEY: string;
    
    private constructor() {
        this.loggingService = LoggingService.getInstance();
        this.API_KEY = process.env.YOUTUBE_API_KEY || '';
        
        if (!this.API_KEY) {
            this.loggingService.logWarning('YouTube API key not found in environment variables');
        }
    }

    public static getInstance(): YouTubeService {
        if (!YouTubeService.instance) {
            YouTubeService.instance = new YouTubeService();
        }
        return YouTubeService.instance;
    }

    public async searchVideos(params: YouTubeSearchParams): Promise<VideoDetails[]> {
        try {
            if (!this.API_KEY) {
                throw new Error('YouTube API key not configured');
            }

            const searchParams = new URLSearchParams({
                part: 'snippet',
                q: params.query,
                maxResults: String(params.maxResults || 50),
                type: params.type || 'video',
                key: this.API_KEY,
                ...(params.relevanceLanguage && { relevanceLanguage: params.relevanceLanguage }),
                ...(params.regionCode && { regionCode: params.regionCode }),
                ...(params.safeSearch && { safeSearch: params.safeSearch })
            });

            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/search?${searchParams.toString()}`
            );

            if (!response.ok) {
                throw new Error(`YouTube API error: ${response.statusText}`);
            }

            const data = await response.json();
            const videoIds = data.items.map((item: any) => item.id.videoId).join(',');

            // Get detailed video information
            const detailsParams = new URLSearchParams({
                part: 'snippet,contentDetails,statistics',
                id: videoIds,
                key: this.API_KEY
            });

            const detailsResponse = await fetch(
                `https://www.googleapis.com/youtube/v3/videos?${detailsParams.toString()}`
            );

            if (!detailsResponse.ok) {
                throw new Error(`YouTube API error: ${detailsResponse.statusText}`);
            }

            const detailsData = await detailsResponse.json();

            return this.transformVideoResponse(detailsData.items);
        } catch (error) {
            this.loggingService.logError('Error in searchVideos:', error);
            return [];
        }
    }

    public async getChannelInfo(channelId: string): Promise<ChannelInfo | null> {
        try {
            if (!this.API_KEY) {
                throw new Error('YouTube API key not configured');
            }

            const params = new URLSearchParams({
                part: 'snippet,statistics',
                id: channelId,
                key: this.API_KEY
            });

            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/channels?${params.toString()}`
            );

            if (!response.ok) {
                throw new Error(`YouTube API error: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (!data.items || data.items.length === 0) {
                return null;
            }

            const channel = data.items[0];
            return {
                id: channel.id,
                title: channel.snippet.title,
                description: channel.snippet.description,
                customUrl: channel.snippet.customUrl,
                thumbnails: channel.snippet.thumbnails,
                statistics: {
                    viewCount: parseInt(channel.statistics.viewCount),
                    subscriberCount: parseInt(channel.statistics.subscriberCount),
                    videoCount: parseInt(channel.statistics.videoCount)
                },
                publishedAt: new Date(channel.snippet.publishedAt)
            };
        } catch (error) {
            this.loggingService.logError('Error in getChannelInfo:', error);
            return null;
        }
    }

    private transformVideoResponse(items: any[]): VideoDetails[] {
        return items.map(item => ({
            id: item.id,
            title: item.snippet.title,
            description: item.snippet.description,
            publishedAt: new Date(item.snippet.publishedAt),
            thumbnails: item.snippet.thumbnails,
            channelId: item.snippet.channelId,
            channelTitle: item.snippet.channelTitle,
            tags: item.snippet.tags || [],
            statistics: {
                viewCount: parseInt(item.statistics.viewCount),
                likeCount: parseInt(item.statistics.likeCount),
                commentCount: parseInt(item.statistics.commentCount)
            },
            contentDetails: {
                duration: item.contentDetails.duration,
                dimension: item.contentDetails.dimension,
                definition: item.contentDetails.definition,
                caption: item.contentDetails.caption === 'true',
                licensedContent: item.contentDetails.licensedContent,
                projection: item.contentDetails.projection
            }
        }));
    }
} 