/**
 * Authentication Cache Layer
 * Improves performance by caching profile lookups
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

/**
 * In-memory cache store
 * In production, consider using Redis for distributed systems
 */
const cacheStore = new Map<string, CacheEntry<any>>()

/**
 * Cache configuration
 */
export interface CacheConfig {
  ttl: number // Time to live in milliseconds
  maxSize?: number // Maximum cache size (optional)
}

/**
 * Default cache configurations
 */
export const cacheConfigs = {
  profile: {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 1000
  },
  session: {
    ttl: 10 * 60 * 1000, // 10 minutes
    maxSize: 5000
  },
  permission: {
    ttl: 15 * 60 * 1000, // 15 minutes
    maxSize: 500
  }
}

/**
 * Get item from cache
 */
export function getCached<T>(
  key: string,
  namespace: string = 'default'
): T | null {
  const cacheKey = `${namespace}:${key}`
  const entry = cacheStore.get(cacheKey)
  
  if (!entry) {
    return null
  }
  
  const now = Date.now()
  
  // Check if expired
  if (now > entry.expiresAt) {
    cacheStore.delete(cacheKey)
    return null
  }
  
  return entry.data as T
}

/**
 * Set item in cache
 */
export function setCached<T>(
  key: string,
  data: T,
  namespace: string = 'default',
  config: CacheConfig = cacheConfigs.profile
): void {
  const cacheKey = `${namespace}:${key}`
  const now = Date.now()
  
  const entry: CacheEntry<T> = {
    data,
    timestamp: now,
    expiresAt: now + config.ttl
  }
  
  cacheStore.set(cacheKey, entry)
  
  // Check cache size limit
  if (config.maxSize && cacheStore.size > config.maxSize) {
    evictOldestEntries(Math.floor(config.maxSize * 0.1)) // Evict 10% oldest
  }
}

/**
 * Delete item from cache
 */
export function deleteCached(
  key: string,
  namespace: string = 'default'
): boolean {
  const cacheKey = `${namespace}:${key}`
  return cacheStore.delete(cacheKey)
}

/**
 * Clear all items in a namespace
 */
export function clearNamespace(namespace: string): number {
  let cleared = 0
  const prefix = `${namespace}:`
  
  for (const key of cacheStore.keys()) {
    if (key.startsWith(prefix)) {
      cacheStore.delete(key)
      cleared++
    }
  }
  
  return cleared
}

/**
 * Clear all cache
 */
export function clearAllCache(): void {
  cacheStore.clear()
}

/**
 * Evict oldest entries
 */
function evictOldestEntries(count: number): number {
  const entries = Array.from(cacheStore.entries())
    .sort((a, b) => a[1].timestamp - b[1].timestamp)
  
  let evicted = 0
  for (let i = 0; i < Math.min(count, entries.length); i++) {
    cacheStore.delete(entries[i][0])
    evicted++
  }
  
  return evicted
}

/**
 * Clean up expired entries
 */
export function cleanupExpiredCache(): number {
  const now = Date.now()
  let cleaned = 0
  
  for (const [key, entry] of cacheStore.entries()) {
    if (now > entry.expiresAt) {
      cacheStore.delete(key)
      cleaned++
    }
  }
  
  return cleaned
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  size: number
  namespaces: Record<string, number>
  oldestEntry: number | null
  newestEntry: number | null
} {
  const namespaces: Record<string, number> = {}
  let oldestTimestamp: number | null = null
  let newestTimestamp: number | null = null
  
  for (const [key, entry] of cacheStore.entries()) {
    const namespace = key.split(':')[0]
    namespaces[namespace] = (namespaces[namespace] || 0) + 1
    
    if (!oldestTimestamp || entry.timestamp < oldestTimestamp) {
      oldestTimestamp = entry.timestamp
    }
    if (!newestTimestamp || entry.timestamp > newestTimestamp) {
      newestTimestamp = entry.timestamp
    }
  }
  
  return {
    size: cacheStore.size,
    namespaces,
    oldestEntry: oldestTimestamp,
    newestEntry: newestTimestamp
  }
}

/**
 * Cache wrapper for async functions
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  namespace: string = 'default',
  config: CacheConfig = cacheConfigs.profile
): Promise<T> {
  // Try to get from cache
  const cached = getCached<T>(key, namespace)
  if (cached !== null) {
    return cached
  }
  
  // Fetch fresh data
  const data = await fetcher()
  
  // Store in cache
  setCached(key, data, namespace, config)
  
  return data
}

// Cleanup task - run every 2 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const cleaned = cleanupExpiredCache()
    if (cleaned > 0) {
      console.log(`[Cache] Cleaned up ${cleaned} expired entries`)
    }
  }, 2 * 60 * 1000)
}
