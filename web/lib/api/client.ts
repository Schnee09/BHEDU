/**
 * API client utilities for making authenticated requests
 */

/**
 * Fetch wrapper that:
 * - Includes credentials for same-origin cookie auth
 * - Attaches Supabase access token (Authorization: Bearer) when available
 */
export async function apiFetch(url: string, options?: RequestInit) {
  const baseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> | undefined),
  }
  let authorizationHeader: string | undefined

  // In the browser, try to attach the current Supabase access token
  if (typeof window !== 'undefined') {
    try {
      const { getAccessToken } = await import('@/lib/supabase/browser')
      const token = await getAccessToken()
      if (token && !('Authorization' in baseHeaders)) {
        authorizationHeader = `Bearer ${token}`
      }
    } catch {
      // no-op if browser client isn't available
    }
  }

  return fetch(url, {
    ...options,
    credentials: 'same-origin',
    headers: authorizationHeader
      ? { ...baseHeaders, Authorization: authorizationHeader }
      : baseHeaders,
  })
}
