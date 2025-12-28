// @ts-nocheck
/**
 * API Response Utilities
 * Consistent response formatting with caching headers and compression support
 */

import { NextResponse } from 'next/server';

interface SuccessResponseOptions {
  data: unknown;
  status?: number;
  cacheSeconds?: number;
  staleSeconds?: number;
}

interface ErrorResponseOptions {
  error: string;
  status?: number;
  details?: unknown;
}

/**
 * Create a successful JSON response with optional caching
 */
export function successResponse({
  data,
  status = 200,
  cacheSeconds = 0,
  staleSeconds = 60,
}: SuccessResponseOptions): NextResponse {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (cacheSeconds > 0) {
    headers['Cache-Control'] = `public, max-age=${cacheSeconds}, stale-while-revalidate=${staleSeconds}`;
  } else {
    headers['Cache-Control'] = 'no-store, no-cache, must-revalidate';
  }

  return new NextResponse(JSON.stringify(data), {
    status,
    headers,
  });
}

/**
 * Create an error JSON response
 */
export function errorResponse({
  error,
  status = 500,
  details,
}: ErrorResponseOptions): NextResponse {
  return new NextResponse(
    JSON.stringify({
      success: false,
      error,
      ...(details && { details }),
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    }
  );
}

/**
 * Standard cache durations
 */
export const CACHE = {
  NONE: 0,
  SHORT: 30, // 30 seconds
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  STATIC: 86400, // 24 hours
} as const;

/**
 * Add CORS headers for public APIs
 */
export function corsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

/**
 * Pagination helper
 */
export interface PaginationParams {
  page: number;
  limit: number;
  total: number;
}

export function createPaginationMeta(params: PaginationParams) {
  const { page, limit, total } = params;
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}
