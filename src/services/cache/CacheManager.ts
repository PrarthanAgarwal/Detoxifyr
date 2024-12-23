import Redis from 'ioredis';
import { LRUCache } from 'lru-cache';

export interface CacheConfig {
  strategy: CacheStrategy;
  ttl: number;
  maxSize: number;
}

export enum CacheStrategy {
  MEMORY_ONLY = 'MEMORY_ONLY',
  REDIS_ONLY = 'REDIS_ONLY',
  MULTI_LEVEL = 'MULTI_LEVEL'
}

export interface CacheOptions {
  ttl?: number;
  priority?: number;
}

export class CacheManager {
  private static instance: CacheManager;
  private readonly redis: Redis;
  private readonly memoryCache: LRUCache<string, any>;
  private readonly config: CacheConfig;
  
  private readonly defaultConfig: CacheConfig = {
    strategy: CacheStrategy.MULTI_LEVEL,
    ttl: 3600000, // 1 hour
    maxSize: 1000
  };

  private constructor(config?: CacheConfig) {
    this.config = config || this.defaultConfig;
    
    // Initialize memory cache
    this.memoryCache = new LRUCache<string, any>({
      max: this.config.maxSize,
      ttl: this.config.ttl,
      updateAgeOnGet: true
    });

    // Initialize Redis
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });
  }

  public static getInstance(config?: CacheConfig): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager(config);
    }
    return CacheManager.instance;
  }

  public async get<T>(key: string): Promise<T | null> {
    // Try memory cache first
    if (this.shouldUseMemoryCache()) {
      const memoryResult = this.memoryCache.get(key) as T;
      if (memoryResult !== undefined) {
        return memoryResult;
      }
    }

    // Try Redis if memory cache miss
    if (this.shouldUseRedis()) {
      try {
        const redisResult = await this.redis.get(key);
        if (redisResult) {
          const parsed = JSON.parse(redisResult) as T;
          // Update memory cache if using multi-level
          if (this.config.strategy === CacheStrategy.MULTI_LEVEL) {
            this.memoryCache.set(key, parsed);
          }
          return parsed;
        }
      } catch (error) {
        console.error('Redis cache error:', error);
      }
    }

    return null;
  }

  public async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const ttl = options?.ttl || this.config.ttl;

    // Set in memory cache
    if (this.shouldUseMemoryCache()) {
      this.memoryCache.set(key, value, { ttl });
    }

    // Set in Redis
    if (this.shouldUseRedis()) {
      try {
        await this.redis
          .multi()
          .set(key, JSON.stringify(value))
          .pexpire(key, ttl)
          .exec();
      } catch (error) {
        console.error('Redis cache error:', error);
      }
    }
  }

  public async invalidate(pattern: string): Promise<void> {
    // Clear memory cache entries matching pattern
    if (this.shouldUseMemoryCache()) {
      for (const key of this.memoryCache.keys()) {
        if (typeof key === 'string' && key.includes(pattern)) {
          this.memoryCache.delete(key);
        }
      }
    }

    // Clear Redis entries matching pattern
    if (this.shouldUseRedis()) {
      try {
        const keys = await this.redis.keys(`*${pattern}*`);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } catch (error) {
        console.error('Redis cache error:', error);
      }
    }
  }

  private shouldUseMemoryCache(): boolean {
    return [CacheStrategy.MEMORY_ONLY, CacheStrategy.MULTI_LEVEL].includes(this.config.strategy);
  }

  private shouldUseRedis(): boolean {
    return [CacheStrategy.REDIS_ONLY, CacheStrategy.MULTI_LEVEL].includes(this.config.strategy);
  }

  public async close(): Promise<void> {
    await this.redis.quit();
  }
} 