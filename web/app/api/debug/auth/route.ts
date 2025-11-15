/**
 * Debug endpoint to check current user authentication
 */

import { NextResponse } from 'next/server'
import { createClientFromRequest, createClientFromToken } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    // Check what cookies are being sent
    const cookieHeader = request.headers.get('cookie')
    const hasSbCookies = cookieHeader?.includes('sb-') || false
    
    const supabase = createClientFromRequest(request)

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      // Fallback to Authorization header
      const authz = request.headers.get('authorization')
      const token = authz?.replace(/^Bearer\s+/i, '')
      if (token) {
        const tokenClient = createClientFromToken(token)
        const result = await tokenClient.auth.getUser()
        if (result.data.user) {
          // Use token-based user for success response
          const tokenUser = result.data.user
          const { data: profile, error: profileError } = await tokenClient
            .from('profiles')
            .select('*')
            .eq('id', tokenUser.id)
            .single()

          return NextResponse.json({
            authenticated: true,
            user: {
              id: tokenUser.id,
              email: tokenUser.email,
              role: tokenUser.role
            },
            profile,
            profileError: profileError?.message,
            isAdmin: profile?.role === 'admin',
            debug: {
              hasCookieHeader: !!cookieHeader,
              hasSupabaseCookies: hasSbCookies,
              usedAuthorizationHeader: true
            }
          })
        }
      }
      return NextResponse.json({
        authenticated: false,
        error: 'Not authenticated',
        authError: authError?.message || 'Auth session missing!',
        debug: {
          hasCookieHeader: !!cookieHeader,
          hasSupabaseCookies: hasSbCookies,
          cookieHeaderLength: cookieHeader?.length || 0,
          hasAuthorizationHeader: !!authz
        }
      })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      profile: profile,
      profileError: profileError?.message,
      isAdmin: profile?.role === 'admin',
      debug: {
        hasCookieHeader: !!cookieHeader,
        hasSupabaseCookies: hasSbCookies
      }
    })

  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}