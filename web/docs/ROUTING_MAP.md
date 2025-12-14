# Routing map (canonical)

This document defines the **single source of truth** for UI page URLs and how they relate to roles.

## ✅ Principles (use these everywhere)

1) **Plural resources**: use `/students`, `/classes`, `/courses`, etc. Avoid singular (`/student`).
2) **Role prefix only when needed**: `/dashboard/admin/*` is for admin-only tools and views.
3) **Stable list/detail patterns**:
   - List: `/resource`
   - Detail: `/resource/[id]`
   - Edit: `/resource/[id]/edit`
   - Create: `/resource/new`
4) **Legacy URLs may exist** but must redirect to canonical.
5) **No hard-coded route strings** in components/pages when practical. Prefer `web/lib/routes.ts`.

## UI routes

### Common dashboard

- `/dashboard` — home

### Students (canonical)

- `/dashboard/students` — student list
- `/dashboard/students/import` — bulk import
- `/dashboard/students/[id]` — student detail
- `/dashboard/students/[id]/edit` — edit
- `/dashboard/students/[id]/progress` — progress
- `/dashboard/students/[id]/transcript` — transcript

### Admin (admin-only tools)

- `/dashboard/admin/*` — admin section (guarded by `adminAuth()`)

#### Admin students

- `/dashboard/admin/students` — admin students index
- `/dashboard/admin/students/[id]` — admin student detail

**Legacy redirects**

- `/dashboard/admin/student` → `/dashboard/admin/students`

> Note: If we decide admins should use the standard students list, then `/dashboard/admin/students` should permanently redirect to `/dashboard/students`.

## API routes (recommended direction)

This repo currently has multiple route families:

- `/api/admin/*`
- `/api/v1/*`
- `/api/teacher/*`
- `/api/student/*`
- plus non-namespaced routes (`/api/classes`, `/api/grades`, ...)

### Recommendation

- Canonical, stable app API: **`/api/v1/*`**
- Admin-only API (service role / bypass RLS): **`/api/admin/*`**
- Teacher/student APIs only if they differ materially from v1.

### Response envelope (target)

All API endpoints should return:

- Success:
  - `{ "success": true, "data": <payload> }`
- Error:
  - `{ "success": false, "error": { "message": string, "code"?: string } }`

Until all routes are migrated, the UI fetch hooks should normalize legacy shapes.

## Ownership / where to change things

- Canonical route helpers: `web/lib/routes.ts`
- Dashboard layout (sidebar + header): `web/app/dashboard/layout.tsx`
- Admin guard: `web/app/dashboard/admin/layout.tsx`
