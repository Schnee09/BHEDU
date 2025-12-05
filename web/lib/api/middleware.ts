/**
 * API middleware utilities for Next.js Route Handlers
 */

import { createClientFromRequest } from '@/lib/supabase/server';
import { AuthenticationError, AuthorizationError, handleApiError } from './errors';
import type { NextRequest } from 'next/server';

export type RouteHandler = (
  request: NextRequest,
  context?: { params?: Promise<Record<string, string>> }
) => Promise<Response>;

export type AuthenticatedHandler = (
  request: NextRequest,
  context: {
    params?: Promise<Record<string, string>>;
    userId: string;
    userEmail: string;
  }
) => Promise<Response>;

/**
 * Wrap any route handler with error handling
 * This ensures all errors are caught and returned as proper responses
 */
export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/**
 * Require authentication for a route handler
 */
export function withAuth(handler: AuthenticatedHandler): RouteHandler {
  return async (request, context) => {
    try {
      const supabase = createClientFromRequest(request);
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        throw new AuthenticationError('Authentication required');
      }

      // Pass user info to handler
      return handler(request, {
        ...context,
        userId: user.id,
        userEmail: user.email || '',
      });
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/**
 * Require admin role for a route handler
 */
export function withAdmin(handler: AuthenticatedHandler): RouteHandler {
  return withAuth(async (request, context) => {
    try {
      const supabase = createClientFromRequest(request);
      
      // Check if user has admin role via RLS helper
      const { data, error } = await supabase.rpc('is_admin', {
        uid: context.userId,
      });

      if (error) {
        console.error('Admin check failed:', error);
        throw new AuthorizationError('Unable to verify admin status');
      }

      if (!data) {
        throw new AuthorizationError('Admin access required');
      }

      return handler(request, context);
    } catch (error) {
      return handleApiError(error);
    }
  });
}

/**
 * Require teacher role for a route handler
 */
export function withTeacher(handler: AuthenticatedHandler): RouteHandler {
  return withAuth(async (request, context) => {
    try {
      const supabase = createClientFromRequest(request);
      
      // Check if user has teacher role via RLS helper
      const { data, error } = await supabase.rpc('is_teacher', {
        uid: context.userId,
      });

      if (error) {
        console.error('Teacher check failed:', error);
        throw new AuthorizationError('Unable to verify teacher status');
      }

      if (!data) {
        throw new AuthorizationError('Teacher access required');
      }

      return handler(request, context);
    } catch (error) {
      return handleApiError(error);
    }
  });
}

/**
 * Parse and validate JSON body
 */
export async function parseBody<T = unknown>(request: NextRequest): Promise<T> {
  try {
    return await request.json();
  } catch {
    throw new Error('Invalid JSON body');
  }
}

/**
 * Get query parameter with optional default
 */
export function getQueryParam(
  request: NextRequest,
  key: string,
  defaultValue?: string
): string | undefined {
  const { searchParams } = new URL(request.url);
  return searchParams.get(key) || defaultValue;
}

/**
 * Get pagination params from query string
 */
export function getPaginationParams(request: NextRequest) {
  const page = parseInt(getQueryParam(request, 'page', '1') || '1', 10);
  const pageSize = parseInt(getQueryParam(request, 'pageSize', '20') || '20', 10);
  
  return {
    page: Math.max(1, page),
    pageSize: Math.min(Math.max(1, pageSize), 100), // Cap at 100
    offset: (Math.max(1, page) - 1) * Math.min(Math.max(1, pageSize), 100),
  };
}
