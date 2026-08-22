/**
 * Custom error classes for API handlers
 */

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Permission denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

// Alias for AuthorizationError
export const ForbiddenError = AuthorizationError;

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT');
  }
}

/**
 * Handle errors and return appropriate Response
 */
export function handleApiError(error: unknown): Response {
  // Only log non-AppErrors or 500s to avoid pollution
  if (!(error instanceof AppError) || error.statusCode >= 500) {
    console.error('API Error:', error);
  }

  if (error instanceof AppError) {
    return Response.json(
      {
        success: false,
        error: error.message,
        code: error.code,
      },
      { status: error.statusCode }
    );
  }

  // Handle Zod validation errors
  if (error && typeof error === 'object' && 'issues' in error) {
    const issues = (error as { issues: Array<{ path?: Array<string | number>; message: string }> }).issues;
    const firstIssue = issues?.[0];
    const fieldPath = firstIssue?.path?.join('.');
    const message = fieldPath ? `${fieldPath}: ${firstIssue?.message}` : (firstIssue?.message || 'Validation failed');
    return Response.json(
      {
        success: false,
        error: message,
        issues,
      },
      { status: 400 }
    );
  }

  // Generic error fallback
  return Response.json(
    {
      success: false,
      error: 'Internal server error',
    },
    { status: 500 }
  );
}
