import { YouTubeApiService } from './api/youtubeApiService';
import { CacheService } from './cacheService';
import { isValidVideoId, isValidChannelId } from '../utils/validationUtils';
import { 
    VideoDetails, 
    ChannelInfo, 
    SearchResponse,
    ThumbnailInfo,
    UserPreferences,
    SearchOptions
} from '../types/quality';
import { 
    Video,
    Channel
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

    public async searchVideos(params: { query: string; preferences?: UserPreferences } & Partial<SearchOptions>): Promise<SearchResponse> {
        try {
            const optimizedQuery = this.buildOptimizedQuery(params.query);
            
            if (!optimizedQuery) {
                console.warn('Empty query after optimization');
                return this.createEmptySearchResponse();
            }

            // Build duration parameter based on preferences
            const durationParam = this.getDurationParameter(params.preferences?.videoLength);
            
            // Step 1: Initial search with only supported parts
            const apiParams = {
                query: optimizedQuery,
                videoDuration: durationParam,
                videoEmbeddable: true,
                type: 'video',
                part: ['snippet', 'id'], // Only request supported parts
                maxResults: this.calculateMaxResults(params.maxResults),
                safeSearch: params.safeSearch,
                order: params.order,
                regionCode: params.regionCode,
                relevanceLanguage: params.relevanceLanguage
            };

            // Perform search request with proper error handling
            const searchResponse = await this.performSearchRequest(apiParams);
            if (!searchResponse?.items?.length) {
                return this.createEmptySearchResponse();
            }

            // Process and validate search results
            const { videoIds, channelIds } = this.extractValidIds(searchResponse.items);
            if (!videoIds.length) {
                console.warn('No valid video IDs found in search results');
                return this.createEmptySearchResponse();
            }

            // Fetch additional details in parallel with proper error handling
            const [videoDetails, channels] = await this.fetchDetailsInParallel(videoIds, channelIds);
            if (!videoDetails.length || !channels.length) {
                console.warn('Failed to fetch video or channel details');
                return this.createEmptySearchResponse();
            }

            // Process and combine results
            const results = this.processSearchResults(videoDetails, channels, searchResponse);
            return results;

        } catch (error) {
            console.error('Error in searchVideos:', error);
            return this.createEmptySearchResponse();
        }
    }

    private async performSearchRequest(apiParams: any): Promise<any> {
        try {
            return await this.apiService.searchVideos(apiParams);
        } catch (error) {
            console.error('Search request failed:', error);
            throw error;
        }
    }

    private extractValidIds(items: any[]): { videoIds: string[]; channelIds: string[] } {
        const validItems = items.filter(item => {
            if (!item?.id?.videoId || !item?.snippet?.channelId ||
                !isValidVideoId(item.id.videoId) || !isValidChannelId(item.snippet.channelId)) {
                return false;
            }
            return !this.isShortFormContent(item.snippet.title, item.snippet.description);
        });

        return {
            videoIds: [...new Set(validItems.map(item => item.id.videoId))],
            channelIds: [...new Set(validItems.map(item => item.snippet.channelId))]
        };
    }

    private async fetchDetailsInParallel(videoIds: string[], channelIds: string[]) {
        try {
            return await Promise.all([
                this.fetchVideoDetailsWithRetry(videoIds),
                this.fetchChannelDetailsWithRetry(channelIds)
            ]);
        } catch (error) {
            console.error('Error fetching details:', error);
            return [[], []];
        }
    }

    private processSearchResults(videoDetails: Video[], channels: Channel[], searchResponse: any): SearchResponse {
        const channelMap = new Map(channels.map(channel => [channel.id, this.formatChannelInfo(channel)]));
        
        const validVideos = videoDetails
            .filter(video => {
                if (!video?.snippet?.channelId || !channelMap.has(video.snippet.channelId)) {
                    return false;
                }
                return !this.isVerticalVideo(video);
            })
            .map(video => this.formatVideoDetails(video));

        if (!validVideos.length) {
            return this.createEmptySearchResponse();
        }

        return {
            items: validVideos,
            channels: channelMap,
            nextPageToken: searchResponse.nextPageToken,
            prevPageToken: searchResponse.prevPageToken,
            totalResults: validVideos.length
        };
    }

    private calculateMaxResults(requested?: number): number {
        const MIN_RESULTS = 5;
        const MAX_RESULTS = 50;
        const DEFAULT_RESULTS = 25;

        if (!requested) {
            return DEFAULT_RESULTS;
        }

        return Math.min(Math.max(requested, MIN_RESULTS), MAX_RESULTS);
    }

    private async fetchVideoDetailsWithRetry(videoIds: string[]): Promise<Video[]> {
        if (!videoIds.length) return [];

        try {
            const response = await this.apiService.getVideoDetails(videoIds);
            return response.items || [];
        } catch (error) {
            console.error('Error fetching video details:', error);
            return [];
        }
    }

    private async fetchChannelDetailsWithRetry(channelIds: string[]): Promise<Channel[]> {
        if (!channelIds.length) return [];

        try {
            const response = await this.apiService.getChannelInfo(channelIds);
            return response.items || [];
        } catch (error) {
            console.error('Error fetching channel details:', error);
            return [];
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

    private buildOptimizedQuery(query: string): string {
        // Remove any existing shorts-related hashtags from the query
        const shortsHashtags = ['#shorts', '#short', '#youtubeshorts'];
        let optimizedQuery = query.trim();
        
        shortsHashtags.forEach(hashtag => {
            optimizedQuery = optimizedQuery.replace(new RegExp(hashtag, 'gi'), '');
        });

        // Clean up the query
        optimizedQuery = optimizedQuery
            .replace(/\s+/g, ' ')
            .trim();

        return optimizedQuery;
    }

    private createEmptySearchResponse(): SearchResponse {
        return {
            items: [],
            channels: new Map(),
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
                audioQuality: video.contentDetails?.audioQuality,
                width: this.extractDimension(video, 'width', video.contentDetails?.dimension),
                height: this.extractDimension(video, 'height', video.contentDetails?.dimension)
            },
            regionRestriction: video.contentDetails?.regionRestriction
        };
    }

    private extractDimension(video: Video, type: 'width' | 'height', dimension?: string): number | undefined {
        if (!dimension) return undefined;

        // YouTube API returns dimension in format "2d" or "3d"
        // For vertical videos, we can check thumbnail dimensions
        const thumbnail = video?.snippet?.thumbnails?.maxres || 
                         video?.snippet?.thumbnails?.high ||
                         video?.snippet?.thumbnails?.default;

        if (thumbnail) {
            return type === 'width' ? thumbnail.width : thumbnail.height;
        }

        return undefined;
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

        const thumbnails = {
            default: formatThumbnail(channel.snippet.thumbnails.default),
            medium: formatThumbnail(channel.snippet.thumbnails.medium),
            high: formatThumbnail(channel.snippet.thumbnails.high),
            maxres: channel.snippet.thumbnails.maxres ? formatThumbnail(channel.snippet.thumbnails.maxres) : undefined
        };

        return {
            id: channel.id,
            title: channel.snippet.title || '',
            description: channel.snippet.description || '',
            subscriberCount: parseInt(channel.statistics?.subscriberCount || '0', 10),
            videoCount: parseInt(channel.statistics?.videoCount || '0', 10),
            thumbnails,
            totalViews: parseInt(channel.statistics?.viewCount || '0', 10),
            createdAt: channel.snippet.publishedAt || new Date().toISOString(),
            recentUploads: []
        };
    }

    private createEmptyVideoDetails(videoId: string): VideoDetails {
        const thumbnails = {
            default: { url: '', width: 120, height: 90 },
            medium: { url: '', width: 320, height: 180 },
            high: { url: '', width: 480, height: 360 }
        };

        return {
            id: videoId,
            title: 'Unavailable Video',
            description: '',
            publishedAt: new Date().toISOString(),
            thumbnails,
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

    private getDurationParameter(preference?: 'short' | 'medium' | 'long'): string {
        switch (preference) {
            case 'short':
                return 'short'; // API: < 4 minutes
            case 'medium':
                return 'medium'; // API: 4-20 minutes
            case 'long':
                return 'long'; // API: > 20 minutes
            default:
                return 'any';
        }
    }

    private isShortFormContent(title: string, description: string): boolean {
        const shortsIndicators = [
            '#shorts',
            '#short',
            '#youtubeshorts',
            '#shortsvideo',
            '#shortvideo',
            '#shortsfeed',
            '#shortsviral',
            '#shortsyoutube',
            '#ytshorts',
            '#shortschannel'
        ];

        const lowerTitle = title.toLowerCase();
        const lowerDesc = description.toLowerCase();

        // Check for shorts hashtags
        return shortsIndicators.some(indicator => 
            lowerTitle.includes(indicator) || lowerDesc.includes(indicator)
        );
    }

    private isVerticalVideo(video: Video): boolean {
        // Check video dimensions if available
        if (video.contentDetails?.height && video.contentDetails?.width) {
            const aspectRatio = video.contentDetails.width / video.contentDetails.height;
            return aspectRatio < 1; // Vertical video
        }

        // Check thumbnail dimensions as fallback
        const thumbnail = video.snippet?.thumbnails?.maxres || 
                         video.snippet?.thumbnails?.high ||
                         video.snippet?.thumbnails?.default;

        if (thumbnail?.width && thumbnail?.height) {
            const aspectRatio = thumbnail.width / thumbnail.height;
            return aspectRatio < 1; // Vertical video
        }

        return false; // Default to false if we can't determine
    }
}