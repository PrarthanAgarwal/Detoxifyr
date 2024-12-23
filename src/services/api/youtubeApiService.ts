import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { YouTubeAuthService } from '../auth/youtubeAuth';
import { YouTubeApiError } from '../../types/api.types';
import { YouTubeConfig } from '../../config/youtube.config';
import { 
    YouTubeSearchResponse, 
    YouTubeVideoResponse, 
    YouTubeChannelResponse
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
    private dailyQuotaLimit: number = YouTubeConfig.dailyQuotaLimit;
    private quotaUsed: number = 0;
    private retryAttempts: number = 3;
    private retryDelay: number = 1000;
    private apiKey: string = YouTubeConfig.apiKey;
    
    private quotaCosts: QuotaCost = {
        search: 100,
        videos: 1,
        channels: 1
    };

    private constructor() {
        this.authService = YouTubeAuthService.getInstance();
        this.axiosInstance = axios.create({
            baseURL: YouTubeConfig.baseUrl,
            timeout: YouTubeConfig.timeout
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

    private async retryOperation<T>(operation: () => Promise<T>, skipErrorCodes: string[] = []): Promise<T> {
        let lastError: Error | null = null;
        
        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error as Error;
                const statusCode = (error as AxiosError)?.response?.status?.toString();

                // Don't retry if error code is in skipErrorCodes or it's a quota exceeded error
                if (
                    this.isQuotaExceeded(error) || 
                    attempt === this.retryAttempts ||
                    (statusCode && skipErrorCodes.includes(statusCode))
                ) {
                    throw error;
                }

                // Exponential backoff
                const delay = this.retryDelay * Math.pow(2, attempt - 1);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        
        throw lastError;
    }

    private setupInterceptors(): void {
        this.axiosInstance.interceptors.request.use(
            async (config) => {
                if (!config.params) {
                    config.params = {};
                }
                config.params.key = this.apiKey;

                if (this.requiresAuth(config.url || '')) {
                    const token = await this.authService.getValidToken();
                    config.headers.Authorization = `Bearer ${token}`;
                }
                
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

    private requiresAuth(url: string): boolean {
        const authEndpoints = [
            '/commentThreads',
            '/subscriptions',
            '/playlistItems'
        ];
        return authEndpoints.some(endpoint => url.includes(endpoint));
    }

    public async searchVideos(
        params: {
            query: string;
            videoDuration?: string;
            videoEmbeddable?: boolean;
            type?: string;
            part?: string[];
            maxResults?: number;
            safeSearch?: 'none' | 'moderate' | 'strict';
            order?: 'date' | 'rating' | 'relevance' | 'title' | 'viewCount';
            regionCode?: string;
            relevanceLanguage?: string;
        }
    ): Promise<YouTubeSearchResponse> {
        const {
            query,
            videoDuration = 'any',
            videoEmbeddable = true,
            type = 'video',
            part = ['snippet', 'id'],
            maxResults = 25,
            safeSearch = 'moderate',
            order = 'relevance',
            regionCode,
            relevanceLanguage
        } = params;

        // Validate and sanitize parts
        const validParts = this.validateSearchParts(part);
        const fields = this.buildSearchFields(validParts);

        return this.retryOperation(async () => {
            const response = await this.axiosInstance.get<YouTubeSearchResponse>('/search', {
                params: {
                    q: query,
                    part: validParts.join(','),
                    maxResults,
                    type,
                    safeSearch,
                    videoEmbeddable,
                    videoDuration,
                    order,
                    videoDefinition: 'high',
                    fields,
                    ...(regionCode && { regionCode }),
                    ...(relevanceLanguage && { relevanceLanguage })
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
        }, ['400']); // Don't retry on 400 Bad Request errors
    }

    private validateSearchParts(parts: string[]): string[] {
        const validSearchParts = ['snippet', 'id'];
        return parts.filter(part => validSearchParts.includes(part));
    }

    private buildSearchFields(parts: string[]): string {
        const fieldMappings: { [key: string]: string[] } = {
            snippet: [
                'title',
                'description',
                'publishedAt',
                'thumbnails',
                'channelId',
                'channelTitle'
            ],
            id: ['kind', 'videoId']
        };

        const selectedFields = parts.map(part => {
            const fields = fieldMappings[part];
            return fields ? part : null;
        }).filter(Boolean);

        if (selectedFields.includes('id')) {
            return 'items(id/videoId,snippet),nextPageToken,prevPageToken,pageInfo';
        }
        
        return 'items(snippet),nextPageToken,prevPageToken,pageInfo';
    }

    public async getVideoDetails(videoIds: string | string[]): Promise<YouTubeVideoResponse> {
        const ids = Array.isArray(videoIds) ? videoIds.join(',') : videoIds;
        
        return this.retryOperation(async () => {
            const response = await this.axiosInstance.get<YouTubeVideoResponse>('/videos', {
                params: {
                    part: 'snippet,contentDetails,statistics,status',
                    id: ids,
                    maxResults: 50,
                    fields: 'items(id,snippet,contentDetails,statistics,status),pageInfo'
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
            const errorDetails = this.formatErrorDetails(errorData);
            
            switch (error.response.status) {
                case 400:
                    throw new Error(`Invalid request: ${errorMessage}${errorDetails}`);
                case 401:
                    throw new Error(`Authentication failed: ${errorMessage}${errorDetails}`);
                case 403:
                    if (errorReason === 'quotaExceeded') {
                        throw new Error('YouTube API quota exceeded. Please try again later.');
                    }
                    throw new Error(`Access forbidden: ${errorMessage}${errorDetails}`);
                case 404:
                    throw new Error(`Resource not found: ${errorMessage}${errorDetails}`);
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

    private formatErrorDetails(errorData: any): string {
        if (!errorData?.errors?.length) return '';

        const details = errorData.errors.map((err: any) => {
            if (err.location) {
                return ` (${err.location}: ${err.message})`;
            }
            return ` (${err.message})`;
        }).join('');

        return details;
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