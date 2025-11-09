# BH-EDU — Local dev notes

This repository contains two apps:

- `backend` — Node + TypeScript server using Supabase (server-side).
- `web` — Next.js frontend.

Environment
-----------

- The frontend should only use public keys:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

- The Supabase service role key is a server-only secret. Do NOT store it in client env files.
  - Put the service role key in the backend environment as `SUPABASE_SERVICE_ROLE_KEY`.
  - Use `backend/.env.example` as a template. Do not commit real secrets.

CI / GitHub Actions
-------------------

The repository includes a GitHub Actions workflow at `.github/workflows/ci.yml` that builds the backend and the web app on push and pull requests to `main`.

If you need the CI to perform operations that require the service role key, add it to GitHub Actions secrets:

1. Go to the repository Settings → Secrets and add `SUPABASE_SERVICE_ROLE_KEY`.
2. Reference it in workflows as `secrets.SUPABASE_SERVICE_ROLE_KEY` (do not echo or print the secret).

Local development
-----------------

Backend:

```cmd
cd /d e:\TTGDBH\BH-EDU\backend
pnpm install
pnpm run typecheck
pnpm run build
pnpm run dev
```

Web:

```cmd
cd /d e:\TTGDBH\BH-EDU\web
npm ci
npm run build
npm run dev
```

Security checklist
------------------

- If the service role key was ever pushed to a remote, rotate it immediately in Supabase.
- Keep `backend/.env` out of version control; prefer platform secrets or GitHub Actions secrets.

If you want, I can also add an example GitHub Actions step showing how to inject the secret into the backend job (without printing it). Say the word and I'll add it.
# BHEDU
