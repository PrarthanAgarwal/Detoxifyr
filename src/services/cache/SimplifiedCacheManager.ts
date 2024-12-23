import { LRUCache } from 'lru-cache';
import { LoggingService } from '../loggingService';

interface CacheOptions {
    maxSize?: number;
    ttl?: number;
}

export class SimplifiedCacheManager {
    private static instance: SimplifiedCacheManager;
    private cache: LRUCache<string, any>;
    private loggingService: LoggingService;
    private hitCount: number = 0;
    private missCount: number = 0;

    private constructor(options: CacheOptions = {}) {
        this.loggingService = LoggingService.getInstance();
        this.cache = new LRUCache({
            max: options.maxSize || 100,
            ttl: options.ttl || 1000 * 60 * 60, // 1 hour default TTL
            updateAgeOnGet: true
        });
    }

    public static getInstance(options?: CacheOptions): SimplifiedCacheManager {
        if (!SimplifiedCacheManager.instance) {
            SimplifiedCacheManager.instance = new SimplifiedCacheManager(options);
        }
        return SimplifiedCacheManager.instance;
    }

    public async get<T>(key: string): Promise<T | undefined> {
        try {
            const value = this.cache.get(key) as T;
            if (value !== undefined) {
                this.hitCount++;
            } else {
                this.missCount++;
            }
            this.loggingService.log('Cache get operation', {
                key,
                hit: value !== undefined
            });
            return value;
        } catch (error) {
            this.loggingService.log('Error in cache get operation', { error });
            return undefined;
        }
    }

    public async set(key: string, value: any, ttl?: number): Promise<void> {
        try {
            this.cache.set(key, value, {
                ttl: ttl || this.cache.ttl
            });
            this.loggingService.log('Cache set operation', { key });
        } catch (error) {
            this.loggingService.log('Error in cache set operation', { error });
        }
    }

    public async delete(key: string): Promise<void> {
        try {
            this.cache.delete(key);
            this.loggingService.log('Cache delete operation', { key });
        } catch (error) {
            this.loggingService.log('Error in cache delete operation', { error });
        }
    }

    public async clear(): Promise<void> {
        try {
            this.cache.clear();
            this.hitCount = 0;
            this.missCount = 0;
            this.loggingService.log('Cache clear operation');
        } catch (error) {
            this.loggingService.log('Error in cache clear operation', { error });
        }
    }

    public getStats(): { size: number; maxSize: number; hits: number; misses: number } {
        return {
            size: this.cache.size,
            maxSize: this.cache.max,
            hits: this.hitCount,
            misses: this.missCount
        };
    }
} 