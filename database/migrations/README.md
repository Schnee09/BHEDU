Migration notes for 2025-12-13-fix-schema.sql

What this migration does (conservative / idempotent):

- Ensures the pgcrypto extension is enabled (gen_random_uuid())
- Normalizes uuid default on `public.qr_codes.id` to gen_random_uuid() (replaces uuid_generate_v4)
- Cleans `payment_schedule_installments`:
  - Drops redundant `id` column if present
  - Ensures `schedule_id` and `installment_number` are NOT NULL
  - Adds a composite PK (schedule_id, installment_number) if missing
- Adds a missing foreign key: `enrollments.class_id` -> `classes(id)` with ON DELETE RESTRICT
- Renames `profiles.student_id` to `profiles.legacy_student_id` (non-destructive; skipped if target exists)
- Adds several helpful indexes on FK columns used in joins

Important safety notes / follow-ups:

- This migration is intentionally conservative. It avoids destructive cascades or automatic changes to ON DELETE behavior.
- Review the rename of `profiles.student_id` — if that column was intended to be a FK to something else, adjust accordingly.
- If you prefer a surrogate `id` on `payment_schedule_installments`, modify the migration to keep the `id` and make it the PK instead.
- The migration assumes the `public` schema and depends on `classes`, `profiles`, and other tables existing. Run on a staging DB first.

How to run (example):

1. Backup the database.
2. Run on staging: psql -d <staging_db> -f database/migrations/2025-12-13-fix-schema.sql
3. Verify schema and run application smoke tests.
4. Promote to production during a maintenance window if checks pass.
