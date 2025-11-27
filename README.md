# BH-EDU - Educational Management System# BH-EDU — School Management System



A comprehensive school management system built with Next.js 16, Supabase, and TypeScript.This is a modern school management system built with:

- **Frontend & API**: Next.js 14 (App Router) with built-in API routes

## 🚀 Quick Start (5 Minutes)- **Database**: Supabase (PostgreSQL + Auth + Realtime)

- **UI**: shadcn/ui + Tailwind CSS

**See `START_HERE.md` for 3-step quick setup!**- **Deployment**: Vercel



### Prerequisites## Architecture

- Node.js 20+

- pnpmAll APIs are built as Next.js API routes in `web/app/api/`. No separate backend server needed.

- Supabase account

Environment

### Setup-----------



1. **Clone and Install**- The frontend uses public keys:

```bash  - `NEXT_PUBLIC_SUPABASE_URL`

git clone https://github.com/Schnee09/BHEDU.git  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

cd BH-EDU

pnpm install- The Supabase service role key is server-only. Store in Vercel environment variables or `.env.local` for API routes.

```  - `SUPABASE_SERVICE_ROLE_KEY` (server-side only, never expose to client)



2. **Setup Database**CI / GitHub Actions

- Go to [Supabase Dashboard](https://supabase.com/dashboard)-------------------

- Create a new project  

- Open SQL EditorThe repository includes a GitHub Actions workflow at `.github/workflows/ci.yml` that builds the web app on push and pull requests to `main`.

- Copy and run ALL from `supabase/NUCLEAR_FIX_COMPLETE_REBUILD.sql`

If you need the CI to perform operations that require the service role key, add it to GitHub Actions secrets:

3. **Configure Environment**

```bash1. Go to the repository Settings → Secrets and add `SUPABASE_SERVICE_ROLE_KEY`.

cd web2. Reference it in workflows as `secrets.SUPABASE_SERVICE_ROLE_KEY` (do not echo or print the secret).

cp .env.example .env.local

```Local development

-----------------

Edit `.env.local`:

```envWeb (includes frontend + API routes):

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url

NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key```cmd

SUPABASE_SERVICE_ROLE_KEY=your_service_role_keycd /d e:\TTGDBH\BH-EDU\web

```npm ci

npm run build

4. **Run Development Server**npm run dev

```bash```

cd web

pnpm devOpen http://localhost:3000 to view the application.

```

Security checklist

Open [http://localhost:3000](http://localhost:3000)------------------



## 📁 Project Structure- If the service role key was ever pushed to a remote, rotate it immediately in Supabase.



```## 📚 Documentation

BH-EDU/

├── web/                    # Next.js frontendComprehensive documentation is available in the `/docs` folder:

│   ├── app/               # Next.js 16 App Router

│   ├── components/        # React components- **Deployment**: See `/docs/deployment/DEPLOYMENT_GUIDE.md`

│   ├── lib/               # Utilities & API clients- **Quick Start**: See `/docs/guides/QUICK_START.md`

│   └── hooks/             # Custom React hooks- **Testing**: See `/docs/guides/TESTING_GUIDE.md`

│- **Project Plan**: See `PROJECT_ANALYSIS_AND_REWORK_PLAN.md` (root)

├── supabase/              # Database & backend- **Full Documentation**: See `/docs/README.md` for complete documentation index

│   ├── NUCLEAR_FIX_COMPLETE_REBUILD.sql  # Database setup

│   ├── functions/         # Edge functions## 📂 Project Structure

│   └── migrations_archived/  # Old migrations

│```

├── docs/                  # DocumentationBH-EDU/

│   ├── QUICK_START.md     # Detailed setup guide├── web/                          # Next.js application

│   ├── DEPLOYMENT.md      # Production deployment│   ├── app/                      # App Router

│   ├── TROUBLESHOOTING.md # Common issues│   │   ├── api/                  # API routes

│   └── README.md          # Docs index│   │   └── dashboard/            # Dashboard pages

││   ├── components/               # React components

└── scripts/               # Utility scripts│   └── lib/                      # Utilities

```├── supabase/                     # Database

│   └── migrations/               # SQL migrations

## ✨ Features├── scripts/                      # Utility scripts

├── docs/                         # Documentation

### Core Modules│   ├── deployment/               # Deployment guides

- **👥 User Management** - Students, teachers, admins│   ├── guides/                   # User guides

- **📚 Academic Management** - Classes, subjects, schedules│   └── archive/                  # Historical docs

- **📝 Attendance Tracking** - Manual & QR code check-in├── README.md                     # This file

- **📊 Grades & Assignments** - Grade entry, calculations, reports└── PROJECT_ANALYSIS_AND_REWORK_PLAN.md  # Master project plan

- **💰 Financial Management** - Fees, payments, invoices```

- **📈 Analytics & Reports** - Comprehensive reporting- Keep `.env.local` out of version control; use Vercel environment variables for production.

- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client side.

### Technical Features# BHEDU

- **🔐 Authentication** - Supabase Auth with role-based access
- **🎨 Modern UI** - Tailwind CSS, responsive design
- **⚡ Fast** - Next.js 16 with Turbopack
- **🔄 Real-time** - Supabase realtime subscriptions
- **📱 Mobile Ready** - PWA support
- **🧪 Tested** - Jest & React Testing Library

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Styling**: Tailwind CSS 4
- **State**: React hooks + Supabase queries
- **Testing**: Jest, React Testing Library
- **Deployment**: Vercel

## 📖 Documentation

- **[Quick Start](START_HERE.md)** - 3-step quick setup ⭐
- **[Detailed Setup](docs/QUICK_START.md)** - Comprehensive guide
- **[Deployment](docs/DEPLOYMENT.md)** - Deploy to production
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues & fixes
- **[Development](docs/DEVELOPMENT.md)** - Development workflow
- **[All Docs](docs/README.md)** - Documentation index

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software developed for BH-EDU.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/Schnee09/BHEDU/issues)
- **Docs**: Check `docs/` folder
- **Quick Fix**: See `START_HERE.md`

## 🎯 Current Status

✅ **Ready for Development**
- All database migrations complete
- Core modules implemented
- Authentication working
- ESLint configured
- Tests setup
- Documentation consolidated

## 🔄 Latest Updates

**November 2025**
- ✅ Database schema finalized
- ✅ All RPC functions created
- ✅ TypeScript errors resolved
- ✅ ESLint configuration optimized
- ✅ Production-ready codebase
- ✅ Major documentation cleanup (168 files → 8 essential docs)

---

**Need help?** Start with `START_HERE.md` for a 3-step quick setup!
