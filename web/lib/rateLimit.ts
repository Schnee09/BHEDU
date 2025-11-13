/**
 * Simple in-memory rate limiter for API routes
 * Production apps should use Redis or similar
 */

const hits = new Map<string, { count: number; reset: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX = 60 // 60 requests per minute per IP

function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() 
    || req.headers.get('x-real-ip') 
    || '127.0.0.1'
}

/**
 * Check if request exceeds rate limit
 * @returns true if rate limit exceeded, false if allowed
 */
export function checkRateLimit(req: Request): boolean {
  const ip = getClientIP(req)
  const now = Date.now()
  const key = `ratelimit:${ip}`
  
  const entry = hits.get(key)
  if (!entry || entry.reset <= now) {
    hits.set(key, { count: 1, reset: now + RATE_LIMIT_WINDOW })
    return false
  }
  
  if (entry.count >= RATE_LIMIT_MAX) return true
  entry.count += 1
  return false
}

// Cleanup old entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of hits.entries()) {
      if (entry.reset <= now) hits.delete(key)
    }
  }, RATE_LIMIT_WINDOW)
}

