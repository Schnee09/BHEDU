-- Migration: create report_exports table for background export jobs
-- Created: 2025-12-13

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS report_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  params jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending | in_progress | succeeded | failed
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  finished_at timestamptz,
  result_url text,
  error_message text
);

CREATE INDEX IF NOT EXISTS idx_report_exports_status ON report_exports(status);
