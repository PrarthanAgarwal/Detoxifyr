import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { YouTubeAuthService } from '../auth/youtubeAuth';
import { YouTubeApiError } from '../../types/api.types';
import { 
    YouTubeSearchResponse, 
    YouTubeVideoResponse, 
    YouTubeChannelResponse,
    SearchOptions
} from '../../types/youtube.types';

interface QuotaCost {
    [key: string]: number;
    search: number;
    videos: number;
    channels: number;
}

export class YouTubeApiService {
    private static instance: YouTubeApiService;
    private axiosInstance: AxiosInstance;
    private authService: YouTubeAuthService;
    private dailyQuotaLimit: number = 10000;
    private quotaUsed: number = 0;
    private retryAttempts: number = 3;
    private retryDelay: number = 1000;
    
    private quotaCosts: QuotaCost = {
        search: 100,
        videos: 1,
        channels: 1
    };

    private constructor() {
        this.authService = YouTubeAuthService.getInstance();
        this.axiosInstance = axios.create({
            baseURL: 'https://www.googleapis.com/youtube/v3',
            timeout: 10000
        });
        
        this.setupInterceptors();
        this.loadQuotaUsage();
    }

    public static getInstance(): YouTubeApiService {
        if (!YouTubeApiService.instance) {
            YouTubeApiService.instance = new YouTubeApiService();
        }
        return YouTubeApiService.instance;
    }

    private async retryOperation<T>(operation: () => Promise<T>): Promise<T> {
        let lastError: Error | null = null;
        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error as Error;
                if (this.isQuotaExceeded(error) || attempt === this.retryAttempts) {
                    throw error;
                }
                await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
            }
        }
        throw lastError;
    }

    private setupInterceptors(): void {
        this.axiosInstance.interceptors.request.use(
            async (config) => {
                const token = await this.authService.getValidToken();
                config.headers.Authorization = `Bearer ${token}`;
                
                const endpoint = this.getEndpointFromUrl(config.url || '');
                if (!this.hasQuotaAvailable(endpoint)) {
                    throw new Error('Daily quota limit exceeded');
                }
                
                return config;
            },
            (error: AxiosError) => {
                return Promise.reject(error);
            }
        );

        this.axiosInstance.interceptors.response.use(
            (response: AxiosResponse) => {
                const endpoint = this.getEndpointFromUrl(response.config.url || '');
                this.updateQuotaUsage(endpoint);
                return response;
            },
            (error: AxiosError<YouTubeApiError>) => {
                return this.handleApiError(error);
            }
        );
    }

    public async searchVideos(
        query: string, 
        options: Partial<SearchOptions> = {}
    ): Promise<YouTubeSearchResponse> {
        const {
            maxResults = 25,
            safeSearch = 'moderate',
            order = 'relevance',
            pageToken,
            regionCode,
            relevanceLanguage,
            publishedAfter,
            publishedBefore,
            videoCategoryId,
            videoDefinition,
            videoDuration,
            videoType
        } = options;

        return this.retryOperation(async () => {
            const response = await this.axiosInstance.get<YouTubeSearchResponse>('/search', {
                params: {
                    part: 'snippet',
                    q: query,
                    maxResults,
                    type: 'video',
                    safeSearch,
                    videoEmbeddable: true,
                    order,
                    ...(pageToken && { pageToken }),
                    ...(regionCode && { regionCode }),
                    ...(relevanceLanguage && { relevanceLanguage }),
                    ...(publishedAfter && { publishedAfter: publishedAfter.toISOString() }),
                    ...(publishedBefore && { publishedBefore: publishedBefore.toISOString() }),
                    ...(videoCategoryId && { videoCategoryId }),
                    ...(videoDefinition && { videoDefinition }),
                    ...(videoDuration && { videoDuration }),
                    ...(videoType && { videoType })
                }
            });

            if (!response.data.items?.length) {
                return {
                    kind: 'youtube#searchListResponse',
                    etag: '',
                    nextPageToken: undefined,
                    prevPageToken: undefined,
                    pageInfo: { totalResults: 0, resultsPerPage: 0 },
                    items: []
                };
            }

            return response.data;
        });
    }

    public async getVideoDetails(videoIds: string | string[]): Promise<YouTubeVideoResponse> {
        const ids = Array.isArray(videoIds) ? videoIds.join(',') : videoIds;
        
        return this.retryOperation(async () => {
            const response = await this.axiosInstance.get<YouTubeVideoResponse>('/videos', {
                params: {
                    part: 'snippet,contentDetails,statistics,status,topicDetails',
                    id: ids,
                    maxResults: 50
                }
            });
            
            if (!response.data.items?.length) {
                return {
                    kind: 'youtube#videoListResponse',
                    etag: '',
                    items: [],
                    pageInfo: { totalResults: 0, resultsPerPage: 0 }
                };
            }
            
            return response.data;
        });
    }

    public async getChannelInfo(channelIds: string | string[]): Promise<YouTubeChannelResponse> {
        const ids = Array.isArray(channelIds) ? channelIds.join(',') : channelIds;
        
        return this.retryOperation(async () => {
            const response = await this.axiosInstance.get<YouTubeChannelResponse>('/channels', {
                params: {
                    part: 'snippet,contentDetails,statistics,brandingSettings,topicDetails',
                    id: ids,
                    maxResults: 50
                }
            });
            
            if (!response.data.items?.length) {
                return {
                    kind: 'youtube#channelListResponse',
                    etag: '',
                    items: [],
                    pageInfo: { totalResults: 0, resultsPerPage: 0 }
                };
            }
            
            return response.data;
        });
    }

    public async getCommentThreads(
        videoId: string,
        maxResults: number = 100,
        pageToken?: string
    ): Promise<any> {
        return this.retryOperation(async () => {
            const response = await this.axiosInstance.get('/commentThreads', {
                params: {
                    part: 'snippet,replies',
                    videoId,
                    maxResults,
                    ...(pageToken && { pageToken })
                }
            });
            
            return response.data;
        });
    }

    private getEndpointFromUrl(url: string): keyof QuotaCost {
        if (url.includes('/search')) return 'search';
        if (url.includes('/videos')) return 'videos';
        if (url.includes('/channels')) return 'channels';
        return 'videos';
    }

    private hasQuotaAvailable(endpoint: keyof QuotaCost): boolean {
        return (this.quotaUsed + this.quotaCosts[endpoint]) <= this.dailyQuotaLimit;
    }

    private updateQuotaUsage(endpoint: keyof QuotaCost): void {
        this.quotaUsed += this.quotaCosts[endpoint];
        this.saveQuotaUsage();
    }

    private saveQuotaUsage(): void {
        const quotaData = {
            used: this.quotaUsed,
            timestamp: Date.now(),
            date: new Date().toISOString().split('T')[0]
        };
        localStorage.setItem('youtube_quota_data', JSON.stringify(quotaData));
    }

    private loadQuotaUsage(): void {
        try {
            const storedData = localStorage.getItem('youtube_quota_data');
            if (storedData) {
                const data = JSON.parse(storedData);
                const today = new Date().toISOString().split('T')[0];
                if (data.date === today) {
                    this.quotaUsed = data.used;
                } else {
                    this.quotaUsed = 0;
                }
            }
        } catch (error) {
            console.warn('Error loading quota data:', error);
            this.quotaUsed = 0;
        }
    }

    private async handleApiError(error: AxiosError<YouTubeApiError>): Promise<never> {
        if (error.response) {
            const errorData = error.response.data?.error;
            const errorMessage = errorData?.message || 'Unknown error';
            const errorReason = errorData?.errors?.[0]?.reason;
            
            switch (error.response.status) {
                case 400:
                    throw new Error(`Invalid request: ${errorMessage}`);
                case 401:
                    throw new Error(`Authentication failed: ${errorMessage}`);
                case 403:
                    if (errorReason === 'quotaExceeded') {
                        throw new Error('YouTube API quota exceeded. Please try again later.');
                    }
                    throw new Error(`Access forbidden: ${errorMessage}`);
                case 404:
                    throw new Error(`Resource not found: ${errorMessage}`);
                case 429:
                    throw new Error(`Rate limit exceeded. Please try again later: ${errorMessage}`);
                case 500:
                case 503:
                    throw new Error(`YouTube API service error: ${errorMessage}`);
                default:
                    throw new Error(`YouTube API error (${error.response.status}): ${errorMessage}`);
            }
        }
        
        if (error.request) {
            throw new Error('No response received from YouTube API');
        }
        
        throw new Error(`Error setting up request: ${error.message}`);
    }

    private isQuotaExceeded(error: any): boolean {
        return (
            error?.response?.status === 403 &&
            error?.response?.data?.error?.errors?.some(
                (e: any) => e.reason === 'quotaExceeded'
            )
        );
    }
} 