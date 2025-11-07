# ARCHITECTURE.md (Rev 2.0 - Hybrid Monorepo)

## 1. System Overview
The Student Tracking System (STS) uses a **Supabase backend** and a **Hybrid Monorepo strategy**:
- **Web (Next.js/React + Tailwind):** Admin & Teachers. Optimized for data grids, analytics.
- **Mobile (Flutter + Supabase SDK):** Students & quick Teacher tools (attendance, scores).

---

## 2. Architecture Diagram (Hybrid)
```
                    ┌──────────────────────────────┐
                    │         CLIENT LAYER         │
                    ├──────────────────────────────┤
                    │  Web (Next.js + React)       │
                    │  Mobile (Flutter + Dart)     │
                    └────────────┬─────────────────┘
                                 │
                      HTTPS (REST + WebSocket)
                                 │
                    ┌──────────────────────────────┐
                    │        BACKEND LAYER         │
                    ├──────────────────────────────┤
                    │  Supabase (PostgreSQL)       │
                    │  Supabase Auth & Storage     │
                    │  Edge Functions (serverless) │
                    └────────────┬─────────────────┘
                                 │
                    ┌──────────────────────────────┐
                    │     ANALYTICS & AI LAYER     │
                    ├──────────────────────────────┤
                    │  Python / OpenAI / Gemini    │
                    │  RPC connection via Supabase │
                    └──────────────────────────────┘
```

---

## 3. Core Database Tables
| Table | Description |
|--------|-------------|
| `profiles` | Extended user metadata linked to `auth.users`. |
| `classes` | Class/course information (teacher, schedule). |
| `enrollments` | Many-to-many between students and classes. |
| `attendance` | Daily attendance tracking. |
| `assignments` | Homework/project details. |
| `scores` | Grades linked to assignments and students. |
| `notifications` | Alerts and announcements. |
| `ai_feedback` | AI-generated insights and reports. |

---

## 4. Development Phases
| Phase | Deliverable | Note |
|--------|--------------|------|
| 1 (Core) | Auth + DB/RLS setup + Web CRUD | Secure foundation |
| 1 | AI Analytics Beta (`ai_feedback`) | Edge Function trigger |
| 2 | Mobile MVP (Flutter) | Student portal |
| 2 | Teacher Dashboard (Web) | Reporting, PDF export |
| 3 | AI Optimization + Scaling | Production integration |
| 3 | Notifications & Caching | Real-time alerts |

---

## 5. Tech Stack Summary
- **Frontend Web:** Next.js (React) + Tailwind
- **Frontend Mobile:** Flutter
- **Backend:** Supabase (Auth, DB, Storage, Edge Functions)
- **AI Layer:** Python + OpenAI / Gemini API
- **Deployment:** Vercel (Web), Play Store / TestFlight (Mobile)
- **Monitoring:** Supabase logs + Sentry
