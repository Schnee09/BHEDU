# 🔐 Supabase Service Key Security Guide

## ⚠️ CRITICAL: Service Role Key Handling

The `SUPABASE_SERVICE_ROLE_KEY` bypasses ALL Row Level Security (RLS) policies and gives full database access. It must NEVER be exposed to the client browser.

---

## 🚨 Immediate Action Required

### 1. Remove from .env.local (if present)

Check `web/.env.local` and remove this line if it exists:
```bash
# ❌ REMOVE THIS LINE:
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Add to Platform Secrets

The service key should ONLY be stored in:
- **Vercel**: Project Settings → Environment Variables
- **Netlify**: Site Settings → Environment Variables
- **Docker/Self-hosted**: Server environment (not in code)
- **Local Development**: System environment or secure credential manager

---

## ✅ Correct Setup

### .env.local (Safe for Client)
```bash
# Client-side environment variables (safe to expose)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Platform Secrets (Server-Only)
```bash
# Server-side secrets (NEVER commit to git)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🔧 How to Add to Platform

### Vercel
1. Go to your project dashboard
2. Settings → Environment Variables
3. Add `SUPABASE_SERVICE_ROLE_KEY` with value
4. Select environments: Production, Preview, Development
5. Save and redeploy

### Netlify
1. Go to Site Settings
2. Build & Deploy → Environment
3. Add `SUPABASE_SERVICE_ROLE_KEY` variable
4. Save and redeploy

### Docker Compose
```yaml
services:
  app:
    environment:
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
```

Then use `.env` file (not committed):
```bash
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

---

## 🛡️ When to Use Service Role

Service role should ONLY be used for:

✅ **Allowed Use Cases**:
- Creating auth users (signup, admin user creation)
- Admin operations that require bypassing RLS
- Background jobs/cron tasks
- Data migration scripts

❌ **NEVER Use For**:
- Regular user queries (use anon key + RLS)
- Client-side operations
- Public API endpoints
- Any code that runs in the browser

---

## 📝 Code Examples

### ✅ Correct: Server-Side Only
```typescript
// app/api/admin/users/route.ts (Server-side API route)
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  // Only accessible server-side
  const supabase = createServiceClient()
  
  // Bypass RLS for admin operations
  const { data, error } = await supabase.auth.admin.createUser({ ... })
  
  return Response.json({ data, error })
}
```

### ❌ Wrong: Client-Side
```typescript
// ❌ NEVER DO THIS in client components
'use client'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ❌ This will be undefined or exposed!
)
```

---

## 🔍 How to Check for Exposure

### 1. Search Your Codebase
```bash
# Check for service key in client code
git grep -n "SUPABASE_SERVICE_ROLE_KEY" web/app web/components web/lib/supabase/client.ts
```

If you find any matches in client-side code, remove them immediately.

### 2. Check .env.local
```bash
cat web/.env.local
```

If you see `SUPABASE_SERVICE_ROLE_KEY`, remove it and use platform secrets instead.

### 3. Check Git History
```bash
git log --all --full-history --source -- **/.env.local
```

If service key was committed, you must:
1. Rotate the key in Supabase dashboard
2. Update platform secrets with new key
3. Redeploy

---

## 🔄 Key Rotation (if compromised)

If your service key was exposed:

1. **Generate new key**:
   - Go to Supabase Dashboard
   - Project Settings → API
   - Reset service_role key

2. **Update all locations**:
   - Platform secrets (Vercel/Netlify)
   - Local development (if applicable)
   - Any scripts or tools

3. **Redeploy**:
   - Redeploy all environments to use new key

4. **Verify**:
   - Test admin operations still work
   - Check logs for auth errors

---

## ✅ Security Checklist

- [ ] `SUPABASE_SERVICE_ROLE_KEY` removed from `web/.env.local`
- [ ] Service key added to platform secrets (Vercel/Netlify/etc.)
- [ ] No references to service key in client-side code
- [ ] RLS policies enabled on all tables
- [ ] Service role only used in server-side API routes/actions
- [ ] `.env.local` and `.env` files in `.gitignore`
- [ ] Environment variables documented in `README.md`

---

## 📚 Additional Resources

- [Supabase Auth Security Best Practices](https://supabase.com/docs/guides/auth/security)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)

---

**Last Updated**: 2025-11-21  
**Security Level**: 🔴 CRITICAL
