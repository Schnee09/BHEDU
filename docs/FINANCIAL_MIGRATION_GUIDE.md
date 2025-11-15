# Financial System Migration Guide

## Run the Database Migration

Since we're using hosted Supabase, we'll run the migration through the Supabase SQL Editor.

### Steps:

1. **Open Supabase SQL Editor**
   - Go to your Supabase dashboard: https://supabase.com/dashboard
   - Navigate to your project
   - Click on "SQL Editor" in the left sidebar

2. **Copy the Migration SQL**
   - The migration file is located at: `supabase/migrations/022_financial_system.sql`
   - Copy the entire contents of this file

3. **Run the Migration**
   - Paste the SQL into the Supabase SQL Editor
   - Click "Run" to execute the migration
   - You should see a success message

4. **Verify the Migration**
   - Check that all tables were created:
     - fee_types
     - payment_schedules
     - payment_schedule_installments
     - fee_assignments
     - student_accounts
     - invoices
     - invoice_items
     - payment_methods
     - payments
     - payment_allocations
   
   - Check that views were created:
     - outstanding_balances
     - payment_summary
     - revenue_by_category

## Create Test Data

After running the migration, you can create some test data using the scripts below:

### 1. Create Payment Methods (Run in SQL Editor)

```sql
-- Insert default payment methods
INSERT INTO payment_methods (name, type, description, is_active) VALUES
  ('Cash', 'cash', 'Cash payment', true),
  ('Bank Transfer', 'bank_transfer', 'Direct bank transfer', true),
  ('Mobile Money', 'mobile_money', 'Mobile money payment', true),
  ('Credit Card', 'card', 'Credit/Debit card payment', true),
  ('Online Payment', 'online', 'Online payment gateway', true);
```

### 2. Create Fee Types (Run in SQL Editor)

```sql
-- Get the current academic year ID
-- Replace 'ACADEMIC_YEAR_ID' with your actual academic year ID

INSERT INTO fee_types (name, description, amount, category, is_mandatory, is_active, academic_year_id) VALUES
  ('Tuition Fee', 'Annual tuition fee', 5000.00, 'tuition', true, true, 'ACADEMIC_YEAR_ID'),
  ('Registration Fee', 'One-time registration fee', 500.00, 'registration', true, true, 'ACADEMIC_YEAR_ID'),
  ('Library Fee', 'Annual library access fee', 200.00, 'library', false, true, 'ACADEMIC_YEAR_ID'),
  ('Sports Fee', 'Sports activities fee', 300.00, 'sports', false, true, 'ACADEMIC_YEAR_ID'),
  ('Lab Fee', 'Laboratory usage fee', 400.00, 'laboratory', false, true, 'ACADEMIC_YEAR_ID'),
  ('Transport Fee', 'School transport fee', 800.00, 'transport', false, true, 'ACADEMIC_YEAR_ID'),
  ('Exam Fee', 'Examination fee', 250.00, 'exam', true, true, 'ACADEMIC_YEAR_ID'),
  ('Uniform', 'School uniform', 150.00, 'uniform', true, true, 'ACADEMIC_YEAR_ID'),
  ('Books', 'Textbooks and materials', 350.00, 'books', true, true, 'ACADEMIC_YEAR_ID');
```

### 3. Create Student Accounts (Run in SQL Editor)

```sql
-- Create student accounts for all active students
-- This will create accounts for the current academic year

INSERT INTO student_accounts (student_id, academic_year_id)
SELECT 
  s.id,
  'ACADEMIC_YEAR_ID' -- Replace with your actual academic year ID
FROM students s
WHERE s.status = 'active'
ON CONFLICT (student_id, academic_year_id) DO NOTHING;
```

## Testing the Financial System

After creating the test data, you can:

1. Visit `/dashboard/finance` to see the financial dashboard
2. Go to `/dashboard/finance/fees` to manage fee types
3. Create invoices for students at `/dashboard/finance/invoices`
4. Record payments at `/dashboard/finance/payments`
5. View reports at `/dashboard/finance/reports`

## Troubleshooting

If you encounter any errors during migration:

1. Check the Supabase logs for error details
2. Ensure you have sufficient permissions
3. Verify that all prerequisite tables (students, academic_years) exist
4. Make sure there are no conflicting table names

## Need Help?

If you run into issues:
- Check the Supabase dashboard logs
- Review the migration file for syntax errors
- Ensure your database user has CREATE TABLE, CREATE FUNCTION, and CREATE TRIGGER permissions
