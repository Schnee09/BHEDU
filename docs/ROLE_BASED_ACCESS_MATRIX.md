# Role-Based Access Matrix - BH-EDU

**Date**: December 9, 2025  
**Status**: ✅ FULLY IMPLEMENTED - 4-Role System

---

## 🎯 Role Hierarchy

```
👑 ADMIN (Super Admin - Owner Only)
   │
   ├── Full system access
   ├── User management (ALL roles)
   ├── System configuration
   ├── Data management & diagnostics
   ├── All finance operations
   └── Can do EVERYTHING
   
👔 STAFF (Office Staff / Sub-Admin)
   │
   ├── Student & teacher management
   ├── Class & course management
   ├── Finance operations (invoices, payments)
   ├── Attendance oversight (all classes)
   ├── View grades & reports
   ├── Data export
   ├── ❌ NO system configuration
   ├── ❌ NO user role changes
   └── ❌ NO delete critical data
   
👨‍🏫 TEACHER
   │
   ├── Own classes ONLY
   ├── Grades & attendance (own classes)
   ├── View students (own classes)
   ├── Create assignments
   └── ❌ NO admin functions
   
👨‍🎓 STUDENT
   │
   ├── Own data ONLY
   ├── View grades & attendance
   ├── View enrolled classes
   ├── QR check-in
   └── ❌ NO management access
```

---

## 📊 API Endpoints by Role

### **Admin APIs** (`/api/admin/*`)
- **Auth**: `adminAuth()` - Admin only
- **Access**: Full CRUD on all resources

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/users` | GET/POST | List/create users |
| `/api/admin/students` | GET/POST | List/create students |
| `/api/admin/teachers` | GET/POST | List/create teachers |
| `/api/admin/classes` | GET/POST | List/create classes |
| `/api/admin/courses` | GET/POST | List/create courses |
| `/api/admin/assignments` | GET/POST | Manage assignments |
| `/api/admin/enrollments` | GET/POST | Manage enrollments |
| `/api/admin/attendance` | GET/POST | All attendance |
| `/api/admin/grades` | GET/POST | All grades |
| `/api/admin/finance/*` | GET/POST | Financial management |
| `/api/admin/grading-scales` | GET/POST | Grading configuration |
| `/api/admin/academic-years` | GET/POST | Academic year config |
| `/api/admin/settings` | GET/PATCH | System settings |

### **Teacher APIs** (`/api/teacher/*`) ✨ NEW
- **Auth**: `teacherAuth()` + role check
- **Scope**: Own classes only

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/teacher/dashboard` | GET | Teacher's dashboard stats |
| `/api/teacher/classes` | GET | List teacher's classes |
| `/api/teacher/classes/[classId]` | GET/PATCH | Class details/update |
| `/api/teacher/classes/[classId]/students` | GET | Students in class |
| `/api/teacher/attendance` | GET/POST | Mark/view attendance |
| `/api/teacher/assignments` | GET/POST | Manage assignments |
| `/api/teacher/assignments/[id]` | GET/PATCH/DELETE | Assignment CRUD |
| `/api/teacher/grades` | GET/POST | Enter/view grades |

### **Student APIs** (`/api/student/*`) ✨ NEW
- **Auth**: `teacherAuth()` + role check
- **Scope**: Own data only

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/student/dashboard` | GET | Student's dashboard |
| `/api/student/classes` | GET | Enrolled classes |
| `/api/student/grades` | GET | Own grades |
| `/api/student/attendance` | GET | Own attendance |

### **Shared APIs** (`/api/*`)
- **Auth**: `teacherAuth()` with `hasAdminAccess()` check
- **Scope**: Role-based filtering

| Endpoint | Access | Behavior |
|----------|--------|----------|
| `/api/classes` | Admin/Staff/Teacher | Admin/Staff: all, Teacher: own |
| `/api/attendance` | All | Admin/Staff: all, Teacher: own classes, Student: own |
| `/api/grades` | All | Admin/Staff: all, Teacher: own classes, Student: own |
| `/api/classes/my-classes` | Teacher | Teacher's assigned classes |

---

## 🔐 Auth Function Usage

### `adminAuth(request)`
- ✅ Admin only
- Used for: `/api/admin/*` routes

### `staffAuth(request)`
- ✅ Admin + Staff
- Used for: Operational endpoints

### `teacherAuth(request)`
- ✅ Admin + Staff + Teacher + Student
- Base auth for all authenticated routes
- Specific role checks done in endpoint

### Helper Functions
```typescript
hasAdminAccess(role)    // Admin or Staff
isSuperAdmin(role)      // Admin only
canManageUsers(role)    // Admin or Staff
canAccessFinance(role)  // Admin or Staff
canConfigureSystem(role) // Admin only
```

---

## 📋 Complete Feature Access Matrix

### **User & Role Management**

| Feature | Admin | Staff | Teacher | Student |
|---------|:-----:|:-----:|:-------:|:-------:|
| Create admin users | ✅ | ❌ | ❌ | ❌ |
| Create staff users | ✅ | ❌ | ❌ | ❌ |
| Create teachers | ✅ | ✅ | ❌ | ❌ |
| Create students | ✅ | ✅ | ❌ | ❌ |
| Edit any user | ✅ | ❌ | ❌ | ❌ |
| Edit teachers/students | ✅ | ✅ | ❌ | ❌ |
| Delete users | ✅ | ❌ | ❌ | ❌ |
| Change user roles | ✅ | ❌ | ❌ | ❌ |
| Reset passwords | ✅ | ✅ | ❌ | ❌ |
| Import users | ✅ | ✅ | ❌ | ❌ |
| View all users | ✅ | ✅ | ❌ | ❌ |

### **Student Management**

| Feature | Admin | Staff | Teacher | Student |
|---------|:-----:|:-----:|:-------:|:-------:|
| View all students | ✅ | ✅ | ❌ | ❌ |
| View class roster | ✅ | ✅ | ✅ | ❌ |
| View student details | ✅ | ✅ | ✅* | ❌ |
| Edit student info | ✅ | ✅ | ❌ | ❌ |
| Import students | ✅ | ✅ | ❌ | ❌ |
| Enroll in classes | ✅ | ✅ | ❌ | ❌ |
| View own profile | ✅ | ✅ | ✅ | ✅ |

*Teachers: only students in their classes

### **Class & Course Management**

| Feature | Admin | Staff | Teacher | Student |
|---------|:-----:|:-----:|:-------:|:-------:|
| Create courses | ✅ | ✅ | ❌ | ❌ |
| Edit courses | ✅ | ✅ | ❌ | ❌ |
| Delete courses | ✅ | ❌ | ❌ | ❌ |
| Create classes | ✅ | ✅ | ❌ | ❌ |
| Edit any classes | ✅ | ✅ | ❌ | ❌ |
| Edit own class name | ✅ | ✅ | ✅ | ❌ |
| Delete classes | ✅ | ❌ | ❌ | ❌ |
| Assign teachers | ✅ | ✅ | ❌ | ❌ |
| View all classes | ✅ | ✅ | ❌ | ❌ |
| View own classes | ✅ | ✅ | ✅ | ✅ |

### **Attendance**

| Feature | Admin | Staff | Teacher | Student |
|---------|:-----:|:-----:|:-------:|:-------:|
| View all attendance | ✅ | ✅ | ❌ | ❌ |
| Mark attendance (any class) | ✅ | ✅ | ❌ | ❌ |
| Mark attendance (own class) | ✅ | ✅ | ✅ | ❌ |
| View class attendance | ✅ | ✅ | ✅* | ❌ |
| View own attendance | ✅ | ✅ | ✅ | ✅ |
| Delete attendance records | ✅ | ❌ | ✅* | ❌ |
| Generate attendance reports | ✅ | ✅ | ✅* | ❌ |

*Teachers: own classes only

### **Grades & Assignments**

| Feature | Admin | Staff | Teacher | Student |
|---------|:-----:|:-----:|:-------:|:-------:|
| View all grades | ✅ | ✅ | ❌ | ❌ |
| Create assignments (any class) | ✅ | ❌ | ❌ | ❌ |
| Create assignments (own class) | ✅ | ❌ | ✅ | ❌ |
| Edit assignments | ✅ | ❌ | ✅* | ❌ |
| Delete assignments | ✅ | ❌ | ✅* | ❌ |
| Enter grades (any class) | ✅ | ❌ | ❌ | ❌ |
| Enter grades (own class) | ✅ | ❌ | ✅ | ❌ |
| View class grades | ✅ | ✅ | ✅* | ❌ |
| View own grades | - | - | - | ✅ |
| Grade categories | ✅ | ✅ | ✅* | ❌ |

*Teachers: own classes only

### **Finance**

| Feature | Admin | Staff | Teacher | Student |
|---------|:-----:|:-----:|:-------:|:-------:|
| View all accounts | ✅ | ✅ | ❌ | ❌ |
| Create invoices | ✅ | ✅ | ❌ | ❌ |
| Record payments | ✅ | ✅ | ❌ | ❌ |
| Manage fee types | ✅ | ❌ | ❌ | ❌ |
| View financial reports | ✅ | ✅ | ❌ | ❌ |
| View own finances | - | - | - | ✅ |
| Delete financial records | ✅ | ❌ | ❌ | ❌ |

### **System Configuration**

| Feature | Admin | Staff | Teacher | Student |
|---------|:-----:|:-----:|:-------:|:-------:|
| Academic years | ✅ | ❌ | ❌ | ❌ |
| Grading scales | ✅ | ❌ | ❌ | ❌ |
| System settings | ✅ | ❌ | ❌ | ❌ |
| Data diagnostics | ✅ | ❌ | ❌ | ❌ |
| Audit logs | ✅ | ❌ | ❌ | ❌ |
| Data import/export | ✅ | ✅ | ❌ | ❌ |

---

## 🧪 Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@test.com | test123 |
| Staff | staff@test.com | test123 |
| Teacher | teacher@test.com | test123 |
| Student | student@test.com | test123 |

---

## 📁 File Structure

```
web/app/api/
├── admin/               # Admin-only routes
│   ├── users/
│   ├── students/
│   ├── teachers/
│   ├── classes/
│   ├── courses/
│   ├── assignments/
│   ├── attendance/
│   ├── grades/
│   ├── finance/
│   ├── grading-scales/
│   ├── academic-years/
│   └── settings/
│
├── teacher/             # Teacher-specific routes ✨
│   ├── dashboard/
│   ├── classes/
│   │   └── [classId]/
│   │       └── students/
│   ├── attendance/
│   ├── assignments/
│   │   └── [id]/
│   └── grades/
│
├── student/             # Student-specific routes ✨
│   ├── dashboard/
│   ├── classes/
│   ├── grades/
│   └── attendance/
│
└── (shared routes)      # Role-based filtering
    ├── classes/
    ├── attendance/
    └── grades/
```

---

## 🔧 Implementation Files

### Auth Functions
- `web/lib/auth/adminAuth.ts` - Auth functions
- `web/lib/auth/permissions.ts` - Permission system

### Types
- `web/lib/database.types.ts` - UserRole type

### Hooks
- `web/hooks/useUser.ts` - User state with role helpers

### Sidebar
- `web/components/Sidebar.tsx` - Role-based navigation
