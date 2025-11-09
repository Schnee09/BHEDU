# Applying Migrations to Supabase

Since the Supabase CLI is having setup issues, use the **Supabase Dashboard SQL Editor** instead.

## Steps to apply migrations:

### 1. Open Supabase Dashboard
Go to your project: https://supabase.com/dashboard/project/YOUR_PROJECT_REF

### 2. Navigate to SQL Editor
- Click **SQL Editor** in the left sidebar
- Click **New query**

### 3. Apply Migration 004 (Courses & Lessons Schema)
Copy and paste the entire contents of:
`supabase/migrations/004_courses_lessons_schema.sql`

Then click **Run** or press `Ctrl+Enter`

### 4. Apply Migration 005 (RLS Policies)
Create another new query, copy and paste:
`supabase/migrations/005_courses_lessons_rls.sql`

Then click **Run**

### 5. Verify
Run this query to confirm tables were created:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('courses', 'lessons');
```

You should see both tables listed.

## Alternative: Direct PostgreSQL connection

If you have your database connection string (from Settings > Database), you can use psql:

```bash
# Windows (if you have PostgreSQL installed)
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" -f supabase/migrations/004_courses_lessons_schema.sql
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" -f supabase/migrations/005_courses_lessons_rls.sql
```

## After applying migrations

Test the backend courses endpoints:
```bash
# From root directory
cd backend
npm start

# Then test with curl or Postman
GET http://localhost:3000/api/courses
POST http://localhost:3000/api/courses
```
