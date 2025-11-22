# Supabase Project Recovery & Clean Setup Guide

This guide helps you reset, clean up, and reliably set up your Supabase backend for the BH-EDU project.

## 1. Clean Migration & Schema Setup

- Use ONLY `COMPLETE_STUDENT_MANAGEMENT.sql` for a full schema reset. It now includes all required tables, RLS, triggers, and helper functions.
- Ignore older migration files unless you need historical reference.

### Steps:
1. Open Supabase Dashboard SQL editor (or use CLI).
2. Paste and run the contents of `supabase/COMPLETE_STUDENT_MANAGEMENT.sql`.

## 2. Seed Reference Data

- Use ONLY `COMPLETE_TEST_SEED.sql` for initial reference/test data.
- This seeds academic years, grading scales, payment methods, and fee types.

### Steps:
1. After schema is applied, run `supabase/COMPLETE_TEST_SEED.sql` in the SQL editor or CLI.

## 3. Create Auth Users & Link Profiles

- Auth users **must** be created via Node/TS scripts, not SQL.
- Use `backend/seed_supabase_auth.js` or `web/scripts/seed.ts` to create test users and link to profiles.

### Steps:
1. Ensure your Supabase service role key is rotated and safe.
2. Run the seed script:
   ```cmd
   node backend/seed_supabase_auth.js
   ```
   or
   ```cmd
   pnpm tsx web/scripts/seed.ts
   ```

## 4. Test CRUD & RLS

- Use Supabase dashboard or your API to verify student CRUD, enrollments, and RLS policies.
- Run API smoke tests from `web/scripts/test-all-apis.ps1` or similar.

## 5. Clean Up Old Files

- Archive or delete outdated migration/seed files:
  - `supabase/migrations/*` (unless needed for reference)
  - `supabase/seed/01_reference_data.sql`, `02_cleanup.sql` (now merged)
  - Any old SQL files not referenced above

## 6. Troubleshooting

- If you see table/column missing errors, confirm you applied the latest schema file.
- If seed scripts fail, check for typos or missing tables in the schema.
- For Auth issues, ensure your service role key is valid and not exposed.

## 7. Quick Recovery Checklist

- [x] Apply `COMPLETE_STUDENT_MANAGEMENT.sql`
- [x] Run `COMPLETE_TEST_SEED.sql`
- [x] Run Auth seed script
- [x] Test CRUD & RLS
- [ ] Archive/delete old/conflicting files

---

**If you need further cleanup, automation, or want to archive old files, ask for a file cleanup next!**
