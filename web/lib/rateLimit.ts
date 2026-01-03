/**
 * Rate Limiting Module
 * 
 * @deprecated This file is deprecated. Use '@/lib/auth/rateLimit' instead.
 * All rate limiting logic has been consolidated into the auth module for SOLID compliance.
 * 
 * Migration:
 * - `checkRateLimit(req)` → `checkRateLimit(getRateLimitIdentifier(req), rateLimitConfigs.api)`
 * - For new code, consider using `checkTokenBucketRateLimit` for smoother API traffic shaping
 */

export { 
  checkRateLimit,
  resetRateLimit,
  cleanupRateLimits,
  getRateLimitStatus,
  getRateLimitIdentifier,
  getAllRateLimits,
  clearAllRateLimits,
  rateLimitConfigs,
  checkTokenBucketRateLimit,
  resetTokenBucketRateLimit,
  cleanupTokenBuckets,
  type RateLimitConfig,
  type TokenBucketConfig,
  type TokenBucketResult
} from '@/lib/auth/rateLimit'

/**
 * Legacy compatibility: Simple rate limit check for API routes
 * @deprecated Use checkRateLimit from '@/lib/auth/rateLimit' directly
 */
import { 
  checkRateLimit as authCheckRateLimit,
  getRateLimitIdentifier,
  rateLimitConfigs 
} from '@/lib/auth/rateLimit'

export function checkRateLimitLegacy(req: Request): boolean {
  const identifier = getRateLimitIdentifier(req)
  const result = authCheckRateLimit(identifier, rateLimitConfigs.api)
  return !result.allowed
}
