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
import { UserRole, isAtLeast } from '@/lib/auth/core';
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

function inferPermissionFromPath(method: string, urlStr: string): string | undefined {
  try {
    const url = new URL(urlStr);
    const path = url.pathname;
    const m = method.toUpperCase();

    // /api/admin/classes/...
    if (path.startsWith('/api/admin/classes')) {
      return m === 'GET' ? 'classes.view' : 'classes.manage';
    }
    // /api/admin/grades/...
    if (path.startsWith('/api/admin/grades')) {
      return m === 'GET' ? 'grades.view' : 'grades.manage';
    }
    // /api/admin/attendance/...
    if (path.startsWith('/api/admin/attendance')) {
      return m === 'GET' ? 'attendance.view' : 'attendance.manage';
    }
    // /api/admin/courses/...
    if (path.startsWith('/api/admin/courses')) {
      return m === 'GET' ? 'curriculum.view' : 'curriculum.manage';
    }
    // /api/admin/settings/...
    if (path.startsWith('/api/admin/settings')) {
      return 'system.settings';
    }
    // /api/admin/invitations/...
    if (path.startsWith('/api/admin/invitations')) {
      return 'users.invite';
    }
    // /api/admin/announcements/...
    if (path.startsWith('/api/admin/announcements')) {
      return 'announcements.manage';
    }
    // /api/subjects/...
    if (path.startsWith('/api/subjects')) {
      return m === 'GET' ? 'subjects.view' : 'subjects.manage';
    }
    // /api/students/...
    if (path.startsWith('/api/students')) {
      if (m === 'GET') return 'students.view';
      if (m === 'POST') return 'students.create';
      if (m === 'PATCH' || m === 'PUT') return 'students.edit';
      if (m === 'DELETE') return 'students.delete';
    }
  } catch (e) {
    // Ignore URL parsing errors
  }
  return undefined;
}

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
        let permissionToCheck = config.permission;

        // Fallback: If permission is not set, try to infer it from URL path if route is restricted to admins
        if (!permissionToCheck && config.allowedRoles?.includes('admin')) {
          permissionToCheck = inferPermissionFromPath(request.method, request.url);
        }

        const auth = await getAuthContext(request, permissionToCheck as any);

        if (!auth.authorized || !auth.profile) {
          throw new AuthenticationError(auth.reason || 'Vui lòng đăng nhập để tiếp tục');
        }

        // Check allowed roles if specified (supports hierarchy and dynamic bypasses)
        if (config.allowedRoles && auth.role) {
          if (auth.role !== 'super_admin') {
            const hasAccess = config.allowedRoles.some((allowedRole) => {
              // Owner has access to admin operational routes if they possess the required permission
              if (allowedRole === 'admin' && auth.role === 'owner') return true;

              // Custom user overrides also bypass hardcoded admin checks
              if (allowedRole === 'admin' && auth.isCustomOverride) return true;

              return isAtLeast(auth.role as UserRole, allowedRole);
            });

            if (!hasAccess) {
              throw new AuthorizationError('Bạn không có quyền thực hiện thao tác này');
            }
          }
        }

        user = {
          id: auth.profile.id,
          role: auth.role as ApiUser['role'],
          email: auth.profile.email,
          full_name: auth.profile.full_name,
        };
      }

      // 2. Parse & Validate Body (for POST, PUT, PATCH, DELETE)
      let body = {} as TBody;
      const method = request.method.toUpperCase();
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        try {
          const rawBody = await request.clone().json();
          if (config.bodySchema) {
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
          } else {
            body = (rawBody ?? {}) as TBody;
          }
        } catch (e) {
          if (e instanceof ValidationError) throw e;
          // If bodySchema is explicitly provided, JSON parsing failure is a ValidationError
          if (config.bodySchema) {
            throw new ValidationError('Dữ liệu gửi lên không hợp lệ');
          }
          // Otherwise leave body as empty object
          body = {} as TBody;
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
