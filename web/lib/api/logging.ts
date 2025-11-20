/**
 * API Logging Middleware
 * Provides request/response logging for debugging and monitoring
 */

import type { NextRequest } from 'next/server';

export interface LogContext {
  requestId: string;
  method: string;
  url: string;
  userAgent?: string;
  ip?: string;
  userId?: string;
  startTime: number;
}

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Log request details
 */
export function logRequest(request: NextRequest, userId?: string): LogContext {
  const requestId = generateRequestId();
  const startTime = Date.now();

  const context: LogContext = {
    requestId,
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent') || undefined,
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    userId,
    startTime,
  };

  console.log('[API Request]', {
    requestId,
    method: context.method,
    url: context.url,
    userId: context.userId,
    userAgent: context.userAgent,
  });

  return context;
}

/**
 * Log response details
 */
export function logResponse(
  context: LogContext,
  status: number,
  error?: string
): void {
  const duration = Date.now() - context.startTime;

  const logData = {
    requestId: context.requestId,
    method: context.method,
    url: context.url,
    status,
    duration: `${duration}ms`,
    userId: context.userId,
    ...(error && { error }),
  };

  if (status >= 500) {
    console.error('[API Error]', logData);
  } else if (status >= 400) {
    console.warn('[API Warning]', logData);
  } else {
    console.log('[API Response]', logData);
  }
}

/**
 * Middleware wrapper that adds logging
 */
export function withLogging<T extends (...args: any[]) => Promise<Response>>(
  handler: T
): T {
  return (async (request: NextRequest, ...rest: any[]) => {
    const context = logRequest(request);

    try {
      const response = await handler(request, ...rest);
      logResponse(context, response.status);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logResponse(context, 500, errorMessage);
      throw error;
    }
  }) as T;
}

/**
 * Combine middleware functions
 */
export function combineMiddleware<T extends (...args: any[]) => Promise<Response>>(
  ...middlewares: Array<(handler: T) => T>
): (handler: T) => T {
  return (handler: T) => {
    return middlewares.reduceRight(
      (wrapped, middleware) => middleware(wrapped),
      handler
    );
  };
}
