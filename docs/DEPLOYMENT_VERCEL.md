# Deploying to Vercel (Web + Serverless POC)

This document shows how to deploy the `web` Next.js app (with serverless API routes) to Vercel and how to set the required environment variables and secrets.

## What we added
- `web/app/api/admin/create-user/route.ts` — POC admin endpoint that creates a Supabase user using the server-side `SUPABASE_SERVICE_ROLE_KEY`.
- `web/vercel.json` — minimal Vercel config for Next.

## Required environment variables (set in Vercel Project → Settings → Environment Variables)
- `SUPABASE_URL` — your Supabase project URL (e.g. `https://xxxxx.supabase.co`).
- `SUPABASE_SERVICE_ROLE_KEY` — service role key (server-only). Do NOT expose this to the client.
- `NEXT_PUBLIC_SUPABASE_URL` — public Supabase URL (client-side).
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public anon key (client-side only).

Optional but recommended for admin endpoints:
- `INTERNAL_API_KEY` — a random secret string. The POC admin endpoint requires the HTTP header `x-internal-secret` to equal this value. This prevents accidental public access.

## How to add env vars via the Vercel CLI
1. Install / login:

```bash
npm i -g vercel
vercel login
```

2. Add production secrets:

```bash
cd web
vercel env add SUPABASE_URL production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add INTERNAL_API_KEY production
```

(You will be prompted to paste the secret values.)

## Deploying
From the `web` folder:

```bash
npx vercel --prod
```

Or use the Vercel web UI to connect the repository and enable automatic deploys on push.

## Calling the protected POC endpoint
- Endpoint (deployed): `POST https://<your-vercel-domain>/api/admin/create-user`
- Headers:
  - `Content-Type: application/json`
  - `x-internal-secret: <INTERNAL_API_KEY value>`
- Body:
```json
{ "email": "user@example.com", "password": "P@ssw0rd!" }
```

## Local development notes
- Do not put `SUPABASE_SERVICE_ROLE_KEY` into the client `.env.local`. If you want to test the POC locally, set the service role key and `INTERNAL_API_KEY` in your local environment (PowerShell example):

```powershell
$env:SUPABASE_URL="https://your.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
$env:INTERNAL_API_KEY="some-local-secret"
npm run dev
```

Then call the local route with the `x-internal-secret` header.

## Security reminders
- Never commit service role keys or place them in client-side `.env.local` files.
- Rotate service role keys immediately if accidentally exposed.
- Consider additional protections such as verifying an admin JWT, IP allowlist, rate limiting, or signing requests with a more secure method.

## Next steps
- If the POC looks good, we can port more backend endpoints into `web/app/api/*` and remove the external Node backend for those paths.
- For heavy jobs or scheduled tasks, keep using Supabase Edge Functions or a separate backend host.

## Continuous deployment via GitHub Actions

You can automate Vercel deploys from GitHub with a workflow that runs on push to `main` (production) and on pull requests (preview). The repository already contains an example workflow at `.github/workflows/deploy-vercel.yml`.

Required GitHub secrets (set in the repository settings → Secrets → Actions):
- `VERCEL_TOKEN` — create a personal token in your Vercel account (Account Settings → Tokens).
- `VERCEL_ORG_ID` — your Vercel organization ID (found in Vercel project settings or via the Vercel dashboard).
- `VERCEL_PROJECT_ID` — the Vercel project ID for your `web` app (found in Vercel project settings).

The workflow uses the `amondnet/vercel-action` action to trigger preview and production deployments. It deploys the `web` folder and respects the `INTERNAL_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and other env vars you must set in Vercel.

If you prefer the Vercel Git Integration (automatic deploys on push without extra workflow), you can also connect the GitHub repository to the Vercel project via the Vercel dashboard. The workflow is optional but gives you more control and visibility inside GitHub Actions.

