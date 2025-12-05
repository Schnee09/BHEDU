/**
 * Request validation utilities for API routes
 */

import { z, ZodSchema } from 'zod';
import { ValidationError } from './errors';
import type { NextRequest } from 'next/server';

/**
 * Parse and validate request body with Zod schema
 */
export async function validateBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<T> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new ValidationError(`Validation failed: ${messages}`);
    }
    if (error instanceof SyntaxError) {
      throw new ValidationError('Invalid JSON in request body');
    }
    throw error;
  }
}

/**
 * Validate query parameters with Zod schema
 */
export function validateQuery<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): T {
  try {
    const { searchParams } = new URL(request.url);
    const params: Record<string, string> = {};
    
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    return schema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new ValidationError(`Query validation failed: ${messages}`);
    }
    throw error;
  }
}

/**
 * Validate dynamic route parameters
 */
export async function validateParams<T>(
  params: Promise<Record<string, string>>,
  schema: ZodSchema<T>
): Promise<T> {
  try {
    const resolvedParams = await params;
    return schema.parse(resolvedParams);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new ValidationError(`Parameter validation failed: ${messages}`);
    }
    throw error;
  }
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
  // Pagination
  pagination: z.object({
    page: z.string().optional().default('1').transform(Number),
    limit: z.string().optional().default('25').transform(Number),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional().default('desc'),
  }),

  // ID parameter
  idParam: z.object({
    id: z.string().uuid('Invalid UUID format'),
  }),

  // Date range
  dateRange: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),

  // Search
  search: z.object({
    q: z.string().optional(),
    fields: z.string().optional().transform(s => s?.split(',')),
  }),
};

/**
 * Validate environment variables at startup
 */
export function validateEnv(required: string[]): void {
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env.local file.'
    );
  }
}

/**
 * Check for required environment variables in route handlers
 */
export function requireEnv(...keys: string[]): void {
  const missing = keys.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Server misconfigured: missing ${missing.join(', ')}`);
  }
}
