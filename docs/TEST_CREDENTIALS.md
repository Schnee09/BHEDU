# Test Credentials

Test accounts for the 4-role system. All passwords: `test123`

## 📧 Test Accounts

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **Admin** | admin@test.com | test123 | Full system access |
| **Staff** | staff@test.com | test123 | Operations (no system config) |
| **Teacher** | teacher@test.com | test123 | Own classes only |
| **Student** | student@test.com | test123 | Own data only |

## 🔐 Role Permissions

### 👑 Admin (Super Admin)
- Full access to all features
- System configuration
- User role management
- Delete critical data
- All finance operations

### 👔 Staff (Sub-Admin)
- Create/edit teachers and students
- Manage classes and enrollments
- View all attendance and grades
- Full finance operations
- **Cannot**: Configure system, change user roles, delete critical data

### 👨‍🏫 Teacher
- Own classes only
- Mark attendance for own classes
- Grade entry for own classes
- Create assignments
- **Cannot**: Access admin features

### 👨‍🎓 Student
- View own grades and attendance
- QR check-in
- View own invoices/payments
- **Cannot**: Access any management features

## 🛠️ Creating Test Accounts

### Method 1: Supabase Dashboard (Recommended)
1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add user" → "Create new user"
3. Enter email (e.g., admin@test.com) and password (test123)
4. Check "Auto Confirm User"
5. Run the SQL below to set the role

```sql
-- After creating users, set their roles:
UPDATE profiles SET role = 'admin' WHERE email = 'admin@test.com';
UPDATE profiles SET role = 'staff' WHERE email = 'staff@test.com';
UPDATE profiles SET role = 'teacher' WHERE email = 'teacher@test.com';
UPDATE profiles SET role = 'student' WHERE email = 'student@test.com';
```

### Method 2: SQL Script
Run `supabase/migrations/20241209_create_test_accounts.sql` in SQL Editor.

## ✅ Verification

```sql
SELECT email, role, full_name 
FROM profiles 
WHERE email LIKE '%@test.com';
```

Expected output:
| email | role | full_name |
|-------|------|-----------|
| admin@test.com | admin | Test Admin |
| staff@test.com | staff | Test Staff |
| teacher@test.com | teacher | Test Teacher |
| student@test.com | student | Test Student |
