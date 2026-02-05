/**
 * Standard API Response Types
 * Aligned with BH-EDU v5.0 Architecture
 *
 * Uses discriminated unions for type-safe error handling
 */

/**
 * Standard API response wrapper
 * Uses discriminated union for type safety
 */
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

/**
 * Success response
 */
export interface ApiSuccess<T> {
    success: true;
    data: T;
    meta?: ResponseMeta;
}

/**
 * Error response
 */
export interface ApiError {
    success: false;
    error: ErrorDetail;
    meta?: ResponseMeta;
}

/**
 * Error detail with type discrimination
 * Allows frontend to handle specific error types
 */
export type ErrorDetail =
    | ValidationError
    | AuthenticationError
    | AuthorizationError
    | NotFoundError
    | ConflictError
    | RateLimitError
    | ServerError;

/**
 * Validation error (400)
 */
export interface ValidationError {
    type: "validation";
    message: string;
    fields: Record<string, string[]>;
}

/**
 * Authentication error (401)
 */
export interface AuthenticationError {
    type: "authentication";
    message: string;
    code:
        | "INVALID_CREDENTIALS"
        | "TOKEN_EXPIRED"
        | "NO_TOKEN"
        | "SESSION_INVALID";
}

/**
 * Authorization error (403)
 */
export interface AuthorizationError {
    type: "authorization";
    message: string;
    required?: string[]; // Required permissions/roles
    reason?: string; // Why access was denied
}

/**
 * Not found error (404)
 */
export interface NotFoundError {
    type: "not_found";
    message: string;
    resource: string;
    id?: string;
}

/**
 * Conflict error (409)
 */
export interface ConflictError {
    type: "conflict";
    message: string;
    conflictingField: string;
    existingValue?: any;
}

/**
 * Rate limit error (429)
 */
export interface RateLimitError {
    type: "rate_limit";
    message: string;
    retryAfter: number; // Seconds until retry allowed
    limit: number; // Request limit
    remaining: number; // Remaining requests
}

/**
 * Server error (500)
 */
export interface ServerError {
    type: "server";
    message: string;
    code?: string;
    requestId?: string;
    stack?: string; // Only in development
}

/**
 * Response metadata
 */
export interface ResponseMeta {
    timestamp: string;
    requestId?: string;
    pagination?: PaginationMeta;
    warnings?: string[];
    deprecation?: DeprecationWarning;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

/**
 * Deprecation warning
 */
export interface DeprecationWarning {
    message: string;
    deprecatedAt: string;
    removedAt?: string;
    replacement?: string;
}

/**
 * Type guards for response discrimination
 */

export function isSuccess<T>(
    response: ApiResponse<T>,
): response is ApiSuccess<T> {
    return response.success === true;
}

export function isError<T>(response: ApiResponse<T>): response is ApiError {
    return response.success === false;
}

export function isValidationError(
    error: ErrorDetail,
): error is ValidationError {
    return error.type === "validation";
}

export function isAuthenticationError(
    error: ErrorDetail,
): error is AuthenticationError {
    return error.type === "authentication";
}

export function isAuthorizationError(
    error: ErrorDetail,
): error is AuthorizationError {
    return error.type === "authorization";
}

export function isNotFoundError(error: ErrorDetail): error is NotFoundError {
    return error.type === "not_found";
}

export function isConflictError(error: ErrorDetail): error is ConflictError {
    return error.type === "conflict";
}

export function isRateLimitError(error: ErrorDetail): error is RateLimitError {
    return error.type === "rate_limit";
}

export function isServerError(error: ErrorDetail): error is ServerError {
    return error.type === "server";
}
