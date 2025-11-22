# Supabase Client Setup Guide

This directory contains standardized Supabase client creation for different environments.

## File Structure

```
web/lib/supabase/
├── client.ts    - Browser-side client (use in client components)
├── server.ts    - Server-side client (use in server components, API routes)
└── README.md    - This file
```

## Usage

### 1. Browser/Client Components

Use `client.ts` for client-side code:

```typescript
// In a client component
'use client'

import { createClient } from '@/lib/supabase/client'

export default function MyClientComponent() {
  const supabase = createClient()
  
  // Use supabase client...
  const { data } = await supabase.from('profiles').select('*')
}
```

### 2. Server Components & Actions

Use `server.ts` for server-side code:

```typescript
// In a server component or server action
import { createClient } from '@/lib/supabase/server'

export default async function MyServerComponent() {
  const supabase = await createClient()
  
  // Access user session via cookies
  const { data: { session } } = await supabase.auth.getSession()
  
  // Query with RLS enforcement
  const { data } = await supabase.from('profiles').select('*')
}
```

### 3. API Routes

Use `server.ts` with request context:

```typescript
// In app/api/*/route.ts
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  
  // User session automatically from cookies
  const { data, error } = await supabase.from('profiles').select('*')
  
  return Response.json({ data, error })
}
```

### 4. Service Role (Admin Operations)

For admin operations that bypass RLS, use service role client:

```typescript
// ONLY in server-side code (API routes, server actions)
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = createServiceClient() // Bypasses RLS
  
  // Admin operations
  const { data, error } = await supabase.from('profiles').insert({ ... })
  
  return Response.json({ data, error })
}
```

⚠️ **NEVER** use service role client in client components or expose the service role key to the browser!

## Environment Variables

### Client-Side (.env.local - safe to expose)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Server-Side (Platform secrets - NEVER commit)
```bash
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Migration from Old Setup

If you have imports from the old `supabaseClient.ts`, update them:

```diff
- import { supabase } from '@/lib/supabaseClient'
+ import { createClient } from '@/lib/supabase/client' // for browser
+ const supabase = createClient()

- import { createClient } from '@/lib/supabaseClient'
+ import { createClient } from '@/lib/supabase/client' // for browser
+ // OR
+ import { createClient } from '@/lib/supabase/server' // for server
```

## Best Practices

1. **Browser code**: Always use `@/lib/supabase/client`
2. **Server code**: Always use `@/lib/supabase/server`
3. **Service role**: Only use `createServiceClient()` when absolutely necessary (user creation, admin operations)
4. **RLS**: Design your database with RLS policies, don't rely on service role for normal operations
5. **Auth**: User authentication state is managed via cookies automatically by `@supabase/ssr`

## Troubleshooting

### "Missing Supabase env vars" warning
- Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in `.env.local`
- Restart your dev server after adding environment variables

### "Permission denied" or RLS errors
- Ensure RLS policies are correctly configured for your use case
- Check that the user is authenticated before accessing protected data
- For admin operations, use service role client (server-side only)

### Auth session not persisting
- Ensure you're using `createClient()` from `@/lib/supabase/server` in server components/API routes
- Check that cookies are properly configured in your Next.js middleware

## Security Checklist

- ✅ `NEXT_PUBLIC_*` keys in `.env.local` are safe to expose (anon key only)
- ✅ `SUPABASE_SERVICE_ROLE_KEY` is stored in platform secrets (Vercel, Netlify, etc.)
- ✅ Service role client is NEVER used in client components
- ✅ RLS policies are enabled on all tables
- ✅ User authentication is handled via cookies (no manual token management)

---

**Last Updated**: 2025-11-21  
**Supabase Version**: @supabase/ssr ^0.5.0, @supabase/supabase-js ^2.80.0
