# 🔑 Test Credentials Quick Reference

## Admin Access
```
Email:    admin@bhedu.example.com
Password: Admin123!
Role:     System Administrator
```
**Can Access:**
- All classes and students
- User management
- Finance reports
- System settings
- Import/export tools

---

## Teacher Accounts

### 1️⃣ John Doe (Mathematics)
```
Email:    john.doe@bhedu.example.com
Password: Teacher123!
Classes:  Mathematics 101, Advanced Mathematics
```

### 2️⃣ Emily Johnson (English)
```
Email:    emily.johnson@bhedu.example.com
Password: Teacher123!
Classes:  English Literature
```

### 3️⃣ Michael Brown (Science)
```
Email:    michael.brown@bhedu.example.com
Password: Teacher123!
Classes:  Science Lab
```

### 4️⃣ Sarah Davis (History)
```
Email:    sarah.davis@bhedu.example.com
Password: Teacher123!
Classes:  History & Social Studies
```

**Can Access:**
- Their assigned classes only
- Mark attendance
- Create/grade assignments
- View enrolled students
- Class reports

---

## Student Accounts

### 1️⃣ Alice Anderson
```
Email:    alice.anderson@student.bhedu.example.com
Password: Student123!
Classes:  Math 101, English, History, Advanced Math
```

### 2️⃣ Bob Martinez
```
Email:    bob.martinez@student.bhedu.example.com
Password: Student123!
Classes:  Math 101, English, Science
```

### 3️⃣ Charlie Wilson
```
Email:    charlie.wilson@student.bhedu.example.com
Password: Student123!
Classes:  Math 101, Science, History
```

### 4️⃣ Diana Lee
```
Email:    diana.lee@student.bhedu.example.com
Password: Student123!
Classes:  Math 101, English, History
```

### 5️⃣ Ethan Taylor
```
Email:    ethan.taylor@student.bhedu.example.com
Password: Student123!
Classes:  Math 101, Advanced Math
```

### 6️⃣ Fiona Garcia
```
Email:    fiona.garcia@student.bhedu.example.com
Password: Student123!
Classes:  Math 101, History
```

### 7️⃣ George Harris
```
Email:    george.harris@student.bhedu.example.com
Password: Student123!
Classes:  Science, History
```

### 8️⃣ Hannah Clark
```
Email:    hannah.clark@student.bhedu.example.com
Password: Student123!
Classes:  English, History
```

**Can Access:**
- Enrolled classes only
- View own grades
- View own attendance
- Submit assignments
- View notifications
- Edit profile

---

## 🎯 Quick Test Scenarios

### Scenario 1: Admin Dashboard
1. Login as: `admin@bhedu.example.com`
2. Navigate to: Dashboard → Classes
3. Expected: See all 5 classes
4. Action: Click "View Students" on any class
5. Expected: See full student roster

### Scenario 2: Teacher Grading
1. Login as: `john.doe@bhedu.example.com`
2. Navigate to: Classes → Mathematics 101
3. Action: Click "Assignments" → Select assignment
4. Expected: See student submissions
5. Action: Grade a submission
6. Expected: Student receives notification

### Scenario 3: Student View
1. Login as: `alice.anderson@student.bhedu.example.com`
2. Navigate to: Dashboard
3. Expected: See 4 enrolled classes
4. Action: Click "Grades"
5. Expected: See grades for all classes
6. Action: Check attendance
7. Expected: See attendance history

### Scenario 4: Finance (Admin)
1. Login as: `admin@bhedu.example.com`
2. Navigate to: Finance → Reports
3. Expected: See revenue, outstanding balances
4. Action: Click "Invoices"
5. Expected: See all student invoices
6. Action: Filter by "Unpaid"
7. Expected: See only unpaid invoices

---

## 🔐 Security Notes

- **Passwords are consistent** within each role for easy testing
- **Production**: Change all default passwords immediately
- **Service Role Key**: Only needed for user creation endpoints
- **RLS Enabled**: All data access controlled by policies

---

## 📝 Additional Test Users

To create more users:

```javascript
// scripts/create-test-users.js
const testUsers = [
  {
    email: 'newuser@example.com',
    password: 'Password123!',
    role: 'teacher', // or 'student', 'admin'
    name: 'New User Name'
  }
]
```

Then run:
```bash
node scripts/create-test-users.js
```

---

## 🆘 Troubleshooting

### Can't Login?
1. Check email spelling (include @student for students)
2. Check password (case-sensitive)
3. Verify user exists in Supabase Dashboard → Authentication
4. Check browser console for errors

### Don't See Expected Data?
1. Verify role-based RLS policies are working
2. Check if seed script ran successfully
3. Look for errors in Supabase → Logs

### Finance Data Missing?
1. Confirm student accounts were created
2. Check invoices table has records
3. Verify RLS policies allow reading for admin

---

**Print this page for quick reference during testing! 📄**
