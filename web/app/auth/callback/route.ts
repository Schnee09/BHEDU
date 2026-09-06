import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * OAuth Authentication Callback Handler (UIT / Enterprise Single Identity Architecture)
 *
 * Handles Google OAuth callback:
 * 1. Exchanges auth code for session.
 * 2. Matches user to existing profile by user_id OR email OR personal_email.
 * 3. Automatically links user_id if needed.
 * 4. Strictly avoids creating orphan/dummy student profiles for unregistered emails.
 * 5. Redirects to corresponding role portal.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  try {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('OAuth Exchange Error:', exchangeError);
      return NextResponse.redirect(`${origin}/login?error=oauth_exchange_failed`);
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return NextResponse.redirect(`${origin}/login?error=auth_failed`);
    }

    const serviceClient = createServiceClient();
    const normalizedEmail = user.email.toLowerCase().trim();

    // 1. Search for existing profile by user_id or email or personal_email
    const { data: profile, error: profileQueryError } = await serviceClient
      .from('profiles')
      .select('id, user_id, email, personal_email, role, is_active, photo_url, full_name')
      .or(
        `user_id.eq.${user.id},email.ilike.${normalizedEmail},personal_email.ilike.${normalizedEmail}`
      )
      .is('deleted_at', null)
      .maybeSingle();

    if (profileQueryError) {
      console.error('Profile query error during OAuth callback:', profileQueryError);
    }

    // 2. Case A: Profile Found
    if (profile) {
      if (profile.is_active === false) {
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/login?error=account_deactivated`);
      }

      // Link user_id if not yet linked or changed
      if (profile.user_id !== user.id) {
        await serviceClient
          .from('profiles')
          .update({
            user_id: user.id,
            photo_url: profile.photo_url || user.user_metadata?.avatar_url || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', profile.id);
      }

      // Redirect based on verified role
      const role = profile.role;
      if (role === 'parent') {
        return NextResponse.redirect(`${origin}/dashboard/parent`);
      } else if (role === 'teacher') {
        return NextResponse.redirect(`${origin}/dashboard/teacher/classes`);
      } else if (role === 'tutor') {
        return NextResponse.redirect(`${origin}/dashboard/tutor/students`);
      } else if (role === 'student') {
        return NextResponse.redirect(`${origin}/dashboard/grades`);
      } else {
        return NextResponse.redirect(`${origin}/dashboard`);
      }
    }

    // 3. Case B: Profile Not Found, but belongs to Center Domain (@bhedu.vn)
    if (normalizedEmail.endsWith('@bhedu.vn')) {
      const defaultRole = 'staff';
      await serviceClient.from('profiles').insert({
        user_id: user.id,
        email: normalizedEmail,
        full_name: user.user_metadata?.full_name || normalizedEmail.split('@')[0],
        role: defaultRole,
        photo_url: user.user_metadata?.avatar_url || null,
        is_active: true,
      });
      return NextResponse.redirect(`${origin}/dashboard`);
    }

    // 4. Case C: Unregistered external account (e.g. unknown @gmail.com)
    // UIT principle: Do NOT create orphan dummy profiles. Sign out and notify.
    await supabase.auth.signOut();
    return NextResponse.redirect(
      `${origin}/login?error=account_not_found&email=${encodeURIComponent(user.email)}`
    );
  } catch (err: any) {
    console.error('Fatal OAuth Callback Error:', err);
    return NextResponse.redirect(`${origin}/login?error=server_error`);
  }
}
