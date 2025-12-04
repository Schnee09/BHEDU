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
 * In-memory rate limit store
 * In production, consider using Redis for distributed systems
 */
const rateLimitStore = new Map<string, RateLimitEntry>()

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  maxAttempts: number // Maximum attempts allowed
  windowMs: number // Time window in milliseconds
  blockDurationMs: number // How long to block after max attempts
}

/**
 * Default rate limit configurations
 */
export const rateLimitConfigs = {
  auth: {
    maxAttempts: 10, // 10 attempts
    windowMs: 60 * 1000, // Per minute
    blockDurationMs: 15 * 60 * 1000 // Block for 15 minutes
  },
  authStrict: {
    maxAttempts: 5, // 5 attempts
    windowMs: 60 * 1000, // Per minute
    blockDurationMs: 30 * 60 * 1000 // Block for 30 minutes
  },
  api: {
    maxAttempts: 100, // 100 requests
    windowMs: 60 * 1000, // Per minute
    blockDurationMs: 5 * 60 * 1000 // Block for 5 minutes
  }
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
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const cleaned = cleanupRateLimits()
    if (cleaned > 0) {
      console.log(`[RateLimit] Cleaned up ${cleaned} expired entries`)
    }
  }, 5 * 60 * 1000)
}
