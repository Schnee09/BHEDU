-- Migration: Global Schema Optimization Phase 3 Part 2 - Finance Schema
-- Created: 2026-02-06
-- Purpose: Apply Enums to Finance Tables using Column Replacement Strategy.
--          Relies on Part 1 (Enums) being committed.

-- ============================================
-- PHASE 2: TABLES (CREATE IF MISSING, MIGRATE IF EXISTING)
-- ============================================

-- 2.1 Student Accounts
DO $$ 
DECLARE
  constraint_name_var text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'student_accounts') THEN
    CREATE TABLE public.student_accounts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
      balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      total_fees DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      total_paid DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      status account_status NOT NULL DEFAULT 'active'::account_status,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(student_id, academic_year_id)
    );
    CREATE INDEX idx_student_accounts_student_id ON student_accounts(student_id);
    CREATE INDEX idx_student_accounts_academic_year_id ON student_accounts(academic_year_id);
    CREATE INDEX idx_student_accounts_status ON student_accounts(status);
  ELSE
    ALTER TABLE public.student_accounts ALTER COLUMN status DROP DEFAULT;
    FOR constraint_name_var IN 
      SELECT conname FROM pg_constraint WHERE conrelid = 'public.student_accounts'::regclass AND contype = 'c' AND pg_get_constraintdef(oid) LIKE '%status%'
    LOOP
      EXECUTE format('ALTER TABLE public.student_accounts DROP CONSTRAINT %I', constraint_name_var);
    END LOOP;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_accounts' AND column_name = 'status_new') THEN
        ALTER TABLE public.student_accounts ADD COLUMN status_new account_status;
    END IF;

    -- Use TRIM(LOWER()) for robust casting
    UPDATE public.student_accounts SET status_new = 
      CASE TRIM(LOWER(status::text))
        WHEN 'active' THEN 'active'::account_status
        WHEN 'inactive' THEN 'inactive'::account_status
        WHEN 'graduated' THEN 'graduated'::account_status
        ELSE 'active'::account_status
      END;

    ALTER TABLE public.student_accounts DROP COLUMN status;
    ALTER TABLE public.student_accounts RENAME COLUMN status_new TO status;
    ALTER TABLE public.student_accounts ALTER COLUMN status SET DEFAULT 'active'::account_status;
  END IF;
END $$;

-- 2.2 Fee Types
DO $$ 
DECLARE
  constraint_name_var text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'fee_types') THEN
    CREATE TABLE public.fee_types (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      category fee_category NOT NULL DEFAULT 'tuition'::fee_category,
      description TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX idx_fee_types_active ON fee_types(is_active);
    CREATE INDEX idx_fee_types_category ON fee_types(category);
  ELSE
    ALTER TABLE public.fee_types ALTER COLUMN category DROP DEFAULT;
    FOR constraint_name_var IN 
      SELECT conname FROM pg_constraint WHERE conrelid = 'public.fee_types'::regclass AND contype = 'c' AND pg_get_constraintdef(oid) LIKE '%category%'
    LOOP
      EXECUTE format('ALTER TABLE public.fee_types DROP CONSTRAINT %I', constraint_name_var);
    END LOOP;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fee_types' AND column_name = 'category_new') THEN
        ALTER TABLE public.fee_types ADD COLUMN category_new fee_category;
    END IF;

    UPDATE public.fee_types SET category_new = 
      CASE TRIM(LOWER(category::text))
        WHEN 'tuition' THEN 'tuition'::fee_category
        WHEN 'facility' THEN 'facility'::fee_category
        WHEN 'activity' THEN 'activity'::fee_category
        WHEN 'exam' THEN 'exam'::fee_category
        ELSE 'other'::fee_category
      END;

    ALTER TABLE public.fee_types DROP COLUMN category;
    ALTER TABLE public.fee_types RENAME COLUMN category_new TO category;
    ALTER TABLE public.fee_types ALTER COLUMN category SET DEFAULT 'tuition'::fee_category;
  END IF;
END $$;

-- 2.3 Fee Assignments
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'fee_assignments') THEN
     CREATE TABLE public.fee_assignments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
      fee_type_id UUID NOT NULL REFERENCES fee_types(id) ON DELETE CASCADE,
      class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
      amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
      description TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX idx_fee_assignments_academic_year ON fee_assignments(academic_year_id);
    CREATE INDEX idx_fee_assignments_fee_type ON fee_assignments(fee_type_id);
    CREATE INDEX idx_fee_assignments_class ON fee_assignments(class_id);
  ELSE
    ALTER TABLE public.fee_assignments DROP CONSTRAINT IF EXISTS fee_assignments_amount_check;
    ALTER TABLE public.fee_assignments ADD CONSTRAINT fee_assignments_amount_check CHECK (amount >= 0);
  END IF;
END $$;


-- 2.4 Invoices
DO $$ 
DECLARE constraint_name_var text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'invoices') THEN
    CREATE TABLE public.invoices (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      invoice_number TEXT NOT NULL UNIQUE,
      student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      student_account_id UUID REFERENCES student_accounts(id) ON DELETE SET NULL,
      academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
      issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
      due_date DATE NOT NULL,
      total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
      paid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (paid_amount >= 0),
      status invoice_status NOT NULL DEFAULT 'pending'::invoice_status,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX idx_invoices_student_id ON invoices(student_id);
    CREATE INDEX idx_invoices_academic_year ON invoices(academic_year_id);
    CREATE INDEX idx_invoices_status ON invoices(status);
  ELSE
    ALTER TABLE public.invoices ALTER COLUMN status DROP DEFAULT;
    FOR constraint_name_var IN 
      SELECT conname FROM pg_constraint WHERE conrelid = 'public.invoices'::regclass AND contype = 'c' AND pg_get_constraintdef(oid) LIKE '%status%'
    LOOP
      EXECUTE format('ALTER TABLE public.invoices DROP CONSTRAINT %I', constraint_name_var);
    END LOOP;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'status_new') THEN
        ALTER TABLE public.invoices ADD COLUMN status_new invoice_status;
    END IF;

    UPDATE public.invoices SET status_new = 
      CASE TRIM(LOWER(status::text))
          WHEN 'draft' THEN 'draft'::invoice_status
          WHEN 'pending' THEN 'pending'::invoice_status
          WHEN 'partial' THEN 'partial'::invoice_status
          WHEN 'paid' THEN 'paid'::invoice_status
          WHEN 'overdue' THEN 'overdue'::invoice_status
          WHEN 'cancelled' THEN 'cancelled'::invoice_status
          WHEN 'sent' THEN 'sent'::invoice_status
          WHEN 'refunded' THEN 'refunded'::invoice_status
          ELSE 'pending'::invoice_status -- Fallback
      END;

    ALTER TABLE public.invoices DROP COLUMN status;
    ALTER TABLE public.invoices RENAME COLUMN status_new TO status;
    ALTER TABLE public.invoices ALTER COLUMN status SET DEFAULT 'pending'::invoice_status;
    
    ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_total_amount_check;
    ALTER TABLE public.invoices ADD CONSTRAINT invoices_total_amount_check CHECK (total_amount >= 0);
    ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_paid_amount_check;
    ALTER TABLE public.invoices ADD CONSTRAINT invoices_paid_amount_check CHECK (paid_amount >= 0);
  END IF;
END $$;

-- 2.5 Invoice Items
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'invoice_items') THEN
    CREATE TABLE public.invoice_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      fee_type_id UUID REFERENCES fee_types(id) ON DELETE SET NULL,
      description TEXT NOT NULL,
      quantity INT DEFAULT 1,
      unit_price DECIMAL(10, 2) NOT NULL,
      total_price DECIMAL(10, 2) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
     CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
  END IF;
END $$;


-- 2.6 Payment Methods
DO $$ 
DECLARE constraint_name_var text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_methods') THEN
    CREATE TABLE public.payment_methods (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      type payment_method_type NOT NULL,
      description TEXT,
      requires_reference BOOLEAN DEFAULT false,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX idx_payment_methods_active ON payment_methods(is_active);
  ELSE
    ALTER TABLE public.payment_methods ALTER COLUMN type DROP DEFAULT;
    FOR constraint_name_var IN 
      SELECT conname FROM pg_constraint WHERE conrelid = 'public.payment_methods'::regclass AND contype = 'c' AND pg_get_constraintdef(oid) LIKE '%type%'
    LOOP
      EXECUTE format('ALTER TABLE public.payment_methods DROP CONSTRAINT %I', constraint_name_var);
    END LOOP;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_methods' AND column_name = 'type_new') THEN
        ALTER TABLE public.payment_methods ADD COLUMN type_new payment_method_type;
    END IF;

    UPDATE public.payment_methods SET type_new = 
      CASE TRIM(LOWER(type::text))
          WHEN 'cash' THEN 'cash'::payment_method_type
          WHEN 'bank_transfer' THEN 'bank_transfer'::payment_method_type
          WHEN 'credit_card' THEN 'credit_card'::payment_method_type
          WHEN 'cheque' THEN 'cheque'::payment_method_type
          WHEN 'digital_wallet' THEN 'digital_wallet'::payment_method_type
          ELSE 'other'::payment_method_type
      END;

    ALTER TABLE public.payment_methods DROP COLUMN type;
    ALTER TABLE public.payment_methods RENAME COLUMN type_new TO type;
    ALTER TABLE public.payment_methods ALTER COLUMN type SET NOT NULL;
  END IF;
END $$;

-- 2.7 Payments
DO $$ 
DECLARE constraint_name_var text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payments') THEN
    CREATE TABLE public.payments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
      payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL,
      amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
      reference_number TEXT,
      payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
      received_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
      notes TEXT,
      status payment_status NOT NULL DEFAULT 'received'::payment_status,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX idx_payments_student ON payments(student_id);
    CREATE INDEX idx_payments_invoice ON payments(invoice_id);
    CREATE INDEX idx_payments_status ON payments(status);
  ELSE
    ALTER TABLE public.payments ALTER COLUMN status DROP DEFAULT;
    FOR constraint_name_var IN 
      SELECT conname FROM pg_constraint WHERE conrelid = 'public.payments'::regclass AND contype = 'c' AND pg_get_constraintdef(oid) LIKE '%status%'
    LOOP
      EXECUTE format('ALTER TABLE public.payments DROP CONSTRAINT %I', constraint_name_var);
    END LOOP;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'status_new') THEN
        ALTER TABLE public.payments ADD COLUMN status_new payment_status;
    END IF;

    UPDATE public.payments SET status_new = 
      CASE TRIM(LOWER(status::text))
          WHEN 'pending' THEN 'pending'::payment_status
          WHEN 'received' THEN 'received'::payment_status
          WHEN 'verified' THEN 'verified'::payment_status
          WHEN 'cancelled' THEN 'cancelled'::payment_status
          WHEN 'completed' THEN 'completed'::payment_status
          WHEN 'failed' THEN 'failed'::payment_status
          WHEN 'refunded' THEN 'refunded'::payment_status
          ELSE 'received'::payment_status
      END;

    ALTER TABLE public.payments DROP COLUMN status;
    ALTER TABLE public.payments RENAME COLUMN status_new TO status;
    ALTER TABLE public.payments ALTER COLUMN status SET DEFAULT 'received'::payment_status;

    ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_amount_check;
    ALTER TABLE public.payments ADD CONSTRAINT payments_amount_check CHECK (amount >= 0);
  END IF;
END $$;

-- 2.8 Payment Allocations
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_allocations') THEN
    CREATE TABLE public.payment_allocations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
      invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX idx_payment_allocations_payment ON payment_allocations(payment_id);
  ELSE
    ALTER TABLE public.payment_allocations DROP CONSTRAINT IF EXISTS payment_allocations_amount_check;
    ALTER TABLE public.payment_allocations ADD CONSTRAINT payment_allocations_amount_check CHECK (amount >= 0);
  END IF;
END $$;

-- 2.9 Payment Schedules & Installments
DO $$ 
DECLARE constraint_name_var text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_schedules') THEN
    CREATE TABLE public.payment_schedules (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      description TEXT,
      academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
      schedule_type schedule_type NOT NULL DEFAULT 'installment'::schedule_type,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX idx_payment_schedules_academic_year ON payment_schedules(academic_year_id);
  ELSE
     ALTER TABLE public.payment_schedules ALTER COLUMN schedule_type DROP DEFAULT;
      FOR constraint_name_var IN 
        SELECT conname FROM pg_constraint WHERE conrelid = 'public.payment_schedules'::regclass AND contype = 'c' AND pg_get_constraintdef(oid) LIKE '%schedule_type%'
      LOOP
        EXECUTE format('ALTER TABLE public.payment_schedules DROP CONSTRAINT %I', constraint_name_var);
      END LOOP;

      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_schedules' AND column_name = 'schedule_type_new') THEN
          ALTER TABLE public.payment_schedules ADD COLUMN schedule_type_new schedule_type;
      END IF;

      UPDATE public.payment_schedules SET schedule_type_new = 
        CASE TRIM(LOWER(schedule_type::text))
            WHEN 'installment' THEN 'installment'::schedule_type
            WHEN 'milestone' THEN 'milestone'::schedule_type
            WHEN 'custom' THEN 'custom'::schedule_type
            ELSE 'installment'::schedule_type
        END;

      ALTER TABLE public.payment_schedules DROP COLUMN schedule_type;
      ALTER TABLE public.payment_schedules RENAME COLUMN schedule_type_new TO schedule_type;
      ALTER TABLE public.payment_schedules ALTER COLUMN schedule_type SET DEFAULT 'installment'::schedule_type;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_schedule_installments') THEN
    CREATE TABLE public.payment_schedule_installments (
      id UUID DEFAULT gen_random_uuid(),
      schedule_id UUID NOT NULL REFERENCES payment_schedules(id) ON DELETE CASCADE,
      installment_number INT NOT NULL,
      due_date DATE NOT NULL,
      percentage DECIMAL(5, 2) NOT NULL CHECK (percentage BETWEEN 0 AND 100),
      description TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (schedule_id, installment_number)
    );
    CREATE INDEX idx_schedule_installments_schedule ON payment_schedule_installments(schedule_id);
  ELSE
     ALTER TABLE public.payment_schedule_installments DROP CONSTRAINT IF EXISTS installment_percentage_check;
     ALTER TABLE public.payment_schedule_installments ADD CONSTRAINT installment_percentage_check CHECK (percentage BETWEEN 0 AND 100);
  END IF;
END $$;

SELECT 'Finance Schema Hardening Complete!' AS status;
