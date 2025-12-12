# Financial Migration Quick Reference

## ⚡ The Problem
Finance endpoints returned **500 errors** because 10 financial tables didn't exist in Supabase.

## ✅ The Solution
Created `supabase/migrations/010_financial_system.sql` with all required tables.

## 🚀 How to Apply Migration

### Option 1: SQL Editor (Fastest - 5 min)
1. Go to https://app.supabase.com → Select your project
2. Click **SQL Editor** in left sidebar
3. Click **New Query**
4. Copy entire contents of `supabase/migrations/010_financial_system.sql`
5. Paste into the editor
6. Click **Run**
7. See **✅ 10 SUCCESS** messages

### Option 2: Supabase CLI (Most Robust)
```bash
# Install CLI (one-time)
npm install -g supabase

# Login to Supabase
supabase login

# Link project
supabase link --project-ref mwncwhkdimnjovxzhtjm

# Push migration
supabase db push

# Verify
npm run check-tables
```

### Option 3: Node.js Script (Alternative)
```bash
# Ensure .env.local has Supabase credentials
npm run check-tables  # Should show ❌ for all tables first

# Apply migration
node supabase/run-migration.js

# Verify
npm run check-tables  # Should show ✅ for all tables
```

## 📊 Verify Tables Exist

```bash
npm run check-tables
```

Expected output:
```
✅ student_accounts           0 records
✅ fee_types                  0 records
✅ fee_assignments            0 records
✅ invoices                   0 records
✅ invoice_items              0 records
✅ payment_methods            0 records
✅ payments                   0 records
✅ payment_allocations        0 records
✅ payment_schedules          0 records
✅ payment_schedule_installments  0 records

✨ All financial tables exist! Ready to use.
```

## 🧪 Test Finance Endpoints

1. Start dev server: `npm run dev` (in web/ folder)
2. Open http://localhost:3000/dashboard/admin/data-dump
3. Look for the **finance** section - should show:
   - ✅ student-accounts
   - ✅ fee-types
   - ✅ fee-assignments
   - ✅ invoices
   - ✅ invoice-items
   - ✅ payment-methods
   - ✅ payments
   - ✅ payment-allocations
   - ✅ payment-schedules
   - ✅ payment-schedule-installments

All should show empty data, not errors!

## 📁 Key Files

| File | Purpose |
|------|---------|
| `supabase/migrations/010_financial_system.sql` | The migration (apply this) |
| `APPLY_MIGRATION_NOW.md` | Step-by-step guide |
| `FINANCIAL_MIGRATION_GUIDE.md` | Detailed documentation |
| `supabase/run-migration.js` | Node.js runner script |
| `scripts/check-supabase-tables.js` | Diagnostic tool |

## 🔧 What Was Fixed

### Code Changes Made:
- ✅ Added `bulk` rate limit config (50/min for data operations)
- ✅ Updated finance endpoints to use bulk config
- ✅ Fixed data-dump page to use sequential requests
- ✅ Improved error handling for missing tables
- ✅ Build verified (139 routes)

### Database Changes To Make:
- ⏳ Apply financial migration to Supabase
- ⏳ Create 10 financial tables
- ⏳ Set up RLS policies (included in migration)
- ⏳ Create indexes for performance (included in migration)

## 📝 Tables Created

1. **student_accounts** - Student balance per academic year
2. **fee_types** - Fee categories (tuition, materials, etc)
3. **fee_assignments** - Assign fees to classes
4. **invoices** - Student bills
5. **invoice_items** - Line items on bills
6. **payment_methods** - Cash, bank transfer, etc
7. **payments** - Payment records
8. **payment_allocations** - Map payments to invoices
9. **payment_schedules** - Installment/milestone schedules
10. **payment_schedule_installments** - Individual installments

## 🎯 Next Steps

1. **Apply Migration** (pick one method above)
2. **Verify Tables** `npm run check-tables`
3. **Test Endpoints** Visit data-dump page
4. **Build UI** Create financial management interface

## ❓ Troubleshooting

### "Table does not exist" errors
→ Migration not applied yet. Follow "How to Apply Migration" above.

### "Unauthorized" errors  
→ RLS policies missing. Migration includes these, re-run migration.

### Rate limit errors (429)
→ Use data-dump page (handles sequential requests) or add delays to your code.

### `npm run check-tables` fails with "SUPABASE_URL not found"
→ Ensure `.env.local` has both `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

## 📞 Support Commands

```bash
# Check what tables exist
npm run check-tables

# Seed sample data (after migration applied)
npm run seed

# View Supabase project
open https://app.supabase.com

# View API routes
npm run build  # See "139 routes compiled"
```

---

**Status**: Ready to apply! Pick Option 1, 2, or 3 above and follow the steps.
