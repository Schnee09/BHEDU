# BH-EDU — School Management System

This is a modern school management system built with:
- **Frontend & API**: Next.js 14 (App Router) with built-in API routes
- **Database**: Supabase (PostgreSQL + Auth + Realtime)
- **UI**: shadcn/ui + Tailwind CSS
- **Deployment**: Vercel

## Architecture

All APIs are built as Next.js API routes in `web/app/api/`. No separate backend server needed.

Environment
-----------

- The frontend uses public keys:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

- The Supabase service role key is server-only. Store in Vercel environment variables or `.env.local` for API routes.
  - `SUPABASE_SERVICE_ROLE_KEY` (server-side only, never expose to client)

CI / GitHub Actions
-------------------

The repository includes a GitHub Actions workflow at `.github/workflows/ci.yml` that builds the web app on push and pull requests to `main`.

If you need the CI to perform operations that require the service role key, add it to GitHub Actions secrets:

1. Go to the repository Settings → Secrets and add `SUPABASE_SERVICE_ROLE_KEY`.
2. Reference it in workflows as `secrets.SUPABASE_SERVICE_ROLE_KEY` (do not echo or print the secret).

Local development
-----------------

Web (includes frontend + API routes):

```cmd
cd /d e:\TTGDBH\BH-EDU\web
npm ci
npm run build
npm run dev
```

Open http://localhost:3000 to view the application.

Security checklist
------------------

- If the service role key was ever pushed to a remote, rotate it immediately in Supabase.

## 📚 Documentation

Comprehensive documentation is available in the `/docs` folder:

- **Deployment**: See `/docs/deployment/DEPLOYMENT_GUIDE.md`
- **Quick Start**: See `/docs/guides/QUICK_START.md`
- **Testing**: See `/docs/guides/TESTING_GUIDE.md`
- **Project Plan**: See `PROJECT_ANALYSIS_AND_REWORK_PLAN.md` (root)
- **Full Documentation**: See `/docs/README.md` for complete documentation index

## 📂 Project Structure

```
BH-EDU/
├── web/                          # Next.js application
│   ├── app/                      # App Router
│   │   ├── api/                  # API routes
│   │   └── dashboard/            # Dashboard pages
│   ├── components/               # React components
│   └── lib/                      # Utilities
├── supabase/                     # Database
│   └── migrations/               # SQL migrations
├── scripts/                      # Utility scripts
├── docs/                         # Documentation
│   ├── deployment/               # Deployment guides
│   ├── guides/                   # User guides
│   └── archive/                  # Historical docs
├── README.md                     # This file
└── PROJECT_ANALYSIS_AND_REWORK_PLAN.md  # Master project plan
```
- Keep `.env.local` out of version control; use Vercel environment variables for production.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client side.
# BHEDU
