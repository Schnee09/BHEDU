# 🌱 Database Seeding Guide

This guide explains how to seed your BH-EDU database with comprehensive test data for development and testing.

## 📋 Prerequisites

- Supabase project set up and running
- Environment variables configured (.env.local):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

```bash
# 1. Install dependencies
cd web
npm install

# 2. Create test users in Supabase Auth
node ../scripts/create-test-users.js

# 3. Reset database and apply migrations + seed
npx supabase db reset
```

### Option 2: Manual Setup

```bash
# 1. Create users manually in Supabase Dashboard (Authentication > Users)
#    See user list below

# 2. Apply migrations
npx supabase db push

# 3. Run seed script
psql $DATABASE_URL < ../supabase/seed_comprehensive.sql
```

## 👥 Test Accounts

### Admin
- **Email**: `admin@bhedu.example.com`
- **Password**: `Admin123!`
- **Access**: Full system access

### Teachers (4 accounts)
- **john.doe@bhedu.example.com** / `Teacher123!` - Mathematics
- **emily.johnson@bhedu.example.com** / `Teacher123!` - English
- **michael.brown@bhedu.example.com** / `Teacher123!` - Science
- **sarah.davis@bhedu.example.com** / `Teacher123!` - History

### Students (8 accounts)
- **alice.anderson@student.bhedu.example.com** / `Student123!`
- **bob.martinez@student.bhedu.example.com** / `Student123!`
- **charlie.wilson@student.bhedu.example.com** / `Student123!`
- **diana.lee@student.bhedu.example.com** / `Student123!`
- **ethan.taylor@student.bhedu.example.com** / `Student123!`
- **fiona.garcia@student.bhedu.example.com** / `Student123!`
- **george.harris@student.bhedu.example.com** / `Student123!`
- **hannah.clark@student.bhedu.example.com** / `Student123!`

## 📊 What Gets Seeded?

### Configuration
- ✅ School settings (name, address, timezone, etc.)
- ✅ Academic years (2023-2024, 2024-2025, 2025-2026)
- ✅ Grading scales (A+ to F with GPA mapping)

### Users & Classes
- ✅ 2 Admin users
- ✅ 4 Teacher users
- ✅ 8 Student users
- ✅ 5 Classes with realistic schedules
- ✅ ~24 Enrollments (students enrolled in 3-4 classes each)

### Academic Data
- ✅ 200+ Attendance records (last 2 weeks, realistic patterns)
- ✅ Assignment categories (Homework, Quizzes, Exams, Participation)
- ✅ 30+ Assignments (past, current, and future)
- ✅ 50+ Submissions with grades (70-100% range)
- ✅ Current grades for enrolled students

### Finance
- ✅ 5 Fee types (Tuition, Lab, Technology, Library, Activity)
- ✅ 4 Payment methods (Cash, Card, Transfer, Check)
- ✅ 3 Payment schedules for Fall 2024
- ✅ Student accounts with balances
- ✅ Invoices (paid, partial, unpaid)
- ✅ Payment history

### Additional Data
- ✅ Guardians for each student
- ✅ QR codes for student attendance
- ✅ Notifications (grades, assignments, submissions)
- ✅ Audit logs for tracking changes

## 🔧 Troubleshooting

### Users Not Created

**Problem**: Script fails to create users

**Solutions**:
```bash
# 1. Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# 2. Verify service role key has auth.admin privileges
# Go to Supabase Dashboard > Settings > API

# 3. Create users manually in Dashboard
# Authentication > Users > Add User
```

### Seed Script Fails

**Problem**: SQL errors when running seed script

**Solutions**:
```bash
# 1. Ensure migrations are applied first
npx supabase db push

# 2. Check for RLS policies
# The seed script creates profiles that link to auth.users
# Make sure RLS policies allow these inserts

# 3. Run with error output
psql $DATABASE_URL < supabase/seed_comprehensive.sql 2>&1 | tee seed_errors.log
```

### Missing Data

**Problem**: Seed completes but data is missing

**Solutions**:
```bash
# 1. Check if users exist in auth.users
# The seed script depends on auth users existing first

# 2. Verify RLS policies
# Some policies might be blocking inserts

# 3. Check foreign key constraints
# Data is inserted in specific order to respect FK constraints
```

## 🧪 Testing the Seed Data

```bash
# 1. Login as admin
# URL: http://localhost:3000/login
# Email: admin@bhedu.example.com
# Password: Admin123!

# 2. Check dashboard
# - View all classes
# - Check attendance reports
# - Review student grades
# - View finance reports

# 3. Login as teacher
# Email: john.doe@bhedu.example.com
# - View your classes
# - Mark attendance
# - Grade assignments
# - View student progress

# 4. Login as student
# Email: alice.anderson@student.bhedu.example.com
# - View enrolled classes
# - Check grades
# - View assignments
# - See attendance history
```

## 📝 Customization

### Add More Users

Edit `scripts/create-test-users.js`:

```javascript
const testUsers = [
  // Add your custom users here
  {
    email: 'newuser@example.com',
    password: 'Password123!',
    role: 'teacher',
    name: 'New Teacher'
  }
]
```

### Modify Seed Data

Edit `supabase/seed_comprehensive.sql`:

```sql
-- Add more classes
INSERT INTO classes (id, name, description, teacher_id, ...)
VALUES (...);

-- Add more students to a class
INSERT INTO enrollments (...)
VALUES (...);
```

## 🔄 Reset Database

To start fresh:

```bash
# Option 1: Reset everything (migrations + seed)
npx supabase db reset

# Option 2: Just clear data (keep migrations)
psql $DATABASE_URL -c "TRUNCATE TABLE profiles CASCADE;"
# Then re-run seed script

# Option 3: Drop and recreate (nuclear option)
npx supabase db reset --linked
```

## 📚 Related Documentation

- [Supabase Auth Admin API](https://supabase.com/docs/reference/javascript/auth-admin-createuser)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Migrations](https://supabase.com/docs/guides/cli/local-development#database-migrations)

## 💡 Tips

1. **Always create auth users first** before running SQL seed
2. **Use consistent passwords** in development (easier to remember)
3. **Check RLS policies** if data isn't appearing
4. **Use transactions** in seed scripts for atomicity
5. **Document custom modifications** to seed data

## 🐛 Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "User already exists" | Auth user created twice | Ignore or delete from dashboard |
| "Foreign key violation" | Missing auth.users entry | Create auth user first |
| "Permission denied" | RLS blocking insert | Check RLS policies or use service role |
| "Null value in column" | Missing required field | Check table schema for NOT NULL columns |
| Seed runs but no data | Wrong database connection | Verify DATABASE_URL or supabase link |

---

## 🎉 Success!

If everything worked, you should now have:
- ✅ 14 users (2 admin, 4 teachers, 8 students)
- ✅ 5 classes with enrollments
- ✅ Attendance, assignments, and grades
- ✅ Finance data (invoices, payments)
- ✅ Complete system ready for testing

**Happy testing! 🚀**
