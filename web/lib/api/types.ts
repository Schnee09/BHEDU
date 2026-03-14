/**
 * Standard API Response Types
 *
 * Use these interfaces to strongly type the data returned by `useFetch`
 * and API route handlers across the application.
 */

// Base shape of any successful API response wrapped by apiHandler
export interface ApiResponse<T = unknown> {
    success: true;
    data: T;
    message?: string;
    count?: number;
    [key: string]: any; // Allow for flattened keys like `students: [...]`
}

// Shape of a paginated array response
export interface ApiPaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
}

// Standard Error Response
export interface ApiErrorResponse {
    success: false;
    error: string;
    statusCode?: number;
}
