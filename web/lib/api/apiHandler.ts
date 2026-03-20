/**
 * API Handler Factory
 *
 * Standardizes API route handling with:
 * - Automatic authentication & authorization
 * - Zod schema validation
 * - Consistent error handling
 * - Type-safe request context
 *
 * @example
 * // Before: 50 lines of boilerplate
 * // After: 15 lines
 * export const PUT = createApiHandler({
 *   permission: 'classes.manage',
 *   bodySchema: updateClassSchema,
 * }, async ({ body, params, user }) => {
 *   const updated = await ClassService.updateClass(params.id, body);
 *   return NextResponse.json({ success: true, class: updated });
 * });
 */

import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema } from 'zod';
import { getAuthContext } from '@/lib/auth/guard';
import { UserRole } from '@/lib/auth/core';
import { AuthenticationError, AuthorizationError, handleApiError, ValidationError } from './errors';
import { API_VERSION, withVersionHeaders } from './apiVersion';
import { logger, logRequest, logResponse } from '@/lib/logger';

// Types
export interface ApiUser {
  id: string;
  role: UserRole;
  email: string;
  full_name?: string;
}

export interface ApiContext<TBody = unknown, TParams = Record<string, string>> {
  request: NextRequest;
  body: TBody;
  params: TParams;
  user: ApiUser;
  searchParams: URLSearchParams;
}

export interface HandlerConfig<TBody = unknown> {
  /** Permission required (e.g., 'classes.manage') */
  permission?: string;
  /** Zod schema for body validation */
  bodySchema?: ZodSchema<TBody>;
  /** Set to false to allow unauthenticated access */
  requireAuth?: boolean;
  /** Custom role check (alternative to permission) */
  allowedRoles?: UserRole[];
}

type RouteParams = { params: Promise<Record<string, string>> };

/**
 * Creates a standardized API handler with auth, validation, and error handling
 */
export function createApiHandler<TBody = unknown>(
  config: HandlerConfig<TBody>,
  handler: (ctx: ApiContext<TBody>) => Promise<Response>
) {
  return async (request: NextRequest, routeContext?: RouteParams) => {
    const startTime = Date.now();
    let user: ApiUser | null = null;

    try {
      // Log incoming request
      logRequest(request.method, request.nextUrl.pathname);

      // 1. Authentication & Authorization
      if (config.requireAuth !== false) {
        const auth = await getAuthContext(request, config.permission as any);

        if (!auth.authorized || !auth.profile) {
          throw new AuthenticationError('Vui lòng đăng nhập để tiếp tục');
        }

        // Check allowed roles if specified
        if (config.allowedRoles && auth.role) {
          if (!config.allowedRoles.includes(auth.role as any)) {
            throw new AuthorizationError('Bạn không có quyền thực hiện thao tác này');
          }
        }

        user = {
          id: auth.profile.id,
          role: auth.role as ApiUser['role'],
          email: auth.profile.email,
          full_name: auth.profile.full_name,
        };
      }

      // 2. Parse & Validate Body (for POST, PUT, PATCH)
      let body = {} as TBody;
      if (config.bodySchema) {
        try {
          const rawBody = await request.json();
          const result = config.bodySchema.safeParse(rawBody);

          if (!result.success) {
            const firstError = result.error.issues[0];
            if (!firstError) {
              throw new ValidationError('Dữ liệu gửi lên không hợp lệ');
            }
            const fieldName = firstError.path.join('.');
            const message = fieldName ? `${fieldName}: ${firstError.message}` : firstError.message;
            throw new ValidationError(message);
          }

          body = result.data;
        } catch (e) {
          if (e instanceof ValidationError) throw e;
          // JSON parse error
          throw new ValidationError('Dữ liệu gửi lên không hợp lệ');
        }
      }

      // 3. Resolve route params
      const params = routeContext?.params ? await routeContext.params : {};

      // 4. Build context and execute handler
      const ctx: ApiContext<TBody> = {
        request,
        body,
        params,
        user: user as ApiUser,
        searchParams: request.nextUrl.searchParams,
      };

      const response = await handler(ctx);
      const duration = Date.now() - startTime;

      // Log response (info for 2xx, warn for 4xx, error for 5xx)
      logResponse(request.method, request.nextUrl.pathname, response.status, duration, {
        userId: user?.id,
        role: user?.role,
      });

      return withVersionHeaders(response, request.nextUrl.pathname);
    } catch (error) {
      const duration = Date.now() - startTime;
      const response = handleApiError(error);

      // Log error response
      logResponse(request.method, request.nextUrl.pathname, response.status, duration, {
        userId: user?.id,
        error: error instanceof Error ? error.message : String(error),
      });

      return withVersionHeaders(response, request.nextUrl.pathname);
    }
  };
}

/**
 * Helper for GET handlers that don't need body parsing
 */
export function createGetHandler<TParams = Record<string, string>>(
  config: Omit<HandlerConfig, 'bodySchema'>,
  handler: (ctx: Omit<ApiContext<never, TParams>, 'body'>) => Promise<Response>
) {
  return createApiHandler<never>(config, handler as any);
}

/**
 * Standardized success response
 * Provides 'data' root key but also merges object keys for legacy compatibility
 */
export function apiSuccess<T>(data: T, meta?: Record<string, unknown>) {
  const response: Record<string, any> = {
    success: true,
    data,
    ...meta,
  };

  // Compatibility: Merge keys if data is an object and not an array
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    Object.assign(response, data);
  }

  return NextResponse.json(response, {
    headers: { 'X-API-Version': API_VERSION },
  });
}

/**
 * Standardized paginated response
 */
export function apiPaginated<T>(
  data: T[],
  pagination: { page: number; pageSize: number; total: number },
  meta?: Record<string, unknown>
) {
  const response: Record<string, any> = {
    success: true,
    data,
    pagination: {
      ...pagination,
      totalPages: Math.ceil(pagination.total / pagination.pageSize),
    },
    ...meta,
  };

  // Compatibility: Try to infer a plural key from the request if possible
  // Or callers can provide it in meta. For now, 'data' is the primary source.

  return NextResponse.json(response, {
    headers: { 'X-API-Version': API_VERSION },
  });
}
