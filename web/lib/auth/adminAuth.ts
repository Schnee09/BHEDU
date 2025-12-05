/**
 * Admin Authentication Utility
 * Verifies that the current user is an admin
 */

import { createClient, createClientFromRequest, createClientFromToken } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'
import { getCached, setCached, cacheConfigs } from './cache'
import { checkRateLimit, getRateLimitIdentifier, rateLimitConfigs } from './rateLimit'
import { logAuthAttempt, logRateLimitEvent } from './auditLog'
import { hasPermission, type Resource, type Action } from './permissions'

export interface AuthResult {
  authorized: boolean
  userId?: string
  userEmail?: string
  userRole?: string
  reason?: string
  rateLimited?: boolean
}

export type { Resource, Action } from './permissions'

/**
 * Check if the current user is authenticated and has admin role
 * @param request - Optional NextRequest for API routes
 */
export async function adminAuth(request?: NextRequest | Request): Promise<AuthResult> {
  try {
    // Rate limiting check
    if (request) {
      const identifier = getRateLimitIdentifier(request)
      const rateLimit = checkRateLimit(identifier, rateLimitConfigs.auth)
      
      if (!rateLimit.allowed) {
        logRateLimitEvent({
          type: rateLimit.blocked ? 'blocked' : 'exceeded',
          identifier,
          attempts: rateLimit.remaining,
          request
        })
        
        return {
          authorized: false,
          reason: rateLimit.blocked 
            ? `Rate limit exceeded. Blocked until ${new Date(rateLimit.blockUntil!).toISOString()}`
            : 'Too many authentication attempts',
          rateLimited: true
        }
      }
    }

    // Use request-based client if request is provided (API routes)
    // Otherwise use cookies-based client (server components)
    const supabase = request 
      ? createClientFromRequest(request)
      : await createClient()

    // Get current user
    let { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      // Fallback: try Authorization header (Bearer token)
      const token = request ? request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') : undefined
      if (token) {
        const tokenClient = createClientFromToken(token)
        const result = await tokenClient.auth.getUser()
        user = result.data.user
        authError = result.error
      }

      if (authError || !user) {
        // Log failed auth attempt
        logAuthAttempt({
          success: false,
          reason: authError?.message || 'Not authenticated',
          request
        })
        
        return {
          authorized: false,
          reason: authError?.message || 'Not authenticated'
        }
      }
    }

    // Try to get profile from cache
    const cacheKey = `profile:${user.id}`
    let profile = getCached<{ id: string; full_name?: string; role: string }>(cacheKey, 'auth')

    if (!profile) {
      // Get user profile to check role
      const { data: fetchedProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('user_id', user.id)
        .maybeSingle()

      if (profileError) {
        logAuthAttempt({
          success: false,
          userId: user.id,
          userEmail: user.email,
          reason: `Profile query error: ${profileError.message}`,
          request
        })
        
        return {
          authorized: false,
          reason: `Profile query error: ${profileError.message}`
        }
      }

      if (!fetchedProfile) {
        logAuthAttempt({
          success: false,
          userId: user.id,
          userEmail: user.email,
          reason: 'Profile not found',
          request
        })
        
        return {
          authorized: false,
          reason: 'Profile not found'
        }
      }

      profile = fetchedProfile
      
      // Cache the profile
      setCached(cacheKey, profile, 'auth', cacheConfigs.profile)
    }

    if (profile.role !== 'admin') {
      logAuthAttempt({
        success: false,
        userId: profile.id,
        userEmail: user.email,
        userRole: profile.role,
        reason: 'Insufficient permissions (admin required)',
        request
      })
      
      return {
        authorized: false,
        userId: profile.id,
        userEmail: user.email,
        userRole: profile.role,
        reason: 'Insufficient permissions (admin required)'
      }
    }

    // Log successful auth
    logAuthAttempt({
      success: true,
      userId: profile.id,
      userEmail: user.email,
      userRole: profile.role,
      request
    })

    return {
      authorized: true,
      userId: profile.id,
      userEmail: user.email,
      userRole: profile.role
    }

  } catch (error) {
    logAuthAttempt({
      success: false,
      reason: error instanceof Error ? error.message : 'Authentication error',
      request
    })
    
    return {
      authorized: false,
      reason: error instanceof Error ? error.message : 'Authentication error'
    }
  }
}

/**
 * Check if the current user is authenticated and has teacher or admin role
 */
export async function teacherAuth(request?: NextRequest | Request): Promise<AuthResult> {
  try {
    // Rate limiting check
    if (request) {
      const identifier = getRateLimitIdentifier(request)
      const rateLimit = checkRateLimit(identifier, rateLimitConfigs.auth)
      
      if (!rateLimit.allowed) {
        logRateLimitEvent({
          type: rateLimit.blocked ? 'blocked' : 'exceeded',
          identifier,
          attempts: rateLimit.remaining,
          request
        })
        
        return {
          authorized: false,
          reason: rateLimit.blocked 
            ? `Rate limit exceeded. Blocked until ${new Date(rateLimit.blockUntil!).toISOString()}`
            : 'Too many authentication attempts',
          rateLimited: true
        }
      }
    }

    const supabase = request ? createClientFromRequest(request) : await createClient()

    let { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      // Fallback to Authorization header (Bearer token)
      const token = request ? request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') : undefined
      if (token) {
        const tokenClient = createClientFromToken(token)
        const result = await tokenClient.auth.getUser()
        user = result.data.user
        authError = result.error
      }
      if (authError || !user) {
        logAuthAttempt({
          success: false,
          reason: 'Not authenticated',
          request
        })
        
        return {
          authorized: false,
          reason: 'Not authenticated'
        }
      }
    }

    // Try to get profile from cache
    const cacheKey = `profile:${user.id}`
    let profile = getCached<{ id: string; role: string }>(cacheKey, 'auth')

    if (!profile) {
      const { data: fetchedProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('user_id', user.id)
        .maybeSingle()

      if (profileError || !fetchedProfile) {
        logAuthAttempt({
          success: false,
          userId: user.id,
          userEmail: user.email,
          reason: profileError ? `Profile query error: ${profileError.message}` : 'Profile not found',
          request
        })
        
        return {
          authorized: false,
          reason: profileError ? `Profile query error: ${profileError.message}` : 'Profile not found'
        }
      }

      profile = fetchedProfile
      
      // Cache the profile
      setCached(cacheKey, profile, 'auth', cacheConfigs.profile)
    }

    if (profile.role !== 'teacher' && profile.role !== 'admin') {
      logAuthAttempt({
        success: false,
        userId: profile.id,
        userEmail: user.email,
        userRole: profile.role,
        reason: 'Insufficient permissions (teacher or admin required)',
        request
      })
      
      return {
        authorized: false,
        userId: profile.id,
        userEmail: user.email,
        userRole: profile.role,
        reason: 'Insufficient permissions (teacher or admin required)'
      }
    }

    // Log successful auth
    logAuthAttempt({
      success: true,
      userId: profile.id,
      userEmail: user.email,
      userRole: profile.role,
      request
    })

    return {
      authorized: true,
      userId: profile.id,
      userEmail: user.email,
      userRole: profile.role
    }

  } catch (error) {
    logAuthAttempt({
      success: false,
      reason: error instanceof Error ? error.message : 'Authentication error',
      request
    })
    
    return {
      authorized: false,
      reason: error instanceof Error ? error.message : 'Authentication error'
    }
  }
}

/**
 * Check if user has permission for a resource and action
 * Uses the granular permission system
 */
export function checkPermission(
  userRole: string,
  resource: Resource,
  action: Action
): boolean {
  return hasPermission(userRole, resource, action)
}
