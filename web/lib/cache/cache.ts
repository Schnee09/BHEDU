/**
 * Cache Layer
 *
 * Simple in-memory cache with TTL support for reducing database queries.
 * Ideal for data that changes infrequently (subjects, academic_years, settings).
 *
 * @example
 * // Cache subjects for 5 minutes
 * const subjects = await cached('subjects:all', () => SubjectService.getSubjects(), 300);
 *
 * // Invalidate cache when data changes
 * invalidateCache('subjects:');
 */

type CacheEntry<T> = {
    data: T;
    expires: number;
    tags: string[];
};

class CacheStore {
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

    set<T>(
        key: string,
        data: T,
        ttlSeconds: number,
        tags: string[] = [],
    ): void {
        const expires = Date.now() + ttlSeconds * 1000;
        this.store.set(key, { data, expires, tags });

        // Update tag index
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
            // Remove from tag index
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

// Singleton instance
const cacheStore = new CacheStore();

/**
 * Fetch with cache - returns cached data if available, otherwise fetches and caches
 */
export async function cached<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: {
        ttl?: number; // TTL in seconds (default: 300 = 5 min)
        tags?: string[]; // Tags for group invalidation
    } = {},
): Promise<T> {
    const { ttl = 300, tags = [] } = options;

    // Check cache first
    const cachedData = cacheStore.get<T>(key);
    if (cachedData !== null) {
        return cachedData;
    }

    // Fetch fresh data
    const data = await fetcher();

    // Store in cache
    cacheStore.set(key, data, ttl, tags);

    return data;
}

/**
 * Invalidate cache entries by prefix
 * @example invalidateCache('subjects:') // Invalidates all subject-related cache
 */
export function invalidateCache(prefix: string): number {
    return cacheStore.invalidateByPrefix(prefix);
}

/**
 * Invalidate cache entries by tag
 * @example invalidateCacheByTag('user:123') // Invalidates all cache for user 123
 */
export function invalidateCacheByTag(tag: string): number {
    return cacheStore.invalidateByTag(tag);
}

/**
 * Clear all cache
 */
export function clearCache(): void {
    cacheStore.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; keys: string[] } {
    return cacheStore.stats();
}

// Pre-defined cache keys for consistency
export const CACHE_KEYS = {
    SUBJECTS_ALL: "subjects:all",
    SUBJECTS_ACTIVE: "subjects:active",
    ACADEMIC_YEARS_ALL: "academic_years:all",
    ACADEMIC_YEARS_CURRENT: "academic_years:current",
    SEMESTERS_ALL: "semesters:all",
    SETTINGS: (category: string) => `settings:${category}`,
    CLASS: (id: string) => `class:${id}`,
    STUDENT: (id: string) => `student:${id}`,
    COURSES_ALL: "courses:all",
} as const;

// Pre-defined TTL values (in seconds)
export const CACHE_TTL = {
    SHORT: 60, // 1 minute
    MEDIUM: 300, // 5 minutes
    LONG: 900, // 15 minutes
    HOUR: 3600, // 1 hour
    DAY: 86400, // 24 hours
} as const;
