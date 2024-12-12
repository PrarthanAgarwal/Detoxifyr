import { YouTubeApiService } from './api/youtubeApiService';
import { CacheService } from './cacheService';
import { isValidVideoId, isValidChannelId, validateVideoDetails, validateChannelInfo } from '../utils/validationUtils';
import type { 
    VideoDetails, 
    ChannelInfo, 
    SearchResponse
} from '../types/youtube';
import { 
    YouTubeVideo, 
    // @ts-ignore - Used implicitly through YouTubeSearchResponse type
    YouTubeSearchResult,
    YouTubeChannel
} from '../types/youtube.types';

// Define search parameters interface extending the base one
export interface EnhancedSearchParams {
    query: string;
    maxResults?: number;
    pageToken?: string;
    order?: 'date' | 'rating' | 'relevance' | 'title' | 'viewCount';
    safeSearch?: 'none' | 'moderate' | 'strict';
}

// Define constants
const DEFAULT_SEARCH_CONFIG = {
    maxResults: 25,
    safeSearch: 'moderate' as const,
    order: 'relevance' as const
} as const;

export class YouTubeService {
    private static instance: YouTubeService;
    private apiService: YouTubeApiService;
    private cache: CacheService;
    private readonly MAX_RETRIES = 3;
    private readonly RETRY_DELAY = 1000;
    private readonly BATCH_SIZE = 50;

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

    public async searchVideos(params: EnhancedSearchParams): Promise<SearchResponse> {
        try {
            const optimizedQuery = this.buildOptimizedQuery(params.query);
            
            if (!optimizedQuery) {
                console.warn('Empty query after optimization');
                return this.createEmptySearchResponse();
            }
            
            const searchConfig = {
                maxResults: params.maxResults ?? DEFAULT_SEARCH_CONFIG.maxResults,
                safeSearch: params.safeSearch ?? DEFAULT_SEARCH_CONFIG.safeSearch,
                order: params.order ?? DEFAULT_SEARCH_CONFIG.order,
                pageToken: params.pageToken
            };

            // Step 1: Initial search
            const searchResponse = await this.apiService.searchVideos(
                optimizedQuery, 
                searchConfig.maxResults,
                searchConfig.safeSearch,
                searchConfig.order,
                searchConfig.pageToken
            );

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
            const videoIds = [...new Set(validItems.map(item => item.id.videoId))];
            const channelIds = [...new Set(validItems.map(item => item.snippet.channelId))];

            // Step 4: Fetch details in parallel with caching
            const [videos, channels] = await Promise.all([
                this.fetchVideoDetailsWithRetry(videoIds),
                this.fetchChannelDetailsWithRetry(channelIds)
            ]);

            if (!videos.length) {
                console.warn('No valid videos retrieved');
                return this.createEmptySearchResponse();
            }

            if (!channels.length) {
                console.warn('No valid channel data retrieved');
                return this.createEmptySearchResponse();
            }

            // Step 5: Create channel map and match videos
            const channelMap = new Map(channels.map(channel => [channel.id, channel]));
            const validVideos = videos.filter(video => 
                video?.id && 
                video?.channelId && 
                channelMap.has(video.channelId)
            );

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

    private buildOptimizedQuery(query: string): string {
        return query.trim()
            .replace(/\s+/g, ' ') // normalize spaces
            .replace(/[^\w\s-]/g, ''); // remove special characters except hyphens
    }

    private createEmptySearchResponse(): SearchResponse {
        return {
            items: [],
            nextPageToken: undefined,
            prevPageToken: undefined,
            totalResults: 0
        };
    }

    private async fetchChannelDetailsWithRetry(channelIds: string[], attempt = 0): Promise<ChannelInfo[]> {
        try {
            const allChannels: ChannelInfo[] = [];
            const batches: string[][] = [];
            
            // Create batches of channel IDs
            for (let i = 0; i < channelIds.length; i += this.BATCH_SIZE) {
                batches.push(channelIds.slice(i, i + this.BATCH_SIZE));
            }

            // Process each batch
            for (const batch of batches) {
                try {
                    // Get channels in parallel
                    const channelPromises = batch.map(id => this.getChannelInfo(id));
                    const channelResults = await Promise.all(channelPromises);
                    
                    // Filter out null results
                    const validChannels = channelResults.filter((channel): channel is ChannelInfo => 
                        channel !== null
                    );
                    
                    allChannels.push(...validChannels);

                    // Add delay between batches
                    if (batches.indexOf(batch) < batches.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                } catch (error) {
                    console.warn(`Failed to fetch batch of channel details:`, error);
                    // Continue with other batches
                }
            }

            if (allChannels.length === 0) {
                throw new Error('No channel data could be retrieved');
            }

            return allChannels;
        } catch (error) {
            if (attempt < this.MAX_RETRIES) {
                const delay = this.RETRY_DELAY * Math.pow(2, attempt);
                console.warn(`Retrying channel fetch after ${delay}ms. Attempt ${attempt + 1}/${this.MAX_RETRIES}`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.fetchChannelDetailsWithRetry(channelIds, attempt + 1);
            }
            console.error('Failed to fetch channel details after all retries:', error);
            return [];
        }
    }

    private async fetchVideoDetailsWithRetry(videoIds: string[], attempt = 0): Promise<VideoDetails[]> {
        try {
            const allVideos: VideoDetails[] = [];
            const batches: string[][] = [];
            
            // Create batches of video IDs
            for (let i = 0; i < videoIds.length; i += this.BATCH_SIZE) {
                batches.push(videoIds.slice(i, i + this.BATCH_SIZE));
            }

            // Process each batch with retries
            for (const batch of batches) {
                try {
                    // First try to get from cache
                    const cachedVideos = batch
                        .map(id => this.cache.get<VideoDetails>(`video:${id}`))
                        .filter(Boolean) as VideoDetails[];
                    
                    allVideos.push(...cachedVideos);
                    
                    // Get remaining videos from API
                    const remainingIds = batch.filter(
                        id => !cachedVideos.some(v => v.id === id)
                    );
                    
                    if (remainingIds.length > 0) {
                        const response = await this.apiService.getVideoDetails(remainingIds.join(','));
                        
                        if (response?.items?.length) {
                            const videoDetails = response.items.map(video => ({
                                id: video.id,
                                title: video.snippet?.title || '',
                                description: video.snippet?.description || '',
                                publishedAt: video.snippet?.publishedAt || '',
                                thumbnails: video.snippet?.thumbnails || {
                                    default: { url: '', width: 120, height: 90 },
                                    medium: { url: '', width: 320, height: 180 },
                                    high: { url: '', width: 480, height: 360 }
                                },
                                channelId: video.snippet?.channelId || '',
                                channelTitle: video.snippet?.channelTitle || '',
                                duration: video.contentDetails?.duration || 'PT0S',
                                viewCount: parseInt(video.statistics?.viewCount || '0', 10),
                                likeCount: parseInt(video.statistics?.likeCount || '0', 10),
                                commentCount: parseInt(video.statistics?.commentCount || '0', 10),
                                defaultLanguage: video.snippet?.defaultLanguage,
                                tags: video.snippet?.tags || [],
                                categoryId: video.snippet?.categoryId || '0',
                                hasCaptions: video.contentDetails?.caption === 'true'
                            }));

                            // Cache the results
                            videoDetails.forEach(video => {
                                this.cache.set(`video:${video.id}`, video, 15 * 60 * 1000); // 15 minutes
                            });

                            allVideos.push(...videoDetails);
                        }
                    }

                    // Add delay between batches
                    if (batches.indexOf(batch) < batches.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                } catch (error) {
                    console.warn(`Failed to fetch batch of video details:`, error);
                    // Continue with other batches
                }
            }

            return allVideos;
        } catch (error) {
            if (attempt < this.MAX_RETRIES) {
                const delay = this.RETRY_DELAY * Math.pow(2, attempt);
                console.warn(`Retrying video fetch after ${delay}ms. Attempt ${attempt + 1}/${this.MAX_RETRIES}`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.fetchVideoDetailsWithRetry(videoIds, attempt + 1);
            }
            console.error('Failed to fetch video details after all retries:', error);
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
            
            // Handle empty response more gracefully
            if (!response.items || response.items.length === 0) {
                console.warn(`No data available for video: ${videoId}`);
                return this.createEmptyVideoDetails(videoId);
            }

            const video = response.items[0];
            const validation = validateVideoDetails(video);
            if (!validation.isValid) {
                console.warn(`Video data validation failed for ${videoId}: ${validation.errors.join(', ')}`);
                return this.createEmptyVideoDetails(videoId);
            }

            const videoDetails = this.formatVideoDetails(video);
            this.cache.set(cacheKey, videoDetails);
            return videoDetails;
        } catch (error) {
            console.error(`Error fetching video details for ${videoId}:`, error);
            return this.createEmptyVideoDetails(videoId);
        }
    }

    public async getChannelInfo(channelId: string): Promise<ChannelInfo | null> {
        try {
            // Check cache first
            const cacheKey = `channel:${channelId}`;
            const cachedData = this.cache.get<ChannelInfo>(cacheKey);
            if (cachedData) {
                return cachedData;
            }

            // Fetch from API
            const response = await this.apiService.getChannelInfo(channelId);
            
            if (!response?.items?.length) {
                console.warn(`No data found for channel: ${channelId}`);
                return null;
            }

            const channel = response.items[0];
            const channelInfo: ChannelInfo = {
                id: channel.id,
                title: channel.snippet?.title || '',
                description: channel.snippet?.description || '',
                subscriberCount: parseInt(channel.statistics?.subscriberCount || '0', 10),
                videoCount: parseInt(channel.statistics?.videoCount || '0', 10),
                totalViews: parseInt(channel.statistics?.viewCount || '0', 10),
                createdAt: channel.snippet?.publishedAt || new Date().toISOString(),
                thumbnails: channel.snippet?.thumbnails || {
                    default: { url: '', width: 120, height: 90 },
                    medium: { url: '', width: 320, height: 180 },
                    high: { url: '', width: 480, height: 360 }
                },
                recentUploads: []
            };

            // Cache the result
            this.cache.set(cacheKey, channelInfo, 30 * 60 * 1000); // 30 minutes
            return channelInfo;

        } catch (error) {
            console.error(`Failed to fetch channel info for ${channelId}:`, error);
            return null;
        }
    }

    private formatVideoDetails(video: YouTubeVideo): VideoDetails {
        if (!video || !video.snippet) {
            throw new Error('Invalid video data format');
        }

        return {
            id: video.id,
            title: video.snippet.title || '',
            description: video.snippet.description || '',
            publishedAt: video.snippet.publishedAt || new Date().toISOString(),
            thumbnails: video.snippet.thumbnails || {
                default: { url: '', width: 120, height: 90 },
                medium: { url: '', width: 320, height: 180 },
                high: { url: '', width: 480, height: 360 }
            },
            channelId: video.snippet.channelId || '',
            channelTitle: video.snippet.channelTitle || '',
            duration: video.contentDetails?.duration || 'PT0S',
            viewCount: parseInt(video.statistics?.viewCount || '0', 10),
            likeCount: parseInt(video.statistics?.likeCount || '0', 10),
            commentCount: parseInt(video.statistics?.commentCount || '0', 10),
            defaultLanguage: video.snippet.defaultLanguage,
            tags: video.snippet.tags,
            categoryId: video.snippet.categoryId,
            hasCaptions: video.contentDetails?.caption === 'true'
        };
    }

    private formatChannelInfo(channel: YouTubeChannel): ChannelInfo {
        if (!channel || !channel.snippet) {
            throw new Error('Invalid channel data format');
        }

        return {
            id: channel.id,
            title: channel.snippet.title || '',
            description: channel.snippet.description || '',
            subscriberCount: parseInt(channel.statistics?.subscriberCount || '0', 10),
            videoCount: parseInt(channel.statistics?.videoCount || '0', 10),
            thumbnails: channel.snippet.thumbnails || {
                default: { url: '', width: 120, height: 90 },
                medium: { url: '', width: 320, height: 180 },
                high: { url: '', width: 480, height: 360 }
            },
            totalViews: parseInt(channel.statistics?.viewCount || '0', 10),
            createdAt: channel.snippet.publishedAt || new Date().toISOString(),
            recentUploads: [] // We'll handle recent uploads separately if needed
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
            hasCaptions: false
        };
    }

    private createEmptyChannelInfo(channelId: string): ChannelInfo {
        return {
            id: channelId,
            title: 'Unavailable Channel',
            description: '',
            subscriberCount: 0,
            videoCount: 0,
            thumbnails: {
                default: { url: '', width: 120, height: 90 },
                medium: { url: '', width: 320, height: 180 },
                high: { url: '', width: 480, height: 360 }
            },
            totalViews: 0,
            createdAt: new Date().toISOString(),
            recentUploads: []
        };
    }
}