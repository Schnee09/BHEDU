# Supabase Financial System Migration Guide

This guide explains how to sync the financial system tables with your Supabase database.

## Overview

The financial system requires several tables:
- `student_accounts` - Track student balances per academic year
- `fee_types` - Define types of fees
- `fee_assignments` - Assign fees to classes
- `invoices` - Student invoices
- `invoice_items` - Line items on invoices
- `payment_methods` - Available payment methods
- `payments` - Payment records
- `payment_allocations` - Map payments to invoices
- `payment_schedules` - Installment/milestone schedules
- `payment_schedule_installments` - Individual installments

## Method 1: Using Supabase SQL Editor (Recommended for Quick Testing)

1. Go to your Supabase project: https://app.supabase.com
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy the entire contents of `supabase/migrations/010_financial_system.sql`
5. Paste into the editor
6. Click **Run** to execute all statements

✅ **Pros**: Instant, visual feedback, can modify on the fly
❌ **Cons**: Manual process, not version controlled

## Method 2: Using Supabase CLI (Recommended for Production)

Prerequisites:
```bash
npm install -g supabase
# or if using pnpm:
pnpm add -g supabase
```

### Steps:

1. **Authenticate with Supabase**:
```bash
supabase login
```
This will open a browser to create an access token.

2. **Link to your project**:
```bash
supabase link --project-ref mwncwhkdimnjovxzhtjm
```
Use your project ref from the `.env.local` file (the URL domain: `mwncwhkdimnjovxzhtjm`)

3. **Push the migration**:
```bash
supabase db push
```

This will:
- Detect the new `010_financial_system.sql` migration
- Apply it to your remote database
- Track the migration in `.supabase/migrations.json`

✅ **Pros**: Version controlled, repeatable, safe, includes rollback capability
❌ **Cons**: Requires CLI setup

## Method 3: Using Node.js Script

```bash
cd supabase
node run-migration.js
```

This reads all SQL files and attempts to execute them. ⚠️ Note: Requires RPC function support.

## Verification

After running the migration, verify tables were created:

```sql
-- Check if tables exist
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE '%student_accounts%' 
   OR tablename LIKE '%invoices%' 
   OR tablename LIKE '%payments%';
```

You should see:
- ✅ student_accounts
- ✅ fee_types
- ✅ fee_assignments
- ✅ invoices
- ✅ invoice_items
- ✅ payment_methods
- ✅ payments
- ✅ payment_allocations
- ✅ payment_schedules
- ✅ payment_schedule_installments

## Testing the Endpoints

Once tables are created, test the finance endpoints:

```bash
# From your web directory:
npm run dev
```

Then visit in browser or use curl:

```bash
# Test student_accounts endpoint
curl http://localhost:3000/api/admin/data/student_accounts

# Test invoices endpoint
curl http://localhost:3000/api/admin/data/invoices

# Test payments endpoint
curl http://localhost:3000/api/admin/data/payments
```

You should see:
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 0,
    "pages": 0
  }
}
```

## Troubleshooting

### "Table does not exist" errors
- Verify migration was run in Supabase SQL editor
- Check `.supabase/migrations/` folder for migration status
- Run the migration again

### Permission errors
- Ensure service role key in `.env.local` has correct permissions
- In Supabase, check Database > Roles > postgres user
- Verify RLS policies allow admin access

### RLS Policy errors
- The migration includes RLS policies for security
- Admin users should have full access
- Check `policies` in your Supabase console under each table

## Schema Design Notes

### Row Level Security (RLS)

All financial tables have RLS enabled:
- **Students**: Can view their own data
- **Admins**: Can view and manage all data
- **Public**: Can view read-only data (fees, schedules, payment methods)

### Foreign Keys

Tables have proper foreign key relationships:
- `invoices` → `profiles` (student)
- `invoices` → `academic_years`
- `payments` → `profiles` (student & receiver)
- `payments` → `invoices`
- `payment_allocations` → `payments` & `invoices`

### Cascading Deletes

When an academic year or student is deleted:
- All related accounts, invoices, and payments are deleted
- Maintains referential integrity

## Next Steps

1. ✅ Apply the migration to your Supabase database
2. ✅ Verify all 10 financial tables are created
3. ✅ Test the `/api/admin/data/[table]` endpoints
4. ✅ Create sample data (optional)
5. ✅ Build finance management UI

## Sample Data

To test with sample data, you can use the Supabase SQL editor:

```sql
-- Insert a fee type
INSERT INTO fee_types (name, code, category, description, is_active)
VALUES ('Tuition', 'TUITION', 'tuition', 'Monthly tuition fee', true);

-- Insert a payment method
INSERT INTO payment_methods (name, type, description, is_active)
VALUES ('Cash', 'cash', 'Cash payment', true);
```

---

**Last Updated**: December 9, 2025
**Migration Version**: 010_financial_system.sql
