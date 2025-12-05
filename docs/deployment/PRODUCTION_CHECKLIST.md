# Production Checklist

This checklist summarizes actions taken and remaining tasks to get the BH-EDU project production-ready.

## Completed (in this branch)
- Removed secrets from `backend/.env` and added `backend/.env.example`.
- Added `web/app/api/admin/create-user/route.ts` — a POC server-side admin endpoint that uses a server-only Supabase service role key.
- Added `web/vercel.json` and `docs/DEPLOYMENT_VERCEL.md` describing Vercel deployment.
- Added GitHub Actions workflow `.github/workflows/deploy-vercel.yml` to deploy `web` to Vercel on push/PR.
- Added pre-deploy build step to the deploy workflow to run `npm run build` before deploying.
- Added Dockerfiles for both `backend` and `web` for containerized production deployment.
- Added `/health` route to the backend for liveness/readiness checks.
- Removed committed build artifacts (`backend/dist`) from the repository and added `.gitignore` entries.

## Immediate actions you must complete (requires credentials)
1. Rotate any Supabase keys that were exposed in the repository (if you pushed secrets previously).
   - Visit Supabase Dashboard → Settings → API and rotate the `SERVICE_ROLE` key.
2. Add environment variables in Vercel (Project → Settings → Environment Variables):
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `INTERNAL_API_KEY` (used to protect admin endpoints)
3. Add GitHub repository secrets (Settings → Secrets → Actions) for the deploy workflow if you plan to use it:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`

## Recommended production hardening
- Add authentication and authorization for server-side admin endpoints (prefer admin JWTs over static keys).
- Add rate-limiting (IP-based or per-key) and request validation to API routes.
- Add structured logging (e.g., Winston) and integrate Sentry for error monitoring.
- Add metrics and health checks to your orchestration platform (readiness/liveness probes).
- Use a secrets manager for backend server envs when deploying containers (e.g., Cloud Run secret manager, AWS Secrets Manager).
- Configure backup and retention policies for Supabase/Postgres and enable audit logs.
- Consolidate package manager lockfiles (prefer pnpm or npm) to avoid workspace root warnings from Next.js.

## CI / CD
- The repo contains a CI workflow that builds backend and web. It also includes a deploy workflow that triggers Vercel deploys on PRs/main.
- Consider adding pre-deploy tests, linting, and vulnerability scans to the CI workflow.

## Deployment options
- Vercel (web + serverless API routes) — recommended for consolidated deployments.
- Container (Docker) → Cloud Run / Render / Railway — recommended for persistent or heavier workloads.
- Supabase Edge Functions — recommended for DB-near serverless operations and scheduled tasks.

## How I can help next
- Harden admin endpoints (rate-limiting, require admin JWT, add audit logs).
- Add monitoring (Sentry) and create a sample alert policy.
- Convert more backend endpoints to serverless routes and remove them from the external backend.
- Create Kubernetes / Cloud Run deployment manifests and CI deploy steps.


***

If you'd like I'll proceed to harden the POC endpoint and add basic rate-limiting + request validation, then create a small Sentry integration and update the CI to run lint/test before deploy. If you want me to rotate secrets for you I will need tokens or you can rotate them yourself (recommended).
