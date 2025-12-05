/**
 * Current User API
 * GET /api/auth/me - Get current authenticated user
 * Updated: 2025-12-05
 */

import { NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { handleApiError, AuthenticationError } from '@/lib/api/errors'
import { logger } from '@/lib/logger'

export async function GET(request: Request) {
  try {
    const supabase = createClientFromRequest(request)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new AuthenticationError('Not authenticated')
    }

    // Get profile info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (profileError) {
      logger.error('Error fetching profile:', profileError)
      throw new Error(`Failed to fetch profile: ${profileError.message}`)
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        ...profile
      }
    })
  } catch (error) {
    return handleApiError(error)
  }
}
