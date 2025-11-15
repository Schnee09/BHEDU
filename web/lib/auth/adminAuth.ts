/**
 * Admin Authentication Utility
 * Verifies that the current user is an admin
 */

import { createClient, createClientFromRequest, createClientFromToken } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

export interface AuthResult {
  authorized: boolean
  userId?: string
  userEmail?: string
  userRole?: string
  reason?: string
}

/**
 * Check if the current user is authenticated and has admin role
 * @param request - Optional NextRequest for API routes
 */
export async function adminAuth(request?: NextRequest | Request): Promise<AuthResult> {
  try {
    // Use request-based client if request is provided (API routes)
    // Otherwise use cookies-based client (server components)
    let supabase = request 
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
        return {
          authorized: false,
          reason: authError?.message || 'Not authenticated'
        }
      }
    }

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return {
        authorized: false,
        reason: `Profile query error: ${profileError.message}`
      }
    }

    if (!profile) {
      return {
        authorized: false,
        reason: 'Profile not found'
      }
    }

    if (profile.role !== 'admin') {
      return {
        authorized: false,
        userId: user.id,
        userEmail: user.email,
        userRole: profile.role,
        reason: 'Insufficient permissions (admin required)'
      }
    }

    return {
      authorized: true,
      userId: user.id,
      userEmail: user.email,
      userRole: profile.role
    }

  } catch (error) {
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
        return {
          authorized: false,
          reason: 'Not authenticated'
        }
      }
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return {
        authorized: false,
        reason: 'Profile not found'
      }
    }

    if (profile.role !== 'teacher' && profile.role !== 'admin') {
      return {
        authorized: false,
        userId: user.id,
        userEmail: user.email,
        userRole: profile.role,
        reason: 'Insufficient permissions (teacher or admin required)'
      }
    }

    return {
      authorized: true,
      userId: user.id,
      userEmail: user.email,
      userRole: profile.role
    }

  } catch (error) {
    return {
      authorized: false,
      reason: error instanceof Error ? error.message : 'Authentication error'
    }
  }
}
