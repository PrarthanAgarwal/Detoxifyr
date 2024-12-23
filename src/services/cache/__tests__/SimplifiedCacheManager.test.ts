import { SimplifiedCacheManager } from '../SimplifiedCacheManager';
import { LoggingService } from '../../loggingService';

jest.mock('../../loggingService');

describe('SimplifiedCacheManager', () => {
    let cacheManager: SimplifiedCacheManager;

    beforeEach(() => {
        jest.clearAllMocks();
        cacheManager = SimplifiedCacheManager.getInstance({
            maxSize: 10,
            ttl: 1000
        });
        cacheManager.clear();
    });

    it('should store and retrieve values', async () => {
        const key = 'test-key';
        const value = { data: 'test-value' };

        await cacheManager.set(key, value);
        const retrieved = await cacheManager.get(key);

        expect(retrieved).toEqual(value);
    });

    it('should handle cache misses', async () => {
        const key = 'non-existent-key';
        const value = await cacheManager.get(key);

        expect(value).toBeUndefined();
    });

    it('should delete values', async () => {
        const key = 'test-key';
        const value = { data: 'test-value' };

        await cacheManager.set(key, value);
        await cacheManager.delete(key);
        const retrieved = await cacheManager.get(key);

        expect(retrieved).toBeUndefined();
    });

    it('should clear all values', async () => {
        const keys = ['key1', 'key2', 'key3'];
        const value = { data: 'test-value' };

        for (const key of keys) {
            await cacheManager.set(key, value);
        }

        await cacheManager.clear();

        for (const key of keys) {
            const retrieved = await cacheManager.get(key);
            expect(retrieved).toBeUndefined();
        }
    });

    it('should track cache statistics', async () => {
        const key = 'test-key';
        const value = { data: 'test-value' };

        // Initial stats
        let stats = cacheManager.getStats();
        expect(stats.size).toBe(0);
        expect(stats.hits).toBe(0);
        expect(stats.misses).toBe(0);

        // Cache miss
        await cacheManager.get(key);
        stats = cacheManager.getStats();
        expect(stats.misses).toBe(1);

        // Cache set and hit
        await cacheManager.set(key, value);
        await cacheManager.get(key);
        stats = cacheManager.getStats();
        expect(stats.hits).toBe(1);
        expect(stats.size).toBe(1);
    });

    it('should respect max size limit', async () => {
        const values = Array.from({ length: 15 }, (_, i) => ({
            key: `key${i}`,
            value: { data: `value${i}` }
        }));

        // Fill cache beyond max size
        for (const { key, value } of values) {
            await cacheManager.set(key, value);
        }

        const stats = cacheManager.getStats();
        expect(stats.size).toBeLessThanOrEqual(stats.maxSize);

        // Early items should be evicted
        const firstItem = await cacheManager.get(values[0].key);
        expect(firstItem).toBeUndefined();

        // Recent items should still be present
        const lastItem = await cacheManager.get(values[values.length - 1].key);
        expect(lastItem).toBeDefined();
    });

    it('should handle errors gracefully', async () => {
        const key = 'test-key';
        const circularRef: any = {};
        circularRef.self = circularRef;

        // Attempting to cache a circular reference should not throw
        await expect(cacheManager.set(key, circularRef)).resolves.not.toThrow();

        // Failed operations should be logged
        const mockLoggingService = LoggingService.getInstance() as jest.Mocked<LoggingService>;
        expect(mockLoggingService.log).toHaveBeenCalledWith(
            'Error in cache set operation',
            expect.any(Object)
        );
    });

    it('should maintain singleton instance', () => {
        const instance1 = SimplifiedCacheManager.getInstance();
        const instance2 = SimplifiedCacheManager.getInstance({
            maxSize: 20,
            ttl: 2000
        });

        expect(instance1).toBe(instance2);
    });
}); 