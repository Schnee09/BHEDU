# Seed Data Strategy

## Overview
This folder contains SQL scripts for seeding reference data. User data (profiles) must be created differently because they depend on Supabase Auth.

## Why Not Use Migrations for Seed Data?

**Problem**: The `profiles` table has a foreign key to `auth.users`:
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id),
  -- other fields...
);
```

**Issue**: You cannot create users in `auth.users` via SQL migrations. Supabase Auth manages this table exclusively through:
- Admin SDK
- Supabase Dashboard
- Signup API endpoints

**Result**: Any seed migration that tries to `INSERT INTO profiles` will fail with:
```
ERROR: Key (id)=(xxx) is not present in table "users"
```

## Our Approach: Two-Step Seeding

### Step 1: Reference Data (SQL - Safe to Run Anytime)
Run `01_reference_data.sql` to seed:
- Academic years
- Grading scales  
- Fee types
- Payment methods
- Attendance policies

These tables don't depend on users and can be seeded via SQL.

```bash
# From Supabase dashboard SQL Editor, run:
supabase/seed/01_reference_data.sql
```

### Step 2: User Data (Admin SDK - Run Once)
Use the TypeScript script to create test users:
```bash
cd scripts
node create-admin-users.ts
```

This script uses Supabase Admin SDK to:
1. Create users in `auth.users` (5 admins, 20 teachers, 50 students)
2. Create profiles in `profiles` table
3. Create guardians for students
4. Create classes
5. Enroll students in classes

## Files

- `README.md` - This file
- `01_reference_data.sql` - Non-user reference data (safe to run anytime)
- `02_cleanup.sql` - Script to clean seed data (for testing)

## Usage

### First Time Setup
```bash
# 1. Apply migrations
cd supabase
npx supabase db push

# 2. Seed reference data (via Dashboard SQL Editor or CLI)
# Copy/paste 01_reference_data.sql into Supabase Dashboard

# 3. Create test users
cd ../scripts
pnpm create-admin-users.ts
```

### Reset Data (Testing)
```bash
# Run from Supabase Dashboard SQL Editor:
# 1. Run 02_cleanup.sql to delete all seed data
# 2. Re-run Step 2 and 3 above
```

## Alternative: Manual Creation

If you prefer manual setup:
1. Create 1-2 admin users in Supabase Dashboard → Authentication
2. Use admin UI to create classes, teachers, students

This is more realistic to production workflow but slower for testing.

## Production Notes

**DO NOT** run seed scripts in production! They contain test data only.

For production:
1. Only run `01_reference_data.sql` (configure academic years, grading scales, fee types)
2. Create real users via the application signup flow
3. Admins create classes, assign teachers, import students

## Troubleshooting

### "ERROR: Key (id)=(xxx) is not present in table users"
You tried to insert into `profiles` without creating the user in `auth.users` first.

**Solution**: Use the Admin SDK script or Supabase Dashboard to create users.

### "Seed data already exists"
The SQL script has `ON CONFLICT DO NOTHING` to prevent duplicates. Safe to re-run.

### "Permission denied"
Ensure you're using the service role key (not anon key) when running seed scripts.
