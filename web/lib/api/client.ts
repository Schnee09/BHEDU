/**
 * API client utilities for making authenticated requests
 */

/**
 * Fetch wrapper that automatically includes credentials
 * Use this for all API calls that require authentication
 */
export async function apiFetch(url: string, options?: RequestInit) {
  return fetch(url, {
    ...options,
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
}
