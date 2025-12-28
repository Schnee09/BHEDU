# BH-EDU Architecture (Rev 3.0)

## 1. System Overview

**BH-EDU** is a comprehensive School Management System built for the Vietnamese education sector.

| Client | Technology | Purpose |
|--------|------------|---------|
| **Web** | Next.js 16 + React 19 | Admin, Staff, Teachers |
| **Mobile** | Flutter (planned) | Students, quick attendance |

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                           │
├─────────────────────────────────────────────────────────────┤
│  Web App (Next.js 16 App Router)                            │
│  └─ Dashboard: Grades, Attendance, Classes, Finance, etc.  │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS (REST)
┌────────────────────────┴────────────────────────────────────┐
│                      API LAYER                               │
├─────────────────────────────────────────────────────────────┤
│  Next.js API Routes (/api/*)                                │
│  └─ 21 domains: grades, attendance, classes, auth, etc.    │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│                    SERVICE LAYER                             │
├─────────────────────────────────────────────────────────────┤
│  lib/grades/       → GradeService (Vietnamese grading)      │
│  lib/attendance/   → AttendanceService                      │
│  lib/auth/         → Auth helpers                           │
│  lib/supabase/     → DB clients                             │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│                    DATABASE LAYER                            │
├─────────────────────────────────────────────────────────────┤
│  Supabase (PostgreSQL + Auth + Storage + RLS)               │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Core Domains

### Grades (Vietnamese System)
- **Evaluation Types**: Oral, 15-min, 1-period, Midterm, Final
- **Scale**: 0-10
- **Service**: `lib/grades/services/GradeService.ts`
- **Types**: `lib/grades/types.ts`

### Attendance
- **Statuses**: Present, Absent, Late, Excused
- **Service**: `lib/attendance/services/AttendanceService.ts`
- **Types**: `lib/attendance/types.ts`

---

## 4. Database Tables

| Table | Description |
|-------|-------------|
| `profiles` | User metadata (role: admin/staff/teacher/student) |
| `classes` | Class info, linked to teacher |
| `enrollments` | Student-Class relationships |
| `attendance` | Daily attendance per student/class |
| `grades` | Vietnamese grading scores |
| `subjects` | Subject definitions |
| `academic_years` | School year periods |
| `fee_types` / `payments` | Financial management |

---

## 5. Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | Next.js | 16.0.10 |
| UI Library | React | 19.2.3 |
| Styling | Tailwind CSS | 4.1.18 |
| State | React Query | 5.x |
| Database | Supabase (PostgreSQL) | 2.87.1 |
| Auth | Supabase Auth | Built-in |
| Language | TypeScript | 5.9.3 |
| Deployment | Vercel | - |

---

## 6. Directory Structure

```
web/
├── app/
│   ├── api/              # 21 API route domains
│   └── dashboard/        # 15 dashboard sections
├── components/           # Reusable UI
├── lib/
│   ├── grades/           # Grades domain (Service, Types, Validation)
│   ├── attendance/       # Attendance domain (Service, Types, Utils)
│   ├── auth/             # Auth helpers
│   └── supabase/         # DB clients
└── hooks/                # Custom React hooks
```

---

*Last Updated: December 2025*
