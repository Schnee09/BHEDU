import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Get user role to redirect appropriately
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Check if user has a profile, create one if not (for new Google users)
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single()

        if (!existingProfile) {
          // Create a new profile for Google OAuth users
          await supabase.from('profiles').insert({
            user_id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
            role: 'student', // Default role for new users
          })
        }

        // Redirect based on role
        const role = existingProfile?.role || user.user_metadata?.role || 'student'
        
        if (role === 'admin' || role === 'staff') {
          return NextResponse.redirect(`${origin}/dashboard`)
        } else if (role === 'teacher') {
          return NextResponse.redirect(`${origin}/dashboard/classes`)
        }
      }
      
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  // Auth error, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
