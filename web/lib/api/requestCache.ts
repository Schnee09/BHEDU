/**
 * Request Cache and Deduplication Utility
 *
 * Features:
 * - LRU cache for GET requests
 * - Request deduplication for in-flight requests
 * - Configurable TTL per endpoint
 * - Memory-efficient storage
 */

import { logger } from "@/lib/logger";

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

interface InFlightRequest {
    promise: Promise<any>;
    timestamp: number;
}

class RequestCache {
    private cache: Map<string, CacheEntry<any>> = new Map();
    private inFlight: Map<string, InFlightRequest> = new Map();
    private maxSize: number = 100;
    private defaultTTL: number = 5 * 60 * 1000; // 5 minutes

    /**
     * Generate cache key from URL and options
     */
    private getCacheKey(url: string, options?: RequestInit): string {
        const method = options?.method || "GET";
        const body = options?.body ? JSON.stringify(options.body) : "";
        return `${method}:${url}:${body}`;
    }

    /**
     * Check if cache entry is still valid
     */
    private isValid(entry: CacheEntry<any>): boolean {
        return Date.now() - entry.timestamp < entry.ttl;
    }

    /**
     * Evict oldest entries if cache is full
     */
    private evictIfNeeded(): void {
        if (this.cache.size >= this.maxSize) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey) {
                this.cache.delete(oldestKey);
                logger.debug("Cache eviction", {
                    key: oldestKey,
                    size: this.cache.size,
                });
            }
        }
    }

    /**
     * Get cached data if available and valid
     */
    get<T>(url: string, options?: RequestInit): T | null {
        const key = this.getCacheKey(url, options);
        const entry = this.cache.get(key);

        if (!entry) {
            logger.debug("Cache miss", {
                url,
                method: options?.method || "GET",
            });
            return null;
        }

        if (!this.isValid(entry)) {
            this.cache.delete(key);
            logger.debug("Cache expired", {
                url,
                age: Date.now() - entry.timestamp,
            });
            return null;
        }

        logger.debug("Cache hit", { url, age: Date.now() - entry.timestamp });
        return entry.data as T;
    }

    /**
     * Store data in cache
     */
    set<T>(url: string, data: T, options?: RequestInit, ttl?: number): void {
        const key = this.getCacheKey(url, options);
        this.evictIfNeeded();

        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl: ttl || this.defaultTTL,
        });

        logger.debug("Cache set", { url, ttl: ttl || this.defaultTTL });
    }

    /**
     * Invalidate cache entries matching pattern
     */
    invalidate(pattern: string | RegExp): number {
        let count = 0;
        const keysToDelete: string[] = [];

        for (const key of this.cache.keys()) {
            const matches = typeof pattern === "string"
                ? key.includes(pattern)
                : pattern.test(key);

            if (matches) {
                keysToDelete.push(key);
                count++;
            }
        }

        keysToDelete.forEach((key) => this.cache.delete(key));
        logger.debug("Cache invalidation", {
            pattern: pattern.toString(),
            count,
        });

        return count;
    }

    /**
     * Clear all cache entries
     */
    clear(): void {
        const size = this.cache.size;
        this.cache.clear();
        logger.debug("Cache cleared", { entriesRemoved: size });
    }

    /**
     * Get or create in-flight request (deduplication)
     */
    getOrSetInFlight<T>(
        url: string,
        options: RequestInit | undefined,
        fetcher: () => Promise<T>,
    ): Promise<T> {
        const key = this.getCacheKey(url, options);
        const existing = this.inFlight.get(key);

        // Return existing in-flight request
        if (existing) {
            logger.debug("Request deduplication", {
                url,
                age: Date.now() - existing.timestamp,
            });
            return existing.promise;
        }

        // Create new request
        const promise = fetcher().finally(() => {
            this.inFlight.delete(key);
            logger.debug("In-flight request completed", { url });
        });

        this.inFlight.set(key, {
            promise,
            timestamp: Date.now(),
        });

        logger.debug("In-flight request started", { url });
        return promise;
    }

    /**
     * Get cache statistics
     */
    getStats() {
        return {
            cacheSize: this.cache.size,
            inFlightCount: this.inFlight.size,
            maxSize: this.maxSize,
        };
    }
}

// Singleton instance
export const requestCache = new RequestCache();

/**
 * Cache configuration for specific endpoints
 */
export const cacheConfig: Record<string, number> = {
    "/api/classes": 2 * 60 * 1000, // 2 minutes
    "/api/students": 2 * 60 * 1000, // 2 minutes
    "/api/subjects": 5 * 60 * 1000, // 5 minutes
    "/api/settings": 10 * 60 * 1000, // 10 minutes
};

/**
 * Get TTL for a specific URL
 */
export function getTTL(url: string): number | undefined {
    for (const [pattern, ttl] of Object.entries(cacheConfig)) {
        if (url.includes(pattern)) {
            return ttl;
        }
    }
    return undefined;
}
