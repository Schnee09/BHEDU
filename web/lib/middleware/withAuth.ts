/**
 * API Middleware Composition
 * 
 * Composable middleware following Open/Closed Principle:
 * - Add new middleware without modifying existing handlers
 * - Chain middleware for consistent behavior across routes
 * 
 * Usage:
 * ```ts
 * export const GET = withMiddleware(
 *   withRateLimit(),
 *   withAuth(['admin', 'staff']),
 *   async (req, ctx) => {
 *     // Handler code
 *   }
 * )
 * ```
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  checkRateLimit, 
  getRateLimitIdentifier, 
  rateLimitConfigs,
  type RateLimitConfig 
} from '@/lib/auth/rateLimit'
import { adminAuth, teacherAuth, staffAuth } from '@/lib/auth/adminAuth'
import { logAuditEvent } from '@/lib/auth/auditLog'

// ============================================
// Types
// ============================================

export type Role = 'admin' | 'staff' | 'teacher' | 'student'

export interface MiddlewareContext {
  userId?: string
  userRole?: Role
  rateLimit?: {
    remaining: number
    resetTime: number
  }
}

export type Handler = (
  request: NextRequest,
  context: MiddlewareContext
) => Promise<NextResponse>

export type Middleware = (handler: Handler) => Handler

// ============================================
// Error Responses
// ============================================

const errorResponses = {
  unauthorized: () => 
    NextResponse.json(
      { error: 'Unauthorized', message: 'Authentication required' },
      { status: 401 }
    ),
  
  forbidden: (message = 'Access denied') => 
    NextResponse.json(
      { error: 'Forbidden', message },
      { status: 403 }
    ),
  
  rateLimited: (retryAfter: number) => 
    NextResponse.json(
      { error: 'Too Many Requests', message: 'Rate limit exceeded', retryAfter },
      { 
        status: 429,
        headers: { 'Retry-After': String(Math.ceil(retryAfter / 1000)) }
      }
    ),
  
  serverError: (message = 'Internal server error') => 
    NextResponse.json(
      { error: 'Internal Server Error', message },
      { status: 500 }
    )
}

// ============================================
// Rate Limiting Middleware
// ============================================

export function withRateLimit(config: RateLimitConfig = rateLimitConfigs.api): Middleware {
  return (handler: Handler) => async (request: NextRequest, context: MiddlewareContext) => {
    const identifier = getRateLimitIdentifier(request, context.userId)
    const result = checkRateLimit(identifier, config)

    if (!result.allowed) {
      const retryAfter = result.blockUntil 
        ? result.blockUntil - Date.now() 
        : config.windowMs

      return errorResponses.rateLimited(retryAfter)
    }

    // Add rate limit info to context
    context.rateLimit = {
      remaining: result.remaining,
      resetTime: result.resetTime
    }

    return handler(request, context)
  }
}

// ============================================
// Authentication Middlewares
// ============================================

/**
 * Require any authenticated user
 */
export function withAuth(roles?: Role[]): Middleware {
  return (handler: Handler) => async (request: NextRequest, context: MiddlewareContext) => {
    // Try most permissive auth first
    const auth = await teacherAuth(request)
    
    if (!auth.authorized) {
      return errorResponses.unauthorized()
    }

    context.userId = auth.userId!
    context.userRole = auth.userRole as Role

    // Check role restriction if specified
    if (roles && roles.length > 0 && !roles.includes(context.userRole)) {
      return errorResponses.forbidden(`Requires one of these roles: ${roles.join(', ')}`)
    }

    return handler(request, context)
  }
}

/**
 * Require admin role specifically
 */
export function withAdminAuth(): Middleware {
  return (handler: Handler) => async (request: NextRequest, context: MiddlewareContext) => {
    const auth = await adminAuth(request)
    
    if (!auth.authorized) {
      return auth.reason === 'Forbidden' 
        ? errorResponses.forbidden('Admin access required')
        : errorResponses.unauthorized()
    }

    context.userId = auth.userId!
    context.userRole = 'admin'

    return handler(request, context)
  }
}

/**
 * Require staff or admin role
 */
export function withStaffAuth(): Middleware {
  return (handler: Handler) => async (request: NextRequest, context: MiddlewareContext) => {
    const auth = await staffAuth(request)
    
    if (!auth.authorized) {
      return auth.reason === 'Forbidden'
        ? errorResponses.forbidden('Staff or admin access required')
        : errorResponses.unauthorized()
    }

    context.userId = auth.userId!
    context.userRole = auth.userRole as Role

    return handler(request, context)
  }
}

// ============================================
// Audit Logging Middleware
// ============================================

export function withAuditLog(action: string): Middleware {
  return (handler: Handler) => async (request: NextRequest, context: MiddlewareContext) => {
    const startTime = Date.now()
    
    try {
      const response = await handler(request, context)
      
      // Log successful action
      logAuditEvent({
        type: 'data.read',
        userId: context.userId,
        action,
        resource: request.nextUrl.pathname,
        success: true,
        metadata: {
          method: request.method,
          statusCode: response.status,
          durationMs: Date.now() - startTime
        },
        request: {
          ip: request.headers.get('x-forwarded-for')?.split(',')[0] || undefined,
          method: request.method,
          url: request.url
        }
      })
      
      return response
    } catch (error) {
      // Log failed action
      logAuditEvent({
        type: 'data.read',
        userId: context.userId,
        action,
        resource: request.nextUrl.pathname,
        success: false,
        reason: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          method: request.method,
          durationMs: Date.now() - startTime
        },
        request: {
          ip: request.headers.get('x-forwarded-for')?.split(',')[0] || undefined,
          method: request.method,
          url: request.url
        }
      })
      
      throw error
    }
  }
}

// ============================================
// Middleware Composition
// ============================================

/**
 * Compose multiple middlewares with a handler
 * Middlewares are applied in order (first is outermost)
 */
export function withMiddleware(...args: [...Middleware[], Handler]): (req: NextRequest) => Promise<NextResponse> {
  const handler = args.pop() as Handler
  const middlewares = args as Middleware[]

  // Apply middlewares in reverse order (last added wraps first)
  const composed = middlewares.reduceRight(
    (acc, middleware) => middleware(acc),
    handler
  )

  return async (request: NextRequest) => {
    try {
      const context: MiddlewareContext = {}
      return await composed(request, context)
    } catch (error) {
      console.error('[Middleware] Unhandled error:', error)
      return errorResponses.serverError(
        error instanceof Error ? error.message : 'An unexpected error occurred'
      )
    }
  }
}

// ============================================
// Convenience Exports
// ============================================

/**
 * Common middleware combinations
 */
export const middlewarePresets = {
  /** Public API with rate limiting only */
  public: () => [withRateLimit()],
  
  /** Authenticated API with rate limiting */
  authenticated: () => [withRateLimit(), withAuth()],
  
  /** Admin-only API with stricter rate limiting */
  adminOnly: () => [withRateLimit(rateLimitConfigs.authStrict), withAdminAuth()],
  
  /** Staff/Admin API */
  staffOnly: () => [withRateLimit(), withStaffAuth()],
  
  /** Sensitive operation with audit logging */
  sensitive: (action: string, roles?: Role[]) => [
    withRateLimit(rateLimitConfigs.authStrict),
    withAuth(roles),
    withAuditLog(action)
  ]
}
