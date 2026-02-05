/**
 * API Versioning
 *
 * Provides consistent API version identification across all responses.
 *
 * Headers added to all API responses:
 * - X-API-Version: Current API version (semver)
 * - X-API-Deprecated: Warning if using deprecated API
 */

// Current API version - update this when making breaking changes
export const API_VERSION = "2.0.0";

// Minimum supported version for clients
export const API_MIN_VERSION = "1.0.0";

// Deprecation notices for specific endpoints/features
export const DEPRECATED_FEATURES: Record<string, string> = {
    // Example: '/api/v1/students': 'Use /api/v2/students instead. Will be removed in v3.0.0'
};

/**
 * Standard API version headers
 */
export function getVersionHeaders(path?: string): Record<string, string> {
    const headers: Record<string, string> = {
        "X-API-Version": API_VERSION,
    };

    // Check for deprecated features
    if (path && DEPRECATED_FEATURES[path]) {
        headers["X-API-Deprecated"] = DEPRECATED_FEATURES[path];
    }

    return headers;
}

/**
 * Add version headers to a Response
 */
export function withVersionHeaders(
    response: Response,
    path?: string,
): Response {
    const headers = getVersionHeaders(path);

    // Clone response and add headers
    const newHeaders = new Headers(response.headers);
    Object.entries(headers).forEach(([key, value]) => {
        newHeaders.set(key, value);
    });

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
    });
}
