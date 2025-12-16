-- Migration: Core tables without foreign keys
-- Created: 2025-12-16
-- Guarded for safe replay in fresh DB

DO $$
BEGIN
  -- academic_years
  IF to_regclass('public.academic_years') IS NULL THEN
    CREATE TABLE public.academic_years (
      id uuid NOT NULL DEFAULT gen_random_uuid(),
      name text NOT NULL,
      start_date date,
      end_date date,
      is_current boolean DEFAULT false,
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now(),
      CONSTRAINT academic_years_pkey PRIMARY KEY (id)
    );
  END IF;

  -- subjects
  IF to_regclass('public.subjects') IS NULL THEN
    CREATE TABLE public.subjects (
      id uuid NOT NULL DEFAULT gen_random_uuid(),
      name text NOT NULL,
      code text,
      description text,
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now(),
      CONSTRAINT subjects_pkey PRIMARY KEY (id)
    );
  END IF;

  -- fee_types
  IF to_regclass('public.fee_types') IS NULL THEN
    CREATE TABLE public.fee_types (
      id uuid NOT NULL DEFAULT gen_random_uuid(),
      name text NOT NULL,
      code text NOT NULL UNIQUE,
      category text NOT NULL DEFAULT 'tuition'::text CHECK (category = ANY (ARRAY['tuition'::text, 'facility'::text, 'activity'::text, 'exam'::text, 'other'::text])),
      description text,
      is_active boolean DEFAULT true,
      created_at timestamp with time zone NOT NULL DEFAULT now(),
      updated_at timestamp with time zone NOT NULL DEFAULT now(),
      CONSTRAINT fee_types_pkey PRIMARY KEY (id)
    );
  END IF;

  -- grading_scales
  IF to_regclass('public.grading_scales') IS NULL THEN
    CREATE TABLE public.grading_scales (
      id uuid NOT NULL DEFAULT gen_random_uuid(),
      name text NOT NULL,
      description text,
      scale jsonb,
      is_default boolean DEFAULT false,
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now(),
      CONSTRAINT grading_scales_pkey PRIMARY KEY (id)
    );
  END IF;

  -- payment_methods
  IF to_regclass('public.payment_methods') IS NULL THEN
    CREATE TABLE public.payment_methods (
      id uuid NOT NULL DEFAULT gen_random_uuid(),
      name text NOT NULL,
      type text NOT NULL CHECK (type = ANY (ARRAY['cash'::text, 'bank_transfer'::text, 'credit_card'::text, 'cheque'::text, 'digital_wallet'::text, 'other'::text])),
      description text,
      requires_reference boolean DEFAULT false,
      is_active boolean DEFAULT true,
      created_at timestamp with time zone NOT NULL DEFAULT now(),
      updated_at timestamp with time zone NOT NULL DEFAULT now(),
      CONSTRAINT payment_methods_pkey PRIMARY KEY (id)
    );
  END IF;

  -- payment_schedules
  IF to_regclass('public.payment_schedules') IS NULL THEN
    CREATE TABLE public.payment_schedules (
      id uuid NOT NULL DEFAULT gen_random_uuid(),
      name text NOT NULL,
      description text,
      academic_year_id uuid NOT NULL,
      schedule_type text NOT NULL DEFAULT 'installment'::text CHECK (schedule_type = ANY (ARRAY['installment'::text, 'milestone'::text, 'custom'::text])),
      is_active boolean DEFAULT true,
      created_at timestamp with time zone NOT NULL DEFAULT now(),
      updated_at timestamp with time zone NOT NULL DEFAULT now(),
      CONSTRAINT payment_schedules_pkey PRIMARY KEY (id)
    );
  END IF;

  -- school_settings
  IF to_regclass('public.school_settings') IS NULL THEN
    CREATE TABLE public.school_settings (
      id uuid NOT NULL DEFAULT gen_random_uuid(),
      key text NOT NULL UNIQUE,
      value text,
      description text,
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now(),
      CONSTRAINT school_settings_pkey PRIMARY KEY (id)
    );
  END IF;

  -- audit_logs
  IF to_regclass('public.audit_logs') IS NULL THEN
    CREATE TABLE public.audit_logs (
      id uuid NOT NULL DEFAULT gen_random_uuid(),
      timestamp timestamp with time zone NOT NULL DEFAULT now(),
      user_id uuid,
      user_email text NOT NULL,
      user_role text NOT NULL,
      action text NOT NULL,
      resource_type text NOT NULL,
      resource_id text NOT NULL,
      changes jsonb,
      metadata jsonb,
      ip text,
      user_agent text,
      created_at timestamp with time zone NOT NULL DEFAULT now(),
      CONSTRAINT audit_logs_pkey PRIMARY KEY (id)
    );
  END IF;

  -- report_exports
  IF to_regclass('public.report_exports') IS NULL THEN
    CREATE TABLE public.report_exports (
      id uuid NOT NULL DEFAULT gen_random_uuid(),
      type text NOT NULL,
      params jsonb NOT NULL,
      status text NOT NULL DEFAULT 'pending'::text,
      created_at timestamp with time zone NOT NULL DEFAULT now(),
      started_at timestamp with time zone,
      finished_at timestamp with time zone,
      result_url text,
      error_message text,
      CONSTRAINT report_exports_pkey PRIMARY KEY (id)
    );
  END IF;
END
$$;