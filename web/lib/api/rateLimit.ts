import { NextResponse } from 'next/server'
import {
  checkTokenBucketRateLimit,
  getRateLimitIdentifier,
  rateLimitConfigs,
  type TokenBucketConfig,
} from '@/lib/auth/rateLimit'

export type RateLimitedResponse = {
  response: NextResponse
}

/**
 * Apply a token-bucket rate limit.
 *
 * Returns `null` when allowed, otherwise returns a 429 response with `Retry-After`.
 *
 * IMPORTANT: This is best-effort in-memory limiting. In serverless/multi-instance,
 * you should move this to Redis/Upstash/etc for global enforcement.
 */
export function enforceRateLimit(
  request: Request,
  opts?: {
    bucketConfig?: TokenBucketConfig
    keyPrefix?: string
    userId?: string
  }
): RateLimitedResponse | null {
  const bucketConfig = opts?.bucketConfig ?? rateLimitConfigs.apiBucket
  const keyPrefix = opts?.keyPrefix ?? 'api'

  const baseIdentifier = getRateLimitIdentifier(request, opts?.userId)
  const identifier = `${keyPrefix}:${baseIdentifier}`

  const result = checkTokenBucketRateLimit(identifier, bucketConfig)
  if (result.allowed) return null

  const res = NextResponse.json(
    {
      error: 'Too Many Requests',
      retryAfterSeconds: result.retryAfterSeconds,
    },
    { status: 429 }
  )

  res.headers.set('Retry-After', String(result.retryAfterSeconds))
  res.headers.set('X-RateLimit-Remaining', '0')

  return { response: res }
}
