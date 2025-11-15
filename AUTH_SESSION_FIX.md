# Auth Session Fix - Deployment Guide

## Problem Summary
Your debug endpoint shows:
```json
{
  "authenticated": false,
  "authError": "Auth session missing!",
  "hasAuthorizationHeader": false,
  "hasCookieHeader": false
}
```

## Root Cause
The client-side login flow was using `@supabase/supabase-js` which stores sessions in **localStorage**, while the server middleware and API routes use `@supabase/ssr` which looks for **httpOnly cookies**. These two storage mechanisms don't sync automatically in Next.js 16.

## What I Fixed

### 1. Migrated Browser Client to @supabase/ssr
- **File**: `web/lib/supabaseClient.ts`
- **Change**: Now uses `createBrowserClient` from `@supabase/ssr` instead of `createClient` from `@supabase/supabase-js`
- **Impact**: Login now stores session in cookies that the server can read

### 2. Consolidated Client Instances
- **File**: `web/lib/supabase/browser.ts`
- **Change**: Already updated to use the singleton from `supabaseClient.ts`
- **Impact**: No more duplicate GoTrueClient warnings

## Testing Steps

### Local Testing
1. **Clear browser storage first**:
   ```javascript
   // In browser console:
   localStorage.clear()
   document.cookie.split(";").forEach(c => {
     document.cookie = c.trim().split("=")[0] + "=;expires=Thu, 01 Jan 1970 00:00:00 UTC"
   })
   ```

2. **Login again** at http://localhost:3000/login
   - Use: admin@example.com / password123 (or your test credentials)

3. **Check cookies** (DevTools → Application → Cookies):
   - Should see: `sb-<project>-auth-token` cookie
   - Should be **HttpOnly**: Yes

4. **Test debug endpoint**: http://localhost:3000/api/debug/auth
   ```json
   {
     "authenticated": true,
     "user": {...},
     "debug": {
       "hasCookieHeader": true,
       "hasSupabaseCookies": true
     }
   }
   ```

### Production Deployment
After pushing this fix:

1. **Users must logout/login again** (old localStorage sessions won't work)
2. **Or** add a migration script to copy localStorage → cookies on first load

## Verifying the Fix

### ✅ Success Indicators
- Login sets `sb-*-auth-token` **cookies** (not just localStorage)
- `/api/debug/auth` returns `authenticated: true`
- Dashboard pages load without 401 errors
- No "Multiple GoTrueClient" warnings

### ❌ Still Broken?
If cookies still don't appear:

1. **Check middleware.ts** is running:
   - Add console.log to middleware
   - Should run on every request

2. **Check Supabase project settings**:
   - Dashboard → Authentication → Settings
   - Ensure "Enable email confirmations" matches your setup
   - Check "Site URL" and "Redirect URLs" include your deployment domain

3. **Verify environment variables** (Vercel):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Must be set in both Production and Preview

## Migration Note for Existing Users

If you have users with active sessions stored in localStorage, they'll be logged out after this deploy. To migrate them smoothly, add this to your root layout:

```typescript
// web/app/layout.tsx - add to useEffect
useEffect(() => {
  const migrateAuth = async () => {
    const oldSession = localStorage.getItem(`sb-${projectRef}-auth-token`)
    if (oldSession) {
      try {
        const parsed = JSON.parse(oldSession)
        // Let new @supabase/ssr client re-establish with cookies
        await supabase.auth.setSession({
          access_token: parsed.access_token,
          refresh_token: parsed.refresh_token
        })
        localStorage.removeItem(`sb-${projectRef}-auth-token`)
      } catch (e) {
        console.error('Migration failed:', e)
      }
    }
  }
  migrateAuth()
}, [])
```

## Next Steps
1. ✅ Push this commit
2. ✅ Deploy to Vercel
3. ✅ Test login flow in production
4. ✅ Verify `/api/debug/auth` shows authenticated
5. ⚠️ Notify users they may need to re-login once
