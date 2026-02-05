-- Migration: Global Schema Optimization Phase 3 Part 1 - Finance Enums
-- Created: 2026-02-06
-- Purpose: Define and Expand Finance ENUMs.
--          Must run in a separate transaction from usage (Postgres Enum Safety).

-- 1.1 Account Status
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_status') THEN
    CREATE TYPE account_status AS ENUM ('active', 'inactive', 'graduated');
  END IF;
END $$;

-- 1.2 Fee Category
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fee_category') THEN
    CREATE TYPE fee_category AS ENUM ('tuition', 'facility', 'activity', 'exam', 'other');
  END IF;
END $$;

-- 1.3 Invoice Status (Expand Foundation Enum)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_status') THEN
    CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'pending', 'partial', 'paid', 'overdue', 'cancelled', 'refunded');
  ELSE
    -- Add missing values
    ALTER TYPE invoice_status ADD VALUE IF NOT EXISTS 'pending';
    ALTER TYPE invoice_status ADD VALUE IF NOT EXISTS 'partial';
    ALTER TYPE invoice_status ADD VALUE IF NOT EXISTS 'refunded';
    -- 'sent' exists in foundation
  END IF;
END $$;

-- 1.4 Payment Method Type
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method_type') THEN
    CREATE TYPE payment_method_type AS ENUM ('cash', 'bank_transfer', 'credit_card', 'cheque', 'digital_wallet', 'other');
  END IF;
END $$;

-- 1.5 Payment Status (Expand Foundation Enum)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded', 'cancelled', 'received', 'verified');
  ELSE
    -- Add missing values
    ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'received';
    ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'verified';
  END IF;
END $$;

-- 1.6 Schedule Type
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'schedule_type') THEN
    CREATE TYPE schedule_type AS ENUM ('installment', 'milestone', 'custom');
  END IF;
END $$;

SELECT 'Finance Enums Defined/Expanded' AS status;
