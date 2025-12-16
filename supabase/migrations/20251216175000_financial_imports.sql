-- Migration: Financial and imports
-- Created: 2025-12-16
-- Guarded for safe replay in fresh DB

DO $$
BEGIN
  -- fee_assignments (references academic_years, fee_types, classes)
  IF to_regclass('public.fee_assignments') IS NULL THEN
    CREATE TABLE public.fee_assignments (
      id uuid NOT NULL DEFAULT gen_random_uuid(),
      academic_year_id uuid NOT NULL,
      fee_type_id uuid NOT NULL,
      class_id uuid,
      amount numeric NOT NULL,
      description text,
      is_active boolean DEFAULT true,
      created_at timestamp with time zone NOT NULL DEFAULT now(),
      updated_at timestamp with time zone NOT NULL DEFAULT now(),
      CONSTRAINT fee_assignments_pkey PRIMARY KEY (id),
      CONSTRAINT fee_assignments_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id),
      CONSTRAINT fee_assignments_fee_type_id_fkey FOREIGN KEY (fee_type_id) REFERENCES public.fee_types(id),
      CONSTRAINT fee_assignments_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id)
    );
  END IF;

  -- invoices (references profiles, student_accounts, academic_years)
  IF to_regclass('public.invoices') IS NULL THEN
    CREATE TABLE public.invoices (
      id uuid NOT NULL DEFAULT gen_random_uuid(),
      invoice_number text NOT NULL UNIQUE,
      student_id uuid NOT NULL,
      student_account_id uuid,
      academic_year_id uuid NOT NULL,
      issue_date date NOT NULL DEFAULT CURRENT_DATE,
      due_date date NOT NULL,
      total_amount numeric NOT NULL DEFAULT 0.00,
      paid_amount numeric NOT NULL DEFAULT 0.00,
      status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['draft'::text, 'pending'::text, 'partial'::text, 'paid'::text, 'overdue'::text, 'cancelled'::text])),
      notes text,
      created_at timestamp with time zone NOT NULL DEFAULT now(),
      updated_at timestamp with time zone NOT NULL DEFAULT now(),
      CONSTRAINT invoices_pkey PRIMARY KEY (id),
      CONSTRAINT invoices_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id),
      CONSTRAINT invoices_student_account_id_fkey FOREIGN KEY (student_account_id) REFERENCES public.student_accounts(id),
      CONSTRAINT invoices_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id)
    );
  END IF;

  -- invoice_items (references invoices, fee_types)
  IF to_regclass('public.invoice_items') IS NULL THEN
    CREATE TABLE public.invoice_items (
      id uuid NOT NULL DEFAULT gen_random_uuid(),
      invoice_id uuid NOT NULL,
      fee_type_id uuid,
      description text NOT NULL,
      quantity integer DEFAULT 1,
      unit_price numeric NOT NULL,
      total_price numeric NOT NULL,
      created_at timestamp with time zone NOT NULL DEFAULT now(),
      CONSTRAINT invoice_items_pkey PRIMARY KEY (id),
      CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id),
      CONSTRAINT invoice_items_fee_type_id_fkey FOREIGN KEY (fee_type_id) REFERENCES public.fee_types(id)
    );
  END IF;

  -- payments (references profiles, invoices, payment_methods)
  IF to_regclass('public.payments') IS NULL THEN
    CREATE TABLE public.payments (
      id uuid NOT NULL DEFAULT gen_random_uuid(),
      student_id uuid NOT NULL,
      invoice_id uuid,
      payment_method_id uuid,
      amount numeric NOT NULL,
      reference_number text,
      payment_date date NOT NULL DEFAULT CURRENT_DATE,
      received_by uuid,
      notes text,
      status text NOT NULL DEFAULT 'received'::text CHECK (status = ANY (ARRAY['pending'::text, 'received'::text, 'verified'::text, 'cancelled'::text])),
      created_at timestamp with time zone NOT NULL DEFAULT now(),
      updated_at timestamp with time zone NOT NULL DEFAULT now(),
      CONSTRAINT payments_pkey PRIMARY KEY (id),
      CONSTRAINT payments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id),
      CONSTRAINT payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id),
      CONSTRAINT payments_payment_method_id_fkey FOREIGN KEY (payment_method_id) REFERENCES public.payment_methods(id),
      CONSTRAINT payments_received_by_fkey FOREIGN KEY (received_by) REFERENCES public.profiles(id)
    );
  END IF;

  -- payment_allocations (references payments, invoices)
  IF to_regclass('public.payment_allocations') IS NULL THEN
    CREATE TABLE public.payment_allocations (
      id uuid NOT NULL DEFAULT gen_random_uuid(),
      payment_id uuid NOT NULL,
      invoice_id uuid NOT NULL,
      amount numeric NOT NULL,
      notes text,
      created_at timestamp with time zone NOT NULL DEFAULT now(),
      CONSTRAINT payment_allocations_pkey PRIMARY KEY (id),
      CONSTRAINT payment_allocations_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id),
      CONSTRAINT payment_allocations_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id)
    );
  END IF;

  -- payment_schedule_installments (references payment_schedules)
  IF to_regclass('public.payment_schedule_installments') IS NULL THEN
    CREATE TABLE public.payment_schedule_installments (
      id uuid DEFAULT gen_random_uuid(),
      schedule_id uuid NOT NULL,
      installment_number integer NOT NULL,
      due_date date NOT NULL,
      percentage numeric NOT NULL,
      description text,
      created_at timestamp with time zone NOT NULL DEFAULT now(),
      CONSTRAINT payment_schedule_installments_pkey PRIMARY KEY (schedule_id, installment_number),
      CONSTRAINT payment_schedule_installments_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES public.payment_schedules(id)
    );
  END IF;

  -- import_logs (references profiles)
  IF to_regclass('public.import_logs') IS NULL THEN
    CREATE TABLE public.import_logs (
      id uuid NOT NULL DEFAULT gen_random_uuid(),
      imported_by uuid NOT NULL,
      import_type character varying NOT NULL,
      file_name character varying,
      file_size integer,
      total_rows integer NOT NULL DEFAULT 0,
      processed_rows integer NOT NULL DEFAULT 0,
      success_count integer NOT NULL DEFAULT 0,
      error_count integer NOT NULL DEFAULT 0,
      warning_count integer NOT NULL DEFAULT 0,
      status character varying NOT NULL DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'processing'::character varying, 'completed'::character varying, 'failed'::character varying, 'cancelled'::character varying]::text[])),
      error_summary text,
      started_at timestamp with time zone DEFAULT now(),
      completed_at timestamp with time zone,
      duration_seconds integer,
      created_at timestamp with time zone DEFAULT now(),
      CONSTRAINT import_logs_pkey PRIMARY KEY (id),
      CONSTRAINT import_logs_imported_by_fkey FOREIGN KEY (imported_by) REFERENCES public.profiles(id)
    );
  END IF;

  -- import_errors (references import_logs)
  IF to_regclass('public.import_errors') IS NULL THEN
    CREATE TABLE public.import_errors (
      id uuid NOT NULL DEFAULT gen_random_uuid(),
      import_log_id uuid NOT NULL,
      row_number integer NOT NULL,
      field_name character varying,
      error_type character varying,
      error_message text NOT NULL,
      row_data jsonb,
      severity character varying DEFAULT 'error'::character varying CHECK (severity::text = ANY (ARRAY['error'::character varying, 'warning'::character varying, 'info'::character varying]::text[])),
      created_at timestamp with time zone DEFAULT now(),
      CONSTRAINT import_errors_pkey PRIMARY KEY (id),
      CONSTRAINT import_errors_import_log_id_fkey FOREIGN KEY (import_log_id) REFERENCES public.import_logs(id)
    );
  END IF;

  -- notifications (references profiles)
  IF to_regclass('public.notifications') IS NULL THEN
    CREATE TABLE public.notifications (
      id uuid NOT NULL DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL,
      title text NOT NULL,
      message text NOT NULL,
      type text CHECK (type = ANY (ARRAY['info'::text, 'warning'::text, 'error'::text, 'success'::text])),
      read boolean DEFAULT false,
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now(),
      CONSTRAINT notifications_pkey PRIMARY KEY (id),
      CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
    );
  END IF;

  -- qr_codes (references classes)
  IF to_regclass('public.qr_codes') IS NULL THEN
    CREATE TABLE public.qr_codes (
      id uuid NOT NULL DEFAULT uuid_generate_v4(),
      class_id uuid,
      token text NOT NULL UNIQUE,
      valid_until timestamp with time zone NOT NULL,
      used_at timestamp with time zone,
      created_at timestamp with time zone DEFAULT now(),
      CONSTRAINT qr_codes_pkey PRIMARY KEY (id),
      CONSTRAINT qr_codes_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id)
    );
  END IF;

  -- grades (references assignments, profiles)
  IF to_regclass('public.grades') IS NULL THEN
    CREATE TABLE public.grades (
      id uuid NOT NULL DEFAULT gen_random_uuid(),
      assignment_id uuid NOT NULL,
      student_id uuid NOT NULL,
      score numeric,
      feedback text,
      graded_at timestamp with time zone,
      graded_by uuid,
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now(),
      CONSTRAINT grades_pkey PRIMARY KEY (id),
      CONSTRAINT grades_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.assignments(id),
      CONSTRAINT grades_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id),
      CONSTRAINT grades_graded_by_fkey FOREIGN KEY (graded_by) REFERENCES public.profiles(id)
    );
  END IF;
END
$$;