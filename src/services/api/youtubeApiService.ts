import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { YouTubeAuthService } from '../auth/youtubeAuth';
import { YouTubeApiError } from '../../types/api.types';
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
    private dailyQuotaLimit: number = 10000;
    private quotaUsed: number = 0;
    
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

    private getEndpointFromUrl(url: string): keyof QuotaCost {
        if (url.includes('/search')) return 'search';
        if (url.includes('/videos')) return 'videos';
        if (url.includes('/channels')) return 'channels';
        return 'videos'; // default cost
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
            const errorMessage = error.response.data?.error?.message || 'Unknown error';
            
            switch (error.response.status) {
                case 401:
                    throw new Error(`Authentication failed: ${errorMessage}`);
                case 403:
                    throw new Error(`Quota exceeded or insufficient permissions: ${errorMessage}`);
                case 404:
                    throw new Error(`Resource not found: ${errorMessage}`);
                case 429:
                    throw new Error(`Rate limit exceeded. Please try again later: ${errorMessage}`);
                default:
                    throw new Error(`YouTube API error: ${errorMessage}`);
            }
        }
        
        if (error.request) {
            throw new Error('No response received from YouTube API');
        }
        
        throw new Error(`Error setting up request: ${error.message}`);
    }

    public async searchVideos(
        query: string, 
        maxResults: number = 25,
        safeSearch: 'none' | 'moderate' | 'strict' = 'moderate',
        order: 'date' | 'rating' | 'relevance' | 'title' | 'viewCount' = 'relevance',
        pageToken?: string
    ): Promise<YouTubeSearchResponse> {
        try {
            const response = await this.axiosInstance.get<YouTubeSearchResponse>('/search', {
                params: {
                    part: 'snippet',
                    q: query,
                    maxResults,
                    type: 'video',
                    safeSearch,
                    videoEmbeddable: true,
                    order,
                    ...(pageToken && { pageToken })
                }
            });

            if (!response.data.items || response.data.items.length === 0) {
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
        } catch (error) {
            if (this.isQuotaExceeded(error)) {
                throw new Error('YouTube API quota exceeded. Please try again later.');
            }
            throw this.handleApiError(error as AxiosError<YouTubeApiError>);
        }
    }

    public async getVideoDetails(videoIds: string): Promise<YouTubeVideoResponse> {
        try {
            const response = await this.axiosInstance.get<YouTubeVideoResponse>('/videos', {
                params: {
                    part: 'snippet,contentDetails,statistics',
                    id: videoIds,
                    maxResults: 50
                }
            });
            
            if (!response.data.items || response.data.items.length === 0) {
                console.warn(`No video data found for IDs: ${videoIds}`);
                return {
                    kind: 'youtube#videoListResponse',
                    etag: '',
                    items: [],
                    pageInfo: { totalResults: 0, resultsPerPage: 0 }
                };
            }
            
            return response.data;
        } catch (error) {
            if (this.isQuotaExceeded(error)) {
                throw new Error('YouTube API quota exceeded. Please try again later.');
            }
            console.error(`Error fetching video details for IDs: ${videoIds}`, error);
            throw this.handleApiError(error as AxiosError<YouTubeApiError>);
        }
    }

    public async getChannelInfo(channelIds: string): Promise<YouTubeChannelResponse> {
        try {
            const response = await this.axiosInstance.get<YouTubeChannelResponse>('/channels', {
                params: {
                    part: 'snippet,contentDetails,statistics',
                    id: channelIds,
                    maxResults: 50
                }
            });
            
            if (!response.data.items || response.data.items.length === 0) {
                console.warn(`No channel data found for IDs: ${channelIds}`);
                return {
                    kind: 'youtube#channelListResponse',
                    etag: '',
                    items: [],
                    pageInfo: { totalResults: 0, resultsPerPage: 0 }
                };
            }
            
            return response.data;
        } catch (error) {
            if (this.isQuotaExceeded(error)) {
                throw new Error('YouTube API quota exceeded. Please try again later.');
            }
            console.error(`Error fetching channel info for IDs: ${channelIds}`, error);
            throw this.handleApiError(error as AxiosError<YouTubeApiError>);
        }
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