interface CacheItem<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

export class CacheService {
    private static instance: CacheService;
    private cache: Map<string, CacheItem<any>>;
    private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

    private constructor() {
        this.cache = new Map();
        this.startCleanupInterval();
    }

    public static getInstance(): CacheService {
        if (!CacheService.instance) {
            CacheService.instance = new CacheService();
        }
        return CacheService.instance;
    }

    public set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });
    }

    public get<T>(key: string): T | null {
        const item = this.cache.get(key);
        
        if (!item) return null;
        
        if (this.isExpired(item)) {
            this.cache.delete(key);
            return null;
        }

        return item.data as T;
    }

    public remove(key: string): void {
        this.cache.delete(key);
    }

    public clear(): void {
        this.cache.clear();
    }

    private isExpired(item: CacheItem<any>): boolean {
        return Date.now() - item.timestamp > item.ttl;
    }

    private startCleanupInterval(): void {
        setInterval(() => {
            for (const [key, item] of this.cache.entries()) {
                if (this.isExpired(item)) {
                    this.cache.delete(key);
                }
            }
        }, 60000); // Clean up every minute
    }
}