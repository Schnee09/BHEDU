/**
 * @jest-environment node
 */

import { checkTokenBucketRateLimit } from '@/lib/auth/rateLimit'

describe('checkTokenBucketRateLimit', () => {
  it('allows up to capacity then returns 429-like result', () => {
    const id = `test:${Date.now()}`
    const cfg = { capacity: 2, refillPerSecond: 0 }

    const r1 = checkTokenBucketRateLimit(id, cfg)
    expect(r1.allowed).toBe(true)

    const r2 = checkTokenBucketRateLimit(id, cfg)
    expect(r2.allowed).toBe(true)

    const r3 = checkTokenBucketRateLimit(id, cfg)
    expect(r3.allowed).toBe(false)
    expect(r3.retryAfterSeconds).toBeGreaterThan(0)
  })

  it('refills over time', () => {
    const id = `test-refill:${Date.now()}`
    const cfg = { capacity: 1, refillPerSecond: 10 }

    // consume token
    expect(checkTokenBucketRateLimit(id, cfg).allowed).toBe(true)

    // immediately should be blocked
    expect(checkTokenBucketRateLimit(id, cfg).allowed).toBe(false)

    // simulate time passage by waiting a little via fake timers
    jest.useFakeTimers()
    jest.advanceTimersByTime(200)

    // After advancing timers, Date.now() doesn't move automatically in Jest unless we set it.
    // So we set system time to ensure refill math sees time elapsed.
    const base = Date.now()
    jest.setSystemTime(base + 300)

    expect(checkTokenBucketRateLimit(id, cfg).allowed).toBe(true)

    jest.useRealTimers()
  })
})
