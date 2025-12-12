# Financial System Data Seeding Status

## Current Situation

### ✅ What's Working
1. **All financial tables exist** - Verified via `npm run check-tables`
   - student_accounts (0 records)
   - fee_types (10 records) ✅
   - fee_assignments (0 records)
   - invoices (0 records)
   - invoice_items (0 records)
   - payment_methods (6 records) ✅
   - payments (0 records)
   - payment_allocations (0 records)
   - payment_schedules (0 records)
   - payment_schedule_installments (0 records)

2. **Students have grade levels assigned**
   - 13 students: 5 in Grade 10, 4 in Grade 11, 4 in Grade 12
   - Sample: Sara Suigetsu (Grade 10), Fiona Rodriguez (Grade 11), Charlie Student (Grade 12)

3. **Academic year is set**
   - Current: 2024-2025 (ID: eae41e94-af67-4111-95b8-60d802b56153)

### ❌ Blocking Issue

**Supabase PostgREST Schema Cache Not Updated**

Error: `Could not find the table 'public.student_accounts' in the schema cache`

This affects ALL the new financial tables (student_accounts, fee_assignments, invoices, etc.) - they exist in the database but PostgREST API doesn't see them yet.

## Solutions

### Option 1: Manual Schema Reload (Recommended)
1. Open Supabase Dashboard: https://supabase.com/dashboard/project/mwncwhkdimnjovxzhtjm
2. Go to **Settings** → **API** → Click **"Reload schema cache"** button
3. Wait 30 seconds
4. Run: `node scripts/seed-financial-data.js`

### Option 2: SQL Editor (Manual)
1. Open Supabase Dashboard → SQL Editor
2. Run this SQL directly:

```sql
-- Create student accounts
INSERT INTO public.student_accounts (student_id, academic_year_id, balance, total_fees, total_paid, status)
SELECT 
    p.id,
    'eae41e94-af67-4111-95b8-60d802b56153'::uuid,
    0,
    0,
    0,
    'active'
FROM profiles p
WHERE p.role = 'student' AND p.grade_level IS NOT NULL
ON CONFLICT (student_id, academic_year_id) DO NOTHING;

-- Create universal fee assignments (Grade 10)
INSERT INTO public.fee_assignments (academic_year_id, fee_type_id, amount, due_date, notes)
VALUES
  ('eae41e94-af67-4111-95b8-60d802b56153', '0e111111-1111-1111-1111-111111110001', 5000000, NOW() + INTERVAL '1 month', 'Grade 10 standard fee'),
  ('eae41e94-af67-4111-95b8-60d802b56153', '0e111111-1111-1111-1111-111111110003', 300000, NOW() + INTERVAL '1 month', 'Grade 10 standard fee'),
  ('eae41e94-af67-4111-95b8-60d802b56153', '0e111111-1111-1111-1111-111111110005', 150000, NOW() + INTERVAL '1 month', 'Grade 10 standard fee'),
  ('eae41e94-af67-4111-95b8-60d802b56153', '0e111111-1111-1111-1111-111111110010', 100000, NOW() + INTERVAL '1 month', 'Grade 10 standard fee');

-- Repeat for Grade 11 and 12 with adjusted amounts...
```

### Option 3: Wait for Auto-Refresh
PostgREST schema cache refreshes periodically (usually every few minutes to hours). Wait and try again later.

### Option 4: Use Next.js API (Alternative)
Create an admin API route that uses Supabase service role to insert data. This might bypass the cache issue.

## Prepared Scripts

All scripts are ready and tested (schema-wise):

1. **`scripts/assign-grade-levels.js`** ✅ (Already run successfully)
2. **`scripts/seed-financial-data.js`** ⏳ (Ready to run after cache refresh)
3. **`scripts/list-fee-types.js`** ✅ (Shows 10 fee types)
4. **`scripts/check-students.js`** ✅ (Confirms grade levels set)

## Next Steps

1. **Reload Supabase schema cache** (via dashboard or wait)
2. Run `node scripts/seed-financial-data.js`
3. Verify with `npm run check-tables`
4. Test finance endpoints at `/dashboard/admin/data-dump`

## Fee Structure (Ready to Apply)

**Grade 10:** 5,550,000 VND/semester
- Tuition: 5,000,000
- Lab: 300,000
- Activity: 150,000
- Exam: 100,000

**Grade 11:** 6,050,000 VND/semester
- Tuition: 5,500,000
- Lab: 300,000
- Activity: 150,000
- Exam: 100,000

**Grade 12:** 6,550,000 VND/semester
- Tuition: 6,000,000
- Lab: 300,000
- Activity: 150,000
- Exam: 100,000
