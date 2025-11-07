# BACKEND_SETUP.md

## 1. Overview
This document explains how to initialize and deploy the Supabase backend for STS.

---

## 2. Folder Structure
```
backend/
├─ migrations/          # SQL schema & RLS
│  └─ 001_init.sql
├─ functions/
│  ├─ generate_ai_insight/
│  │  └─ index.ts
│  ├─ notify_updates/
│  │  └─ index.ts
│  └─ sync_attendance/
│     └─ index.ts
└─ seed/
   └─ sample_data.sql
```

---

## 3. Initialize Database
```bash
supabase db push
supabase db seed
```

**Main tables:**
- `profiles`, `classes`, `enrollments`, `attendance`, `assignments`, `scores`, `notifications`, `ai_feedback`.

**Enable RLS & example policies:**
```sql
alter table scores enable row level security;
create policy student_view_own on scores
  for select using (auth.uid() = student_id);
```

---

## 4. Edge Functions

### 4.1. `generate_ai_insight`
Generates AI summaries and recommendations.
```ts
// functions/generate_ai_insight/index.ts
import { serve } from "std/server";
serve(async (req) => {
  const { student_id } = await req.json();
  // Fetch metrics, call OpenAI, and store result in ai_feedback
  return new Response(JSON.stringify({ ok: true }));
});
```

### 4.2. `notify_updates`
Sends push/email notifications via FCM or SendGrid.

### 4.3. `sync_attendance`
Scheduled daily summary of attendance (cron trigger).

---

## 5. Environment Variables
| Name | Purpose |
|------|----------|
| SUPABASE_URL | Project URL |
| SUPABASE_SERVICE_ROLE_KEY | Full access key (server-side) |
| OPENAI_API_KEY | LLM integration |
| FCM_SERVER_KEY | Notifications |

---

## 6. Deployment
```bash
supabase functions deploy generate_ai_insight
supabase functions deploy notify_updates
supabase functions deploy sync_attendance
```

---

## 7. Testing Checklist
- [ ] Auth + RLS verified for all roles  
- [ ] CRUD API tested via Supabase SDK  
- [ ] Edge Functions deployed & callable  
- [ ] AI feedback stored in `ai_feedback` table  
- [ ] Notifications trigger confirmed  
- [ ] Backup & audit logs configured  

---

## 8. Maintenance
- Backups: daily via Supabase dashboard.  
- Logs: connect to Logflare or Sentry.  
- Versioning: migrations tracked by `supabase/migrations/`.
