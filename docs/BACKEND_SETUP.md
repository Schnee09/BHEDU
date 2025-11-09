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

## 6.1. Deploying the Web + Backend on Vercel (recommended flow)

There are two pragmatic ways to host the project when using Vercel for the `web` app:

Option A — Web on Vercel, backend (Supabase + Node) elsewhere (fastest)
- Deploy the `web` (Next.js) app to Vercel.
- Keep Supabase for DB/Auth/Edge Functions.
- Keep the existing `backend/` Node/Express app deployed to a managed host (Render, Railway, Cloud Run, etc.) if you use privileged keys or heavier server logic.
- In Vercel set the public env vars for the client only (anon key + url) and set `BACKEND_URL` pointing to your API host.

Option B — Migrate privileged endpoints into Vercel Serverless (single-host)
- Port only the privileged or small server endpoints (those that require `SUPABASE_SERVICE_ROLE_KEY` or perform integrations) into Next API routes or Vercel Serverless Functions inside the `web` project.
- Store `SUPABASE_SERVICE_ROLE_KEY` and other secrets as Vercel Environment Variables (Project → Settings → Environment Variables) so they are available to serverless functions but not to the browser.
- This reduces infra maintenance and keeps frontend + serverless together on Vercel.

Notes on choosing:
- If you need long-running processes or heavy background jobs, keep the Node backend on a host that supports persistent processes (Cloud Run / Render / Railway).
- If server endpoints are small and latency-sensitive, Vercel serverless + Supabase Edge Functions is a very convenient hybrid.

### Vercel environment variables (example)
Set these in the Vercel dashboard or via the CLI (production/staging/dev as appropriate):

```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key   # client-safe
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key   # server-only (do NOT expose to client)
BACKEND_URL=https://api.myapp.example    # if you keep external backend
OPENAI_API_KEY=...
```

Add via CLI:
```bash
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add SUPABASE_URL production
vercel env add SUPABASE_ANON_KEY production
```

### Example: Next API route that uses the Service Role key (server-side only)
Place this in `web/src/pages/api/adminCreateUser.ts` (or in the App Router `app/api/...` route):

```ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { email, password } = req.body;
  const { data, error } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) return res.status(400).json({ error: error.message });
  return res.status(200).json(data);
}
```

This API runs server-side on Vercel and may safely use the service role key (keep that env var secret in Vercel).

### Optional `vercel.json` (rewrites / redirects)
If you need to add rewrites or custom routing, create `vercel.json` in the `web` project root. Example:

```json
{
  "version": 2,
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" }
  ]
}
```

### Deploying from CLI (quick)
From the `web` folder:

```bash
npm i -g vercel   # or use npx vercel
vercel login
vercel --prod
```

If you keep an external `backend` service, set `BACKEND_URL` in Vercel and update the client to call `${process.env.NEXT_PUBLIC_BACKEND_URL}`.

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
