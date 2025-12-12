# 🚀 Apply Financial Migration - Manual Steps

Your Supabase project needs the financial migration applied. Follow these exact steps:

## Step 1: Copy the Migration SQL

The migration file is at:
```
supabase/migrations/010_financial_system.sql
```

You need to copy the **entire contents** of this file (all 436 lines).

## Step 2: Open Supabase SQL Editor

1. Go to: **https://app.supabase.com**
2. Select your project: **mwncwhkdimnjovxzhtjm**
3. In the left sidebar, click: **SQL Editor**
4. Click: **New Query** (top left)

## Step 3: Paste the SQL

1. In the editor, paste the entire contents of `010_financial_system.sql`
2. You should see the SQL filling the editor with 400+ lines

## Step 4: Execute the Query

Click the blue **"Run"** button (bottom right)
- Or use keyboard shortcut: **Ctrl+Enter**

## Step 5: Wait for Success

You should see multiple success messages:
```
CREATE TABLE student_accounts
CREATE TABLE fee_types
CREATE TABLE fee_assignments
... (10 tables total)
```

All should show in green without errors.

## Verify It Worked

After the migration succeeds, run:
```bash
npm run check-tables
```

You should see:
```
✅ student_accounts
✅ fee_types
✅ fee_assignments
✅ invoices
✅ invoice_items
✅ payment_methods
✅ payments
✅ payment_allocations
✅ payment_schedules
✅ payment_schedule_installments

✨ All financial tables exist! Ready to use.
```

---

## 💡 Why Not Automated?

We tried to automate this via:
- ❌ Supabase CLI (`supabase db push`) - Conflicts with existing migration history
- ❌ Node.js script (`node run-migration.js`) - Requires `public.exec()` RPC function
- ✅ **SQL Editor (manual)** - Works directly, no dependencies

The SQL Editor method is actually the most reliable and takes only 5 minutes!

---

## 🎯 Summary

1. Copy: `supabase/migrations/010_financial_system.sql` (all content)
2. Go to: https://app.supabase.com → SQL Editor → New Query
3. Paste and click: Run
4. Wait for success messages
5. Run: `npm run check-tables`
6. Done! ✨

Let me know when you've completed this, and I'll verify the tables were created!
