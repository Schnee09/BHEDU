/**
 * Admin Authentication Utility
 * Verifies that the current user is an admin
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export interface AuthResult {
  authorized: boolean
  userId?: string
  userEmail?: string
  userRole?: string
  reason?: string
}

/**
 * Check if the current user is authenticated and has admin role
 */
export async function adminAuth(req: NextRequest): Promise<AuthResult> {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        authorized: false,
        reason: 'Not authenticated'
      }
    }

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return {
        authorized: false,
        reason: 'Profile not found'
      }
    }

    if (profile.role !== 'admin') {
      return {
        authorized: false,
        userId: user.id,
        userEmail: profile.email,
        userRole: profile.role,
        reason: 'Insufficient permissions (admin required)'
      }
    }

    return {
      authorized: true,
      userId: user.id,
      userEmail: profile.email,
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
export async function teacherAuth(req: NextRequest): Promise<AuthResult> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        authorized: false,
        reason: 'Not authenticated'
      }
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, role')
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
        userEmail: profile.email,
        userRole: profile.role,
        reason: 'Insufficient permissions (teacher or admin required)'
      }
    }

    return {
      authorized: true,
      userId: user.id,
      userEmail: profile.email,
      userRole: profile.role
    }

  } catch (error) {
    return {
      authorized: false,
      reason: error instanceof Error ? error.message : 'Authentication error'
    }
  }
}
