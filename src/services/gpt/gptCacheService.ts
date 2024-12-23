import { CacheService } from '../cacheService';
import { GPTCacheItem, GPTAnalysis, AnalysisType } from '../../types/gpt.types';
import { createHash } from 'crypto';

export class GPTCacheService {
    private static instance: GPTCacheService;
    private cache: CacheService;
    private readonly CACHE_PREFIX = 'gpt_analysis_';
    private readonly CACHE_VERSION = 'v1';

    private constructor() {
        this.cache = CacheService.getInstance();
    }

    public static getInstance(): GPTCacheService {
        if (!GPTCacheService.instance) {
            GPTCacheService.instance = new GPTCacheService();
        }
        return GPTCacheService.instance;
    }

    public async get(videoId: string, context?: string): Promise<GPTCacheItem | null> {
        const key = this.generateCacheKey(videoId, context);
        return this.cache.get<GPTCacheItem>(key);
    }

    public async set(
        videoId: string, 
        analysis: GPTAnalysis, 
        analysisType: AnalysisType,
        context?: string
    ): Promise<void> {
        const key = this.generateCacheKey(videoId, context);
        const item: GPTCacheItem = {
            analysis,
            timestamp: Date.now(),
            videoId,
            queryContext: context
        };
        
        this.cache.set(key, item, this.getCacheTTL(analysisType));
    }

    public async invalidate(videoId: string, context?: string): Promise<void> {
        const key = this.generateCacheKey(videoId, context);
        this.cache.remove(key);
    }

    private generateCacheKey(videoId: string, context?: string): string {
        const contextHash = context ? this.hashString(context) : '';
        return `${this.CACHE_PREFIX}${this.CACHE_VERSION}_${videoId}_${contextHash}`;
    }

    private getCacheTTL(analysisType: AnalysisType): number {
        const TTLMap = {
            'relevancy': 24 * 60 * 60 * 1000,  // 24 hours
            'metadata': 7 * 24 * 60 * 60 * 1000,  // 7 days
            'content': 30 * 24 * 60 * 60 * 1000  // 30 days
        };
        return TTLMap[analysisType] || 24 * 60 * 60 * 1000;
    }

    private hashString(str: string): string {
        return createHash('md5').update(str).digest('hex');
    }
} 