import Redis from 'ioredis';

export interface RateLimiterConfig {
  tokensPerInterval: number;
  interval: number; // in milliseconds
  burstSize: number;
}

export interface RateLimitInfo {
  isAllowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export class TokenBucketLimiter {
  private static instance: TokenBucketLimiter;
  private readonly redis: Redis;
  private readonly _config: RateLimiterConfig;
  private readonly defaultConfig: RateLimiterConfig = {
    tokensPerInterval: 100,
    interval: 60000, // 1 minute
    burstSize: 150
  };

  private constructor(config?: RateLimiterConfig) {
    this._config = config || this.defaultConfig;
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

  public static getInstance(config?: RateLimiterConfig): TokenBucketLimiter {
    if (!TokenBucketLimiter.instance) {
      TokenBucketLimiter.instance = new TokenBucketLimiter(config);
    }
    return TokenBucketLimiter.instance;
  }

  public get config(): Readonly<RateLimiterConfig> {
    return this._config;
  }

  public async checkLimit(userId: string): Promise<RateLimitInfo> {
    const key = `rate_limit:${userId}`;
    const now = Date.now();

    const multi = this.redis.multi();
    multi.hgetall(key);
    multi.pttl(key);

    const [[bucketData]] = await multi.exec() as [[null | Record<string, string>, number]];

    if (!bucketData) {
      // Initialize new bucket
      const newBucket = {
        tokens: this._config.burstSize.toString(),
        lastRefill: now.toString()
      };

      await this.redis
        .multi()
        .hmset(key, newBucket)
        .pexpire(key, this._config.interval)
        .exec();

      return {
        isAllowed: true,
        remaining: this._config.burstSize - 1,
        resetTime: now + this._config.interval
      };
    }

    // Calculate token refill
    const tokens = parseInt(bucketData.tokens);
    const lastRefill = parseInt(bucketData.lastRefill);
    const timePassed = now - lastRefill;
    const refillAmount = Math.floor((timePassed * this._config.tokensPerInterval) / this._config.interval);
    const newTokens = Math.min(tokens + refillAmount, this._config.burstSize);

    if (newTokens < 1) {
      return {
        isAllowed: false,
        remaining: 0,
        resetTime: lastRefill + this._config.interval,
        retryAfter: Math.ceil((this._config.interval - timePassed) / 1000)
      };
    }

    // Update bucket
    const updatedBucket = {
      tokens: (newTokens - 1).toString(),
      lastRefill: now.toString()
    };

    await this.redis
      .multi()
      .hmset(key, updatedBucket)
      .pexpire(key, this._config.interval)
      .exec();

    return {
      isAllowed: true,
      remaining: newTokens - 1,
      resetTime: now + this._config.interval
    };
  }

  public async close(): Promise<void> {
    await this.redis.quit();
  }
} 