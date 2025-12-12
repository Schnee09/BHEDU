# 🚀 Quick Start: Apply Financial Migration

## The Fastest Way (5 minutes)

### Step 1: Copy Migration SQL
Open: `supabase/migrations/010_financial_system.sql`

### Step 2: Go to Supabase Console
Visit: https://app.supabase.com/project/mwncwhkdimnjovxzhtjm/sql/new

(Replace `mwncwhkdimnjovxzhtjm` with your project ref if different)

### Step 3: Paste & Execute
1. Click "Create a new query"
2. Paste entire contents of `010_financial_system.sql`
3. Click **Run** button (or Ctrl+Enter)
4. Wait for success ✅

### Step 4: Verify Tables Created
Run this query in SQL editor:

```sql
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

Look for these 10 tables:
- ✅ student_accounts
- ✅ fee_assignments
- ✅ fee_types
- ✅ invoice_items
- ✅ invoices
- ✅ payment_allocations
- ✅ payment_methods
- ✅ payment_schedule_installments
- ✅ payment_schedules
- ✅ payments

### Step 5: Test Your Endpoints
Go to: http://localhost:3000/dashboard/admin/data-dump

Should now show:
- ✅ student_accounts (empty, 0 records)
- ✅ invoices (empty, 0 records)
- ✅ payments (empty, 0 records)
- ✅ payment_schedules (empty, 0 records)
- ... etc for all financial tables

---

## What's Included

**10 Financial Tables** with:
✅ Foreign key relationships  
✅ Indexes for performance  
✅ Row Level Security (RLS) policies  
✅ Automated `updated_at` triggers  
✅ Proper data types and constraints  

**Example Schema**:
```
academic_years
├── student_accounts (balance tracking)
├── fee_assignments (assign fees to classes)
│   └── fee_types
├── invoices (student bills)
│   └── invoice_items
└── payment_schedules
    └── installments

payments
├── payment_methods
├── payment_allocations → invoices
└── student tracking
```

---

## Troubleshooting

**Q: "Syntax error" when executing?**  
A: The SQL editor may have issues with large files. Try splitting into smaller chunks or use Supabase CLI.

**Q: Tables don't appear?**  
A: Refresh the Tables list in Supabase console (⟳ icon top right)

**Q: Endpoints still show errors?**  
A: Make sure tables exist by running the verification query above.

**Q: RLS Permission errors?**  
A: Use the **service role key** from `.env.local`, not the anon key. The migration sets up RLS policies that require admin role.

---

## What This Fixes

Your previous errors:
```
❌ student_accounts - Internal server error
❌ invoices - Internal server error
❌ payments - Internal server error
❌ payment_schedule_installments - Unauthorized
```

Were caused by:
- Tables didn't exist in database
- Endpoints tried to query non-existent tables

This migration creates all tables, so endpoints will return:
```json
{
  "success": true,
  "data": [],
  "pagination": { "page": 1, "limit": 25, "total": 0, "pages": 0 }
}
```

✅ All working!

---

## Next: Seed Sample Data

Once tables exist, optionally add sample data:

```sql
-- Add a fee type
INSERT INTO fee_types (name, code, category, description)
VALUES ('Monthly Tuition', 'TUITION_MONTHLY', 'tuition', 'Monthly tuition fee');

-- Add a payment method
INSERT INTO payment_methods (name, type, description)
VALUES ('Cash', 'cash', 'Cash payments');

-- Add a payment schedule
INSERT INTO payment_schedules (name, academic_year_id, schedule_type)
VALUES ('Monthly Installments', '(get-your-academic-year-id)', 'installment');
```

---

**Status**: 🟢 Ready to deploy  
**Estimated Time**: 5 minutes  
**Difficulty**: 🟢 Easy  

Questions? Check `FINANCIAL_MIGRATION_GUIDE.md` for detailed instructions.
