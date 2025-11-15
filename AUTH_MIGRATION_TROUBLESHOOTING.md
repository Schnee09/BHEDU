# 🔥 Auth Migration Troubleshooting

## Current Issue: 400 Token Refresh Errors

### Symptoms
```
mwncwhkdimnjovxzhtjm.supabase.co/auth/v1/token?grant_type=password:1  
Failed to load resource: the server responded with a status of 400 ()
```
- Multiple 400 errors on token refresh
- `/api/classes/my-classes` returns 500 error
- Frontend TypeError: "Cannot read properties of undefined (reading '0')"

### Root Cause
You have **old localStorage-based auth tokens** that are incompatible with the new cookie-based auth system. When the app tries to refresh these old tokens, Supabase returns 400 errors.

### Solution: Clear Old Session & Re-login

#### Option 1: Use the Cleanup Tool (Easiest) ✅
1. Navigate to: **`https://your-app.vercel.app/clear-old-auth.html`**
2. Click "Clear All Auth Data & Reload"
3. You'll be redirected to `/login`
4. Login with your credentials
5. ✅ Fresh cookie-based session established!

#### Option 2: Manual Browser Cleanup
1. Open browser DevTools (F12)
2. Go to **Application/Storage** tab
3. Clear:
   - **Local Storage** → Delete all items
   - **Session Storage** → Delete all items  
   - **Cookies** → Delete all cookies for your domain
4. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
5. Navigate to `/login` and login again

#### Option 3: Incognito/Private Window
1. Open an incognito/private browser window
2. Navigate to your app
3. Login fresh
4. ✅ Cookie-based session works immediately!

---

## What Changed in the Migration?

### Before (Old - localStorage)
```typescript
// @supabase/supabase-js
createClient(url, key) 
// ↓
// Stores session in localStorage
// ✗ Server can't read localStorage
// ✗ Token refresh uses localStorage tokens
```

### After (New - Cookies)
```typescript
// @supabase/ssr
createBrowserClient(url, key)
// ↓
// Stores session in httpOnly cookies
// ✓ Server reads cookies automatically
// ✓ Token refresh uses cookie-based tokens
```

---

## Verification After Re-login

### 1. Check Auth Debug Endpoint
```bash
# Should return authenticated: true with cookies
curl https://your-app.vercel.app/api/debug/auth
```

**Expected Response:**
```json
{
  "authenticated": true,
  "userId": "uuid...",
  "userEmail": "user@example.com",
  "userRole": "admin",
  "debug": {
    "hasCookieHeader": true,
    "hasAuthorizationHeader": false,
    "hasSupabaseCookies": true
  }
}
```

### 2. Test API Endpoints
After fresh login, these should work:
- ✅ `/api/admin/users` - User management
- ✅ `/api/classes/my-classes` - Teacher classes
- ✅ `/api/admin/finance/student-accounts` - Finance
- ✅ `/api/attendance/reports` - Attendance
- ✅ `/api/grades` - Grades

### 3. Check Browser DevTools
**Application Tab → Cookies:**
Should see cookies like:
- `sb-mwncwhkdimnjovxzhtjm-auth-token`
- `sb-mwncwhkdimnjovxzhtjm-auth-token.0`
- `sb-mwncwhkdimnjovxzhtjm-auth-token.1`

**Application Tab → Local Storage:**
Should be EMPTY (or minimal non-auth data)

---

## Why Not Automatic Migration?

**Question:** Why can't the app automatically migrate localStorage to cookies?

**Answer:** Security and data integrity reasons:
1. **Different token formats** - localStorage tokens use different encryption/signing
2. **httpOnly cookies** - Browser JavaScript can't set httpOnly cookies (server-only)
3. **Security boundary** - Mixing old/new tokens creates security vulnerabilities
4. **Clean break** - Forced re-login ensures valid sessions for all users

---

## For Other Users

When deploying to production, you should:

### 1. Add Migration Notice
Create a banner/modal on the app:
```tsx
"We've upgraded our authentication system. 
Please logout and login again if you experience any issues."
```

### 2. Force Logout on First Load
```typescript
// In middleware or app layout
const hasOldAuth = localStorage.getItem('supabase.auth.token')
if (hasOldAuth) {
  // Clear old auth
  localStorage.clear()
  // Redirect to login
  router.push('/login?message=session-expired')
}
```

### 3. Update Documentation
- Email users about the change
- Update login instructions
- Link to AUTH_SESSION_FIX.md

---

## Common Errors After Migration

| Error | Cause | Solution |
|-------|-------|----------|
| 400 token refresh | Old localStorage tokens | Clear storage & re-login |
| 401 Unauthorized | No valid session | Re-login |
| 500 API errors | Auth middleware failing | Check server logs, re-login |
| `Cannot read property '0'` | Frontend expecting data that's null | Backend auth issue, re-login |

---

## Need Help?

1. **Check deployment logs** - Vercel dashboard → Deployments → Functions
2. **Check browser console** - Look for auth-related errors
3. **Test auth endpoint** - `/api/debug/auth` should show authenticated status
4. **Use cleanup tool** - `/clear-old-auth.html` for clean slate

---

## Files Changed in Migration

See `AUTH_SESSION_FIX.md` and `SCHEMA_FIX_SUMMARY.md` for complete change history.

**Key commits:**
- Cookie auth migration: Commit with "BREAKING CHANGE: migrate to @supabase/ssr"
- Schema fixes: Commits ce94ea5 and 6bd1842
- Cleanup tool: Commit 05cac73
