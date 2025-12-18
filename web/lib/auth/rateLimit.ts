/**
 * Rate Limiting for Authentication
 * Protects against brute-force attacks
 */

interface RateLimitEntry {
  count: number
  resetTime: number
  blocked: boolean
  blockUntil?: number
}

/**
 * Token bucket rate limiting entry.
 * This is better suited for API request shaping than the auth/bruteforce limiter above.
 */
interface TokenBucketEntry {
  tokens: number
  lastRefillMs: number
}

/**
 * In-memory rate limit store
 * In production, consider using Redis for distributed systems
 */
const rateLimitStore = new Map<string, RateLimitEntry>()

// Separate store for token bucket rate limiting
const tokenBucketStore = new Map<string, TokenBucketEntry>()

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  maxAttempts: number // Maximum attempts allowed
  windowMs: number // Time window in milliseconds
  blockDurationMs: number // How long to block after max attempts
}

/**
 * Token bucket config.
 * - `capacity`: maximum burst size
 * - `refillPerSecond`: steady-state rate
 */
export interface TokenBucketConfig {
  capacity: number
  refillPerSecond: number
}

export interface TokenBucketResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

/**
 * Default rate limit configurations
 */
export const rateLimitConfigs = {
  auth: {
    maxAttempts: 30, // 30 attempts (increased from 10)
    windowMs: 60 * 1000, // Per minute
    blockDurationMs: 15 * 60 * 1000 // Block for 15 minutes
  },
  authStrict: {
    maxAttempts: 20, // 20 attempts (increased from 5)
    windowMs: 60 * 1000, // Per minute
    blockDurationMs: 30 * 60 * 1000 // Block for 30 minutes
  },
  api: {
    maxAttempts: 300, // 300 requests (increased from 100)
    windowMs: 60 * 1000, // Per minute
    blockDurationMs: 5 * 60 * 1000 // Block for 5 minutes
  },
  bulk: {
    maxAttempts: 150, // 150 requests for bulk operations (increased from 50)
    windowMs: 60 * 1000, // Per minute
    blockDurationMs: 2 * 60 * 1000 // Block for 2 minutes
  },

  // Token bucket configs (recommended for APIs)
  apiBucket: {
    capacity: 60, // allow short bursts
    refillPerSecond: 2 // ~120/min steady state
  } satisfies TokenBucketConfig,

  dataViewerBucket: {
    capacity: 20,
    refillPerSecond: 1 // ~60/min steady state
  } satisfies TokenBucketConfig
}

/**
 * Token bucket rate limit check.
 *
 * Notes:
 * - No multi-minute "blocking" period; it simply returns 429 until enough tokens refill.
 * - Intended for API traffic shaping (better UX than hard blocks).
 */
export function checkTokenBucketRateLimit(
  identifier: string,
  config: TokenBucketConfig
): TokenBucketResult {
  const now = Date.now()
  const entry = tokenBucketStore.get(identifier)

  if (!entry) {
    const tokensLeft = Math.max(0, config.capacity - 1)
    tokenBucketStore.set(identifier, { tokens: tokensLeft, lastRefillMs: now })
    return { allowed: true, remaining: tokensLeft, retryAfterSeconds: 0 }
  }

  const elapsedSeconds = Math.max(0, (now - entry.lastRefillMs) / 1000)
  const refill = elapsedSeconds * config.refillPerSecond
  const newTokens = Math.min(config.capacity, entry.tokens + refill)

  // Rebase timer to now (keeps refill stable and prevents float growth)
  entry.tokens = newTokens
  entry.lastRefillMs = now

  if (entry.tokens >= 1) {
    entry.tokens -= 1
    tokenBucketStore.set(identifier, entry)
    return { allowed: true, remaining: Math.floor(entry.tokens), retryAfterSeconds: 0 }
  }

  // Need at least 1 token
  const deficit = 1 - entry.tokens
  const retryAfterSeconds = config.refillPerSecond > 0 ? Math.ceil(deficit / config.refillPerSecond) : 60
  tokenBucketStore.set(identifier, entry)
  return { allowed: false, remaining: 0, retryAfterSeconds }
}

export function resetTokenBucketRateLimit(identifier: string): void {
  tokenBucketStore.delete(identifier)
}

/**
 * Get identifier from request (IP address or user identifier)
 */
export function getRateLimitIdentifier(request: Request, userId?: string): string {
  // Prefer user ID if authenticated
  if (userId) {
    return `user:${userId}`
  }
  
  // Fall back to IP address
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIp || 'unknown'
  
  return `ip:${ip}`
}

/**
 * Check if request is rate limited
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = rateLimitConfigs.auth
): {
  allowed: boolean
  remaining: number
  resetTime: number
  blocked: boolean
  blockUntil?: number
} {
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)
  
  // Check if currently blocked
  if (entry?.blocked && entry.blockUntil && now < entry.blockUntil) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      blocked: true,
      blockUntil: entry.blockUntil
    }
  }
  
  // If no entry or window expired, create new entry
  if (!entry || now > entry.resetTime) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + config.windowMs,
      blocked: false
    }
    rateLimitStore.set(identifier, newEntry)
    
    return {
      allowed: true,
      remaining: config.maxAttempts - 1,
      resetTime: newEntry.resetTime,
      blocked: false
    }
  }
  
  // Increment attempt count
  entry.count++
  
  // Check if exceeded max attempts
  if (entry.count > config.maxAttempts) {
    entry.blocked = true
    entry.blockUntil = now + config.blockDurationMs
    rateLimitStore.set(identifier, entry)
    
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      blocked: true,
      blockUntil: entry.blockUntil
    }
  }
  
  rateLimitStore.set(identifier, entry)
  
  return {
    allowed: true,
    remaining: config.maxAttempts - entry.count,
    resetTime: entry.resetTime,
    blocked: false
  }
}

/**
 * Reset rate limit for an identifier
 */
export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier)
}

/**
 * Clear expired entries (cleanup task)
 */
export function cleanupRateLimits(): number {
  const now = Date.now()
  let cleaned = 0
  
  for (const [identifier, entry] of rateLimitStore.entries()) {
    // Remove if window expired and not blocked, or block expired
    if (now > entry.resetTime && (!entry.blocked || (entry.blockUntil && now > entry.blockUntil))) {
      rateLimitStore.delete(identifier)
      cleaned++
    }
  }
  
  return cleaned
}

export function cleanupTokenBuckets(maxIdleMs: number = 10 * 60 * 1000): number {
  const now = Date.now()
  let cleaned = 0
  for (const [identifier, entry] of tokenBucketStore.entries()) {
    if (now - entry.lastRefillMs > maxIdleMs) {
      tokenBucketStore.delete(identifier)
      cleaned++
    }
  }
  return cleaned
}

/**
 * Get current rate limit status without incrementing
 */
export function getRateLimitStatus(
  identifier: string,
  config: RateLimitConfig = rateLimitConfigs.auth
): {
  attempts: number
  remaining: number
  resetTime: number
  blocked: boolean
  blockUntil?: number
} {
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)
  
  if (!entry || now > entry.resetTime) {
    return {
      attempts: 0,
      remaining: config.maxAttempts,
      resetTime: now + config.windowMs,
      blocked: false
    }
  }
  
  return {
    attempts: entry.count,
    remaining: Math.max(0, config.maxAttempts - entry.count),
    resetTime: entry.resetTime,
    blocked: entry.blocked,
    blockUntil: entry.blockUntil
  }
}

/**
 * Get all rate limit entries (for monitoring)
 */
export function getAllRateLimits(): Map<string, RateLimitEntry> {
  return new Map(rateLimitStore)
}

/**
 * Clear all rate limits (use with caution)
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear()
}

// Cleanup task - run every 5 minutes
if (typeof setInterval !== 'undefined' && process.env.NODE_ENV !== 'test') {
  setInterval(() => {
    const cleaned = cleanupRateLimits()
    const cleanedBuckets = cleanupTokenBuckets()
    if (cleaned > 0) {
      console.log(`[RateLimit] Cleaned up ${cleaned} expired entries`)
    }
    if (cleanedBuckets > 0) {
      console.log(`[RateLimit] Cleaned up ${cleanedBuckets} idle token buckets`)
    }
  }, 5 * 60 * 1000)
}
