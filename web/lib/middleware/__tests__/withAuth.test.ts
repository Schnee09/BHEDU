/**
 * Unit Tests for API Middleware
 * 
 * Tests middleware composition and behavior.
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  withMiddleware, 
  withRateLimit, 
  withAuth,
  type Handler,
  type MiddlewareContext
} from '../withAuth'

// Mock the auth modules
jest.mock('@/lib/auth/adminAuth', () => ({
  adminAuth: jest.fn(),
  staffAuth: jest.fn(),
  teacherAuth: jest.fn()
}))

jest.mock('@/lib/auth/rateLimit', () => ({
  checkRateLimit: jest.fn(),
  getRateLimitIdentifier: jest.fn(() => 'test-ip'),
  rateLimitConfigs: {
    api: { maxAttempts: 100, windowMs: 60000, blockDurationMs: 300000 },
    authStrict: { maxAttempts: 5, windowMs: 60000, blockDurationMs: 1800000 }
  }
}))

jest.mock('@/lib/auth/auditLog', () => ({
  logAuditEvent: jest.fn()
}))

import { teacherAuth } from '@/lib/auth/adminAuth'
import { checkRateLimit } from '@/lib/auth/rateLimit'

describe('API Middleware', () => {
  let mockRequest: NextRequest

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockRequest = new NextRequest('http://localhost:3000/api/test', {
      method: 'GET',
      headers: {
        'x-forwarded-for': '127.0.0.1'
      }
    })
  })

  describe('withMiddleware', () => {
    it('should call handler with context', async () => {
      const handler: Handler = jest.fn(async (_, ctx) => {
        return NextResponse.json({ userId: ctx.userId })
      })

      ;(checkRateLimit as jest.Mock).mockReturnValue({
        allowed: true,
        remaining: 99,
        resetTime: Date.now() + 60000
      })

      const wrappedHandler = withMiddleware(
        withRateLimit(),
        handler
      )

      const response = await wrappedHandler(mockRequest)

      expect(handler).toHaveBeenCalled()
      expect(response.status).toBe(200)
    })

    it('should catch and handle errors', async () => {
      const errorHandler: Handler = jest.fn(async () => {
        throw new Error('Test error')
      })

      ;(checkRateLimit as jest.Mock).mockReturnValue({
        allowed: true,
        remaining: 99,
        resetTime: Date.now() + 60000
      })

      const wrappedHandler = withMiddleware(
        withRateLimit(),
        errorHandler
      )

      const response = await wrappedHandler(mockRequest)

      expect(response.status).toBe(500)
      const body = await response.json()
      expect(body.error).toBe('Internal Server Error')
    })
  })

  describe('withRateLimit', () => {
    it('should allow requests under limit', async () => {
      ;(checkRateLimit as jest.Mock).mockReturnValue({
        allowed: true,
        remaining: 99,
        resetTime: Date.now() + 60000
      })

      const handler: Handler = jest.fn(async () => NextResponse.json({ ok: true }))
      const wrapped = withMiddleware(withRateLimit(), handler)

      const response = await wrapped(mockRequest)

      expect(response.status).toBe(200)
      expect(handler).toHaveBeenCalled()
    })

    it('should block requests over limit', async () => {
      const blockUntil = Date.now() + 300000

      ;(checkRateLimit as jest.Mock).mockReturnValue({
        allowed: false,
        remaining: 0,
        resetTime: Date.now(),
        blocked: true,
        blockUntil
      })

      const handler: Handler = jest.fn(async () => NextResponse.json({ ok: true }))
      const wrapped = withMiddleware(withRateLimit(), handler)

      const response = await wrapped(mockRequest)

      expect(response.status).toBe(429)
      expect(handler).not.toHaveBeenCalled()
      
      const body = await response.json()
      expect(body.error).toBe('Too Many Requests')
    })
  })

  describe('withAuth', () => {
    it('should allow authenticated users', async () => {
      ;(teacherAuth as jest.Mock).mockResolvedValue({
        authorized: true,
        userId: 'user-123',
        userRole: 'teacher',
        profileId: 'profile-123'
      })

      const handler: Handler = jest.fn(async (_, ctx) => {
        return NextResponse.json({ userId: ctx.userId, role: ctx.userRole })
      })

      const wrapped = withMiddleware(withAuth(), handler)
      const response = await wrapped(mockRequest)

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.userId).toBe('user-123')
      expect(body.role).toBe('teacher')
    })

    it('should reject unauthenticated users', async () => {
      ;(teacherAuth as jest.Mock).mockResolvedValue({
        authorized: false,
        reason: 'Unauthorized'
      })

      const handler: Handler = jest.fn()
      const wrapped = withMiddleware(withAuth(), handler)

      const response = await wrapped(mockRequest)

      expect(response.status).toBe(401)
      expect(handler).not.toHaveBeenCalled()
    })

    it('should reject users without required role', async () => {
      ;(teacherAuth as jest.Mock).mockResolvedValue({
        authorized: true,
        userId: 'user-123',
        userRole: 'student',
        profileId: 'profile-123'
      })

      const handler: Handler = jest.fn()
      const wrapped = withMiddleware(withAuth(['admin', 'staff']), handler)

      const response = await wrapped(mockRequest)

      expect(response.status).toBe(403)
      expect(handler).not.toHaveBeenCalled()

      const body = await response.json()
      expect(body.message).toContain('admin, staff')
    })
  })

  describe('middleware composition', () => {
    it('should apply middlewares in correct order', async () => {
      const order: string[] = []

      ;(checkRateLimit as jest.Mock).mockImplementation(() => {
        order.push('rateLimit')
        return { allowed: true, remaining: 99, resetTime: Date.now() + 60000 }
      })

      ;(teacherAuth as jest.Mock).mockImplementation(async () => {
        order.push('auth')
        return { authorized: true, userId: 'user-1', userRole: 'admin' }
      })

      const handler: Handler = jest.fn(async () => {
        order.push('handler')
        return NextResponse.json({ ok: true })
      })

      const wrapped = withMiddleware(
        withRateLimit(),
        withAuth(),
        handler
      )

      await wrapped(mockRequest)

      // Rate limit should be checked before auth
      expect(order).toEqual(['rateLimit', 'auth', 'handler'])
    })
  })
})
