/**
 * Auth Debug & Fix Guide
 * 
 * PROBLEM: {"authenticated":false,"authError":"Auth session missing!","hasAuthorizationHeader":false}
 * 
 * ROOT CAUSE: Client login uses @supabase/supabase-js but server uses @supabase/ssr.
 * These don't share the same cookie/storage mechanism properly in Next.js 16.
 * 
 * SOLUTION: Migrate client auth to use @supabase/ssr createBrowserClient consistently.
 */

// ===== WHAT'S HAPPENING =====
// 1. Login page calls supabase.auth.signInWithPassword() from supabaseClient.ts
// 2. That client stores session in localStorage (default for @supabase/supabase-js)
// 3. Server middleware/components use @supabase/ssr which looks for httpOnly cookies
// 4. Cookies never get set because the browser client doesn't manage them properly
// 5. API routes get no cookies, no Authorization header → 401

// ===== DIAGNOSIS STEPS =====
console.log(`
=== Auth Debug Checklist ===

1. Open browser DevTools → Application → Local Storage
   - Look for: sb-<project-ref>-auth-token
   - If present: client has a session locally but server can't see it

2. Open browser DevTools → Application → Cookies
   - Look for: sb-<project-ref>-auth-token, sb-<project-ref>-auth-token-code-verifier
   - If MISSING: server won't see the session

3. Try login and immediately check:
   - Network tab → any request → Cookies header
   - Should contain Supabase session cookies

4. Hit /api/debug/auth after login:
   - If authenticated:false → cookies not reaching server
   - If hasAuthorizationHeader:false → apiFetch not attaching token

=== Expected Flow (Fixed) ===
1. Login with @supabase/ssr createBrowserClient
2. Client stores session in cookies (not localStorage)
3. Cookies are httpOnly and sent with every request
4. Server reads cookies via @supabase/ssr
5. API routes see session automatically

=== Files to Update ===
1. web/lib/supabaseClient.ts → migrate to @supabase/ssr
2. web/app/login/page.tsx → ensure using SSR client
3. web/components/AuthGuard.tsx → use SSR client
4. web/hooks/useProfile.ts → use SSR client
`)

export {}
