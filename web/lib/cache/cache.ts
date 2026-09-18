/**
 * Cache Layer
 *
 * Distributed cache powered by Upstash Redis (REST-based, serverless-native)
 * with transparent in-memory fallback for local development and test environments.
 *
 * @example
 * // Cache subjects for 5 minutes
 * const subjects = await cached('subjects:all', () => SubjectService.getSubjects(), { ttl: 300 });
 *
 * // Invalidate cache when data changes
 * await invalidateCache('subjects:');
 */

type CacheEntry<T> = {
  data: T;
  expires: number;
  tags: string[];
};

class MemoryCacheStore {
  private store = new Map<string, CacheEntry<unknown>>();
  private tagIndex = new Map<string, Set<string>>();

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (entry.expires < Date.now()) {
      this.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlSeconds: number, tags: string[] = []): void {
    const expires = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { data, expires, tags });

    for (const tag of tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(key);
    }
  }

  delete(key: string): void {
    const entry = this.store.get(key);
    if (entry) {
      for (const tag of entry.tags) {
        this.tagIndex.get(tag)?.delete(key);
      }
    }
    this.store.delete(key);
  }

  invalidateByPrefix(prefix: string): number {
    let count = 0;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.delete(key);
        count++;
      }
    }
    return count;
  }

  invalidateByTag(tag: string): number {
    const keys = this.tagIndex.get(tag);
    if (!keys) return 0;

    let count = 0;
    for (const key of keys) {
      this.delete(key);
      count++;
    }
    this.tagIndex.delete(tag);
    return count;
  }

  clear(): void {
    this.store.clear();
    this.tagIndex.clear();
  }

  stats(): { size: number; keys: string[] } {
    return {
      size: this.store.size,
      keys: Array.from(this.store.keys()),
    };
  }
}

const memoryStore = new MemoryCacheStore();

let redisClientInstance: any = null;
let redisInitialized = false;

async function getRedisClient(): Promise<any | null> {
  if (redisInitialized) return redisClientInstance;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    try {
      const { Redis } = await import('@upstash/redis');
      redisClientInstance = new Redis({ url, token });
    } catch (err) {
      console.warn(
        '[Cache] Failed to initialize Upstash Redis, falling back to in-memory store:',
        err
      );
      redisClientInstance = null;
    }
  } else {
    redisClientInstance = null;
  }

  redisInitialized = true;
  return redisClientInstance;
}

/**
 * Fetch with cache - returns cached data if available (from Upstash Redis or In-Memory),
 * otherwise fetches fresh data and caches it.
 */
export async function cached<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number; // TTL in seconds (default: 300 = 5 min)
    tags?: string[]; // Tags for group invalidation
  } = {}
): Promise<T> {
  const { ttl = 300, tags = [] } = options;
  const redis = await getRedisClient();

  if (redis) {
    try {
      const cachedData = await redis.get(key);
      if (cachedData !== null && cachedData !== undefined) {
        return cachedData as T;
      }
    } catch (err) {
      console.warn(
        `[Cache] Redis get error for key "${key}", falling back to memory/fetcher:`,
        err
      );
    }
  } else {
    const cachedData = memoryStore.get<T>(key);
    if (cachedData !== null) {
      return cachedData;
    }
  }

  // Fetch fresh data (secondary defense line / cache miss path)
  const data = await fetcher();

  if (redis) {
    try {
      await redis.set(key, data, { ex: ttl });
      if (tags.length > 0) {
        await Promise.all(tags.map((tag) => redis.sadd(`tag:${tag}`, key)));
      }
    } catch (err) {
      console.warn(`[Cache] Redis set error for key "${key}":`, err);
    }
  } else {
    memoryStore.set(key, data, ttl, tags);
  }

  return data;
}

/**
 * Invalidate cache entries by prefix across Redis or In-Memory
 * @example await invalidateCache('subjects:')
 */
export async function invalidateCache(prefix: string): Promise<number> {
  const redis = await getRedisClient();
  if (redis) {
    try {
      const keys = await redis.keys(`${prefix}*`);
      if (keys && keys.length > 0) {
        await redis.del(...keys);
      }
      return keys?.length || 0;
    } catch (err) {
      console.warn(`[Cache] Redis invalidateByPrefix error for "${prefix}":`, err);
    }
  }
  return memoryStore.invalidateByPrefix(prefix);
}

/**
 * Invalidate cache entries by tag across Redis or In-Memory
 * @example await invalidateCacheByTag('user:123')
 */
export async function invalidateCacheByTag(tag: string): Promise<number> {
  const redis = await getRedisClient();
  if (redis) {
    try {
      const tagKey = `tag:${tag}`;
      const keys = await redis.smembers(tagKey);
      if (keys && keys.length > 0) {
        await redis.del(...keys, tagKey);
        return keys.length;
      }
      return 0;
    } catch (err) {
      console.warn(`[Cache] Redis invalidateByTag error for "${tag}":`, err);
    }
  }
  return memoryStore.invalidateByTag(tag);
}

/**
 * Clear all cache
 */
export async function clearCache(): Promise<void> {
  const redis = await getRedisClient();
  if (redis) {
    try {
      await redis.flushdb();
    } catch (err) {
      console.warn('[Cache] Redis clear error:', err);
    }
  }
  memoryStore.clear();
}

/**
 * Get cache statistics and active provider
 */
export async function getCacheStats(): Promise<{
  provider: 'redis' | 'memory';
  size?: number;
  keys?: string[];
}> {
  const redis = await getRedisClient();
  if (redis) {
    try {
      const dbsize = await redis.dbsize();
      return { provider: 'redis', size: dbsize };
    } catch {
      return { provider: 'redis' };
    }
  }
  const mem = memoryStore.stats();
  return { provider: 'memory', ...mem };
}

// Pre-defined cache keys for consistency
export const CACHE_KEYS = {
  SUBJECTS_ALL: 'subjects:all',
  SUBJECTS_ACTIVE: 'subjects:active',
  ACADEMIC_YEARS_ALL: 'academic_years:all',
  ACADEMIC_YEARS_CURRENT: 'academic_years:current',
  SEMESTERS_ALL: 'semesters:all',
  SEMESTER_ACTIVE: 'semesters:active',
  SETTINGS: (category: string) => `settings:${category}`,
  CLASS: (id: string) => `class:${id}`,
  STUDENT: (id: string) => `student:${id}`,
  COURSES_ALL: 'courses:all',
  RANKINGS: (classId: string, semester?: string) => `rankings:${classId}:${semester || 'all'}`,
  DASHBOARD_METRICS: (userId: string, role: string) => `dashboard:metrics:${role}:${userId}`,
} as const;

// Pre-defined TTL values (in seconds)
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 900, // 15 minutes
  HOUR: 3600, // 1 hour
  DAY: 86400, // 24 hours
} as const;
