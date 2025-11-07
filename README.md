# BH-EDU: Early-Stage Education Platform

A full-stack app for [e.g., backend/blockchain courses] with user auth, progress tracking, and real-time updates via Supabase.

## 🚀 Quick Start
1. Clone: `git clone https://github.com/Schnee09/BHEDU.git && cd BHEDU`
2. Install: `npm install`
3. Setup Env: Copy `.env.example` to `.env` and add Supabase URL/Keys (from supabase.com dashboard)
4. Seed Data: `npm run seed` (adds test users/courses)
5. Dev Mode: `npm run dev` (runs backend on :8080 + web on :3000)
6. Open: http://localhost:3000

## 📁 Structure
- `backend/`: Node.js/TS APIs (auth, courses endpoints)
- `web/`: Frontend (React/Vanilla JS dashboard, login)
- `supabase/`: DB migrations, edge functions, RLS policies
- `scripts/`: Utils (e.g., seed.ts for initial data)
- `docs/`: API docs, course outlines
- `.vscode/`: Workspace settings

## 🛠 Tech Stack
| Category | Tools |
|----------|-------|
| Backend | Node.js, TypeScript, Express/Fastify |
| DB/Auth | Supabase (Postgres, Realtime, Storage) |
| Frontend | [Vite/React – update as needed] |
| Dev | npm, tsx, concurrently |

## 🤖 AI Collaboration
- **Prompts for GPT/Copilot**: "Generate a Supabase auth middleware for backend/routes.ts" or "Add error handling to scripts/seed.ts for duplicate users."
- **For Grok**: Share a file URL (e.g., "Analyze https://github.com/Schnee09/BHEDU/blob/main/scripts/seed.ts").
- **Automation Idea**: New PR → Auto-review with GitHub Copilot.

## 📋 Todos (See Issues)
- Implement user signup/login
- Build course enrollment UI
- Add tests for backend

## 🤝 Contributing
1. Fork & branch: `git checkout -b feature/auth`
2. Commit: `git commit -m "feat: add login route"`
3. PR to `main`

License: MIT. Questions? Open an issue!

---
Built with ❤️ by Schnee09 | [Supabase Starter](https://supabase.com/docs/guides/getting-started)
