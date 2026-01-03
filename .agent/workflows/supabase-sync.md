---
description: How to sync local code with Supabase database
---

# Supabase Sync Workflow

Use this workflow to keep local TypeScript types in sync with the Supabase database.

## When to Run

Run the sync script after:
- Making changes in Supabase Dashboard (adding/modifying tables or columns)
- Team member updates database schema
- Before starting development on a feature that uses the database

## Steps

### 1. Make sure you're logged in and linked

```bash
cd e:\TTGDBH\BH-EDU
npx supabase login        # If not logged in
npx supabase link         # If not linked to project
```

### 2. Run the sync script

// turbo
```bash
cd e:\TTGDBH\BH-EDU\web
npx tsx scripts/sync-supabase.ts
```

This will:
- Generate TypeScript types from the remote database
- Save them to `lib/database.types.ts`
- Show a summary of tables found

### 3. Use the generated types

```typescript
import { Database } from '@/lib/database.types'

type Class = Database['public']['Tables']['classes']['Row']
type Grade = Database['public']['Tables']['grades']['Row']
```

### 4. For typed Supabase client

```typescript
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/database.types'

const supabase = createClient<Database>(url, key)
// Now all queries are type-safe!
```

## Quick Command

// turbo
```bash
npx supabase gen types typescript --linked > web/lib/database.types.ts
```

## Troubleshooting

If types don't generate:
1. Check you're logged in: `npx supabase login`
2. Check project is linked: `npx supabase link`
3. Check database is accessible
