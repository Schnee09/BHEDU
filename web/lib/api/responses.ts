/**
 * Standardized API response helpers for Next.js Route Handlers
 */

import { ApiResponse, ApiErrorResponse, ApiPaginatedResponse } from './types';

/**
 * Success response with data
 */
export function success<T>(data: T, message?: string): Response {
  const body: ApiResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
  };
  return Response.json(body, { status: 200 });
}

/**
 * Created response (201)
 */
export function created<T>(data: T, message?: string): Response {
  const body: ApiResponse<T> = {
    success: true,
    data,
    message: message || 'Resource created successfully',
  };
  return Response.json(body, { status: 201 });
}

/**
 * No content response (204)
 */
export function noContent(): Response {
  return new Response(null, { status: 204 });
}

/**
 * Bad request error (400)
 */
export function badRequest(error: string): Response {
  const body: ApiErrorResponse = {
    success: false,
    error,
  };
  return Response.json(body, { status: 400 });
}

/**
 * Unauthorized error (401)
 */
export function unauthorized(error: string = 'Unauthorized'): Response {
  const body: ApiErrorResponse = {
    success: false,
    error,
  };
  return Response.json(body, { status: 401 });
}

/**
 * Forbidden error (403)
 */
export function forbidden(error: string = 'Forbidden'): Response {
  const body: ApiErrorResponse = {
    success: false,
    error,
  };
  return Response.json(body, { status: 403 });
}

/**
 * Not found error (404)
 */
export function notFound(error: string = 'Resource not found'): Response {
  const body: ApiErrorResponse = {
    success: false,
    error,
  };
  return Response.json(body, { status: 404 });
}

/**
 * Conflict error (409)
 */
export function conflict(error: string): Response {
  const body: ApiErrorResponse = {
    success: false,
    error,
  };
  return Response.json(body, { status: 409 });
}

/**
 * Internal server error (500)
 */
export function serverError(error: string = 'Internal server error'): Response {
  const body: ApiErrorResponse = {
    success: false,
    error,
  };
  return Response.json(body, { status: 500 });
}

/**
 * Paginated success response
 */
export function paginated<T>(
  data: T[],
  page: number,
  pageSize: number,
  totalItems: number
): Response {
  const body: ApiPaginatedResponse<T> = {
    success: true,
    data,
    pagination: {
      page,
      pageSize,
      total: totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
    },
  };
  return Response.json(body, { status: 200 });
}
