import { YouTubeApiService } from './api/youtubeApiService';
import { CacheService } from './cacheService';
import { isValidVideoId, isValidChannelId } from '../utils/validationUtils';
import { 
    VideoDetails, 
    ChannelInfo, 
    SearchResponse,
    ThumbnailInfo
} from '../types/youtube';
import { 
    Video,
    Channel,
    SearchOptions
} from '../types/youtube.types';

export class YouTubeService {
    private static instance: YouTubeService;
    private apiService: YouTubeApiService;
    private cache: CacheService;
    private readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutes

    private constructor() {
        this.apiService = YouTubeApiService.getInstance();
        this.cache = CacheService.getInstance();
    }

    public static getInstance(): YouTubeService {
        if (!YouTubeService.instance) {
            YouTubeService.instance = new YouTubeService();
        }
        return YouTubeService.instance;
    }

    public async searchVideos(params: { query: string } & Partial<SearchOptions>): Promise<SearchResponse> {
        try {
            const optimizedQuery = this.buildOptimizedQuery(params.query);
            
            if (!optimizedQuery) {
                console.warn('Empty query after optimization');
                return this.createEmptySearchResponse();
            }

            // Step 1: Initial search
            const searchResponse = await this.apiService.searchVideos(optimizedQuery, params);

            if (!searchResponse?.items?.length) {
                console.warn('No search results found');
                return this.createEmptySearchResponse();
            }

            // Step 2: Extract valid IDs
            const validItems = searchResponse.items.filter(item => 
                item?.id?.videoId && 
                item?.snippet?.channelId &&
                isValidVideoId(item.id.videoId) &&
                isValidChannelId(item.snippet.channelId)
            );

            if (!validItems.length) {
                console.warn('No valid items in search results');
                return this.createEmptySearchResponse();
            }

            // Step 3: Get unique IDs
            const videoIds = [...new Set(validItems.map(item => item.id.videoId!))];
            const channelIds = [...new Set(validItems.map(item => item.snippet.channelId))];

            // Step 4: Fetch details in parallel with caching
            const [videos, channels] = await Promise.all([
                this.fetchVideoDetailsWithRetry(videoIds),
                this.fetchChannelDetailsWithRetry(channelIds)
            ]);

            if (!videos.length || !channels.length) {
                console.warn('No valid videos or channels retrieved');
                return this.createEmptySearchResponse();
            }

            // Step 5: Create channel map and match videos
            const channelMap = new Map(channels.map(channel => [channel.id, channel]));
            const validVideos = videos
                .filter(video => video?.snippet?.channelId && channelMap.has(video.snippet.channelId))
                .map(video => this.formatVideoDetails(video));

            if (!validVideos.length) {
                console.warn('No videos with valid channel data');
                return this.createEmptySearchResponse();
            }

            // Step 6: Return results
            return {
                items: validVideos,
                nextPageToken: searchResponse.nextPageToken,
                prevPageToken: searchResponse.prevPageToken,
                totalResults: validVideos.length
            };

        } catch (error) {
            console.error('Error in searchVideos:', error);
            return this.createEmptySearchResponse();
        }
    }

    public async getVideoDetails(videoId: string): Promise<VideoDetails> {
        if (!isValidVideoId(videoId)) {
            console.warn(`Invalid video ID format: ${videoId}`);
            return this.createEmptyVideoDetails(videoId);
        }

        const cacheKey = `video:${videoId}`;
        const cachedData = this.cache.get<VideoDetails>(cacheKey);
        
        if (cachedData) return cachedData;

        try {
            const response = await this.apiService.getVideoDetails(videoId);
            
            if (!response.items || response.items.length === 0) {
                console.warn(`No data available for video: ${videoId}`);
                return this.createEmptyVideoDetails(videoId);
            }

            const videoDetails = this.formatVideoDetails(response.items[0]);
            this.cache.set(cacheKey, videoDetails, this.CACHE_TTL);
            return videoDetails;
        } catch (error) {
            console.error(`Error fetching video details for ${videoId}:`, error);
            return this.createEmptyVideoDetails(videoId);
        }
    }

    public async getChannelInfo(channelId: string): Promise<ChannelInfo | null> {
        if (!isValidChannelId(channelId)) {
            console.warn(`Invalid channel ID format: ${channelId}`);
            return null;
        }

        const cacheKey = `channel:${channelId}`;
        const cachedData = this.cache.get<ChannelInfo>(cacheKey);
        
        if (cachedData) return cachedData;

        try {
            const response = await this.apiService.getChannelInfo(channelId);
            
            if (!response.items || response.items.length === 0) {
                console.warn(`No data available for channel: ${channelId}`);
                return null;
            }

            const channelInfo = this.formatChannelInfo(response.items[0]);
            this.cache.set(cacheKey, channelInfo, this.CACHE_TTL);
            return channelInfo;
        } catch (error) {
            console.error(`Error fetching channel info for ${channelId}:`, error);
            return null;
        }
    }

    private async fetchVideoDetailsWithRetry(videoIds: string[]): Promise<Video[]> {
        try {
            const response = await this.apiService.getVideoDetails(videoIds);
            return response.items || [];
        } catch (error) {
            console.error('Error fetching video details:', error);
            return [];
        }
    }

    private async fetchChannelDetailsWithRetry(channelIds: string[]): Promise<Channel[]> {
        try {
            const response = await this.apiService.getChannelInfo(channelIds);
            return response.items || [];
        } catch (error) {
            console.error('Error fetching channel details:', error);
            return [];
        }
    }

    private buildOptimizedQuery(query: string): string {
        return query.trim()
            .replace(/\s+/g, ' ')
            .replace(/[^\w\s-]/g, '');
    }

    private createEmptySearchResponse(): SearchResponse {
        return {
            items: [],
            nextPageToken: undefined,
            prevPageToken: undefined,
            totalResults: 0
        };
    }

    private formatVideoDetails(video: Video): VideoDetails {
        if (!video?.snippet) {
            throw new Error('Invalid video data format');
        }

        const formatThumbnail = (thumb?: { url: string; width: number; height: number }): ThumbnailInfo => ({
            url: thumb?.url || '',
            width: thumb?.width || 0,
            height: thumb?.height || 0
        });

        return {
            id: video.id,
            title: video.snippet.title || '',
            description: video.snippet.description || '',
            publishedAt: video.snippet.publishedAt || new Date().toISOString(),
            thumbnails: {
                default: formatThumbnail(video.snippet.thumbnails.default),
                medium: formatThumbnail(video.snippet.thumbnails.medium),
                high: formatThumbnail(video.snippet.thumbnails.high),
                maxres: video.snippet.thumbnails.maxres ? formatThumbnail(video.snippet.thumbnails.maxres) : undefined
            },
            channelId: video.snippet.channelId || '',
            channelTitle: video.snippet.channelTitle || '',
            duration: video.contentDetails?.duration || 'PT0S',
            viewCount: parseInt(video.statistics?.viewCount || '0', 10),
            likeCount: parseInt(video.statistics?.likeCount || '0', 10),
            commentCount: parseInt(video.statistics?.commentCount || '0', 10),
            defaultLanguage: video.snippet.defaultLanguage,
            tags: video.snippet.tags || [],
            categoryId: video.snippet.categoryId,
            hasCaptions: video.contentDetails?.caption === 'true',
            contentDetails: {
                audioQuality: video.contentDetails?.audioQuality
            },
            regionRestriction: video.contentDetails?.regionRestriction
        };
    }

    private formatChannelInfo(channel: Channel): ChannelInfo {
        if (!channel?.snippet) {
            throw new Error('Invalid channel data format');
        }

        const formatThumbnail = (thumb?: { url: string; width: number; height: number }): ThumbnailInfo => ({
            url: thumb?.url || '',
            width: thumb?.width || 0,
            height: thumb?.height || 0
        });

        return {
            id: channel.id,
            title: channel.snippet.title || '',
            description: channel.snippet.description || '',
            subscriberCount: parseInt(channel.statistics?.subscriberCount || '0', 10),
            videoCount: parseInt(channel.statistics?.videoCount || '0', 10),
            thumbnails: {
                default: formatThumbnail(channel.snippet.thumbnails.default),
                medium: formatThumbnail(channel.snippet.thumbnails.medium),
                high: formatThumbnail(channel.snippet.thumbnails.high),
                maxres: channel.snippet.thumbnails.maxres ? formatThumbnail(channel.snippet.thumbnails.maxres) : undefined
            },
            totalViews: parseInt(channel.statistics?.viewCount || '0', 10),
            createdAt: channel.snippet.publishedAt || new Date().toISOString(),
            recentUploads: []
        };
    }

    private createEmptyVideoDetails(videoId: string): VideoDetails {
        return {
            id: videoId,
            title: 'Unavailable Video',
            description: '',
            publishedAt: new Date().toISOString(),
            thumbnails: {
                default: { url: '', width: 120, height: 90 },
                medium: { url: '', width: 320, height: 180 },
                high: { url: '', width: 480, height: 360 }
            },
            channelId: '',
            channelTitle: 'Unknown Channel',
            duration: 'PT0S',
            viewCount: 0,
            likeCount: 0,
            commentCount: 0,
            defaultLanguage: undefined,
            tags: [],
            categoryId: '0',
            hasCaptions: false,
            contentDetails: {
                audioQuality: undefined
            }
        };
    }
}