import {
  cached,
  invalidateCache,
  invalidateCacheByTag,
  clearCache,
  getCacheStats,
  CACHE_KEYS,
} from '../cache';

describe('Hybrid Cache Engine', () => {
  beforeEach(async () => {
    await clearCache();
  });

  it('should cache and return data on subsequent calls without invoking fetcher', async () => {
    const fetcher = jest.fn().mockResolvedValue({ message: 'hello world' });

    const res1 = await cached('test:key', fetcher, { ttl: 60 });
    expect(res1).toEqual({ message: 'hello world' });
    expect(fetcher).toHaveBeenCalledTimes(1);

    const res2 = await cached('test:key', fetcher, { ttl: 60 });
    expect(res2).toEqual({ message: 'hello world' });
    expect(fetcher).toHaveBeenCalledTimes(1); // Still 1 time (served from cache)
  });

  it('should invalidate cache by prefix', async () => {
    const fetcher1 = jest.fn().mockResolvedValue('data1');
    const fetcher2 = jest.fn().mockResolvedValue('data2');

    await cached('subjects:math', fetcher1, { ttl: 60 });
    await cached('subjects:physics', fetcher2, { ttl: 60 });

    const invalidatedCount = await invalidateCache('subjects:');
    expect(invalidatedCount).toBeGreaterThanOrEqual(2);

    // Calling again should re-fetch
    await cached('subjects:math', fetcher1, { ttl: 60 });
    expect(fetcher1).toHaveBeenCalledTimes(2);
  });

  it('should invalidate cache by tag', async () => {
    const fetcher = jest.fn().mockResolvedValue('tagged_data');

    await cached('class:10a1', fetcher, { ttl: 60, tags: ['class_data'] });
    await invalidateCacheByTag('class_data');

    await cached('class:10a1', fetcher, { ttl: 60, tags: ['class_data'] });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('should report cache provider status', async () => {
    const stats = await getCacheStats();
    expect(['redis', 'memory']).toContain(stats.provider);
  });

  it('should format CACHE_KEYS correctly', () => {
    expect(CACHE_KEYS.SUBJECTS_ALL).toBe('subjects:all');
    expect(CACHE_KEYS.RANKINGS('class_123', 'semester_1')).toBe('rankings:class_123:semester_1');
  });
});
