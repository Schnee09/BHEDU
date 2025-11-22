# 🔄 Import Migration Guide

This guide helps you update imports from the old `supabaseClient.ts` to the new standardized Supabase client setup.

---

## 📝 Quick Reference

### Old Pattern (Delete This)
```typescript
import { supabase } from '@/lib/supabaseClient'
import { createClient } from '@/lib/supabaseClient'
```

### New Patterns

#### Browser/Client Components
```typescript
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()
```

#### Server Components/API Routes
```typescript
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()
```

---

## 🔍 Find and Replace

### Step 1: Find All Old Imports
```bash
# Search for old import pattern
git grep -n "from '@/lib/supabaseClient'" web/
```

### Step 2: Replace Based on File Type

#### For Client Components (`.tsx` with `'use client'`)
```diff
- import { supabase } from '@/lib/supabaseClient'
+ import { createClient } from '@/lib/supabase/client'
+ const supabase = createClient()
```

OR

```diff
- import { createClient } from '@/lib/supabaseClient'
+ import { createClient } from '@/lib/supabase/client'
```

#### For Server Components (`.tsx` without `'use client'`)
```diff
- import { supabase } from '@/lib/supabaseClient'
+ import { createClient } from '@/lib/supabase/server'
+ const supabase = await createClient()
```

#### For API Routes (`app/api/**/route.ts`)
```diff
- import { supabase } from '@/lib/supabaseClient'
+ import { createClient } from '@/lib/supabase/server'
+ const supabase = await createClient()
```

---

## 📂 Files to Check

Based on the project structure, check these directories:

```bash
web/app/            # Server and client components
web/components/     # React components (mostly client)
web/lib/services/   # Service layer (server-side)
web/lib/api/        # API utilities (server-side)
web/hooks/          # React hooks (client-side)
```

---

## ✅ Verification

After updating imports, verify:

1. **No imports from old path**:
   ```bash
   git grep "from '@/lib/supabaseClient'" web/
   ```
   Should return: No results

2. **TypeScript check**:
   ```bash
   cd web
   pnpm run typecheck
   ```
   Should pass with no errors related to Supabase client

3. **Build check**:
   ```bash
   cd web
   pnpm build
   ```
   Should build successfully

---

## 🐛 Common Issues

### Issue: "Cannot find module '@/lib/supabaseClient'"
**Solution**: You missed updating an import. Search for the old path and update it.

### Issue: "Cannot read properties of undefined"
**Solution**: You're using the old singleton `supabase` export. Update to call `createClient()`.

### Issue: "This expression is not callable"
**Solution**: In server components, `createClient()` is async. Use `await createClient()`.

### Issue: "Cookies can only be accessed in Server Actions"
**Solution**: You're using server client in client component. Switch to `@/lib/supabase/client`.

---

## 🗑️ After Migration

Once all imports are updated:

1. **Delete old file**:
   ```bash
   rm web/lib/supabaseClient.ts
   ```

2. **Verify no references**:
   ```bash
   git grep "supabaseClient" web/
   ```
   Should return: No results (or only comments/docs)

3. **Commit changes**:
   ```bash
   git add .
   git commit -m "refactor: migrate to new Supabase client setup"
   ```

---

## 📚 Additional Notes

- **No need to update** files that already use `@/lib/supabase/server` or `@/lib/supabase/client`
- **Service role client** should only be used in server-side API routes for admin operations
- **Browser client** handles auth cookies automatically via `@supabase/ssr`
- **Server client** accesses user session from Next.js cookies

---

**Need help?** Check `web/lib/supabase/README.md` for detailed usage examples.
