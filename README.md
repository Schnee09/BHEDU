# BH-EDU — School Management System# BH-EDU - Educational Management System# BH-EDU — School Management System



A comprehensive school management system built with Next.js 16, Supabase, and TypeScript.



---A comprehensive school management system built with Next.js 16, Supabase, and TypeScript.This is a modern school management system built with:



## 🚀 Quick Start- **Frontend & API**: Next.js 14 (App Router) with built-in API routes



**See [START_HERE.md](START_HERE.md) for 3-step quick setup!**## 🚀 Quick Start (5 Minutes)- **Database**: Supabase (PostgreSQL + Auth + Realtime)



### Prerequisites- **UI**: shadcn/ui + Tailwind CSS

- Node.js 20+

- pnpm**See `START_HERE.md` for 3-step quick setup!**- **Deployment**: Vercel

- Supabase account



### Setup

### Prerequisites## Architecture

```bash

# 1. Clone and install- Node.js 20+

git clone https://github.com/Schnee09/BHEDU.git

cd BH-EDU- pnpmAll APIs are built as Next.js API routes in `web/app/api/`. No separate backend server needed.

pnpm install

- Supabase account

# 2. Configure environment

cp web/.env.example web/.env.localEnvironment

# Edit web/.env.local with your Supabase credentials

### Setup-----------

# 3. Run development server

cd web

pnpm dev

```1. **Clone and Install**- The frontend uses public keys:



---```bash  - `NEXT_PUBLIC_SUPABASE_URL`



## 🏗️ Architecturegit clone https://github.com/Schnee09/BHEDU.git  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`



| Layer | Technology |cd BH-EDU

|-------|------------|

| **Frontend** | Next.js 16 (App Router) |pnpm install- The Supabase service role key is server-only. Store in Vercel environment variables or `.env.local` for API routes.

| **API** | Next.js API Routes |

| **Database** | Supabase (PostgreSQL) |```  - `SUPABASE_SERVICE_ROLE_KEY` (server-side only, never expose to client)

| **Auth** | Supabase Auth |

| **UI** | Tailwind CSS + shadcn/ui |

| **Deployment** | Vercel |

2. **Setup Database**CI / GitHub Actions

All APIs are Next.js API routes in `web/app/api/`. No separate backend server needed.

- Go to [Supabase Dashboard](https://supabase.com/dashboard)-------------------

---

- Create a new project  

## 📁 Project Structure

- Open SQL EditorThe repository includes a GitHub Actions workflow at `.github/workflows/ci.yml` that builds the web app on push and pull requests to `main`.

```

BH-EDU/- Copy and run ALL from `supabase/NUCLEAR_FIX_COMPLETE_REBUILD.sql`

├── docs/                    # 📚 All documentation

│   ├── api/                 # API documentationIf you need the CI to perform operations that require the service role key, add it to GitHub Actions secrets:

│   ├── architecture/        # System design

│   ├── auth/                # Authentication guides3. **Configure Environment**

│   ├── database/            # Database & migrations

│   ├── deployment/          # Production guides```bash1. Go to the repository Settings → Secrets and add `SUPABASE_SERVICE_ROLE_KEY`.

│   ├── guides/              # Developer guides

│   ├── modernization/       # Dashboard modernization ⭐cd web2. Reference it in workflows as `secrets.SUPABASE_SERVICE_ROLE_KEY` (do not echo or print the secret).

│   └── status/              # Project status reports

├── scripts/                 # Utility scriptscp .env.example .env.local

├── supabase/                # Database migrations

└── web/                     # Next.js application```Local development

    ├── app/                 # App router pages

    │   ├── api/             # API routes-----------------

    │   └── dashboard/       # Dashboard pages

    ├── components/          # React componentsEdit `.env.local`:

    ├── hooks/               # Custom hooks

    └── lib/                 # Utilities```envWeb (includes frontend + API routes):

```

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url

---

NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key```cmd

## 📚 Documentation

SUPABASE_SERVICE_ROLE_KEY=your_service_role_keycd /d e:\TTGDBH\BH-EDU\web

All documentation is in the [`docs/`](docs/) folder:

```npm ci

| Topic | Location |

|-------|----------|npm run build

| **Quick Start** | [docs/guides/](docs/guides/) |

| **Architecture** | [docs/architecture/](docs/architecture/) |4. **Run Development Server**npm run dev

| **Authentication** | [docs/auth/](docs/auth/) |

| **Database** | [docs/database/](docs/database/) |```bash```

| **Deployment** | [docs/deployment/](docs/deployment/) |

| **Dashboard Modernization** | [docs/modernization/](docs/modernization/) |cd web

| **Project Status** | [docs/status/](docs/status/) |

pnpm devOpen http://localhost:3000 to view the application.

See [docs/README.md](docs/README.md) for complete documentation index.

```

---

Security checklist

## ⭐ Current Project: Dashboard Modernization

Open [http://localhost:3000](http://localhost:3000)------------------

We're modernizing 18+ dashboard pages using a reusable component library.



**Status**: Phase 1 Complete ✅

## 📁 Project Structure- If the service role key was ever pushed to a remote, rotate it immediately in Supabase.

| Metric | Value |

|--------|-------|

| Pages to modernize | 18+ |

| Components built | 7 |```## 📚 Documentation

| Hooks built | 5 |

| Expected code reduction | 64% |BH-EDU/



See [docs/modernization/](docs/modernization/) for details.├── web/                    # Next.js frontendComprehensive documentation is available in the `/docs` folder:



---│   ├── app/               # Next.js 16 App Router



## 🔧 Environment Variables│   ├── components/        # React components- **Deployment**: See `/docs/deployment/DEPLOYMENT_GUIDE.md`



```bash│   ├── lib/               # Utilities & API clients- **Quick Start**: See `/docs/guides/QUICK_START.md`

# Required

NEXT_PUBLIC_SUPABASE_URL=your-supabase-url│   └── hooks/             # Custom React hooks- **Testing**: See `/docs/guides/TESTING_GUIDE.md`

NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Server only!│- **Project Plan**: See `PROJECT_ANALYSIS_AND_REWORK_PLAN.md` (root)

```

├── supabase/              # Database & backend- **Full Documentation**: See `/docs/README.md` for complete documentation index

---

│   ├── NUCLEAR_FIX_COMPLETE_REBUILD.sql  # Database setup

## 🧪 Testing

│   ├── functions/         # Edge functions## 📂 Project Structure

```bash

cd web│   └── migrations_archived/  # Old migrations

pnpm test        # Run tests

pnpm lint        # Run linter│```

pnpm build       # Build for production

```├── docs/                  # DocumentationBH-EDU/



---│   ├── QUICK_START.md     # Detailed setup guide├── web/                          # Next.js application



## 🚀 Deployment│   ├── DEPLOYMENT.md      # Production deployment│   ├── app/                      # App Router



The app is configured for Vercel deployment:│   ├── TROUBLESHOOTING.md # Common issues│   │   ├── api/                  # API routes



1. Push to `main` branch│   └── README.md          # Docs index│   │   └── dashboard/            # Dashboard pages

2. Vercel auto-deploys

3. Add environment variables in Vercel dashboard││   ├── components/               # React components



See [docs/deployment/](docs/deployment/) for production guides.└── scripts/               # Utility scripts│   └── lib/                      # Utilities



---```├── supabase/                     # Database



## 📊 Tech Stack│   └── migrations/               # SQL migrations



- **Framework**: Next.js 16.0.7 (Turbopack)## ✨ Features├── scripts/                      # Utility scripts

- **Language**: TypeScript 5.9.3

- **Runtime**: React 19.1.0├── docs/                         # Documentation

- **Database**: Supabase (PostgreSQL)

- **Auth**: Supabase Auth### Core Modules│   ├── deployment/               # Deployment guides

- **Styling**: Tailwind CSS 4

- **Icons**: Heroicons- **👥 User Management** - Students, teachers, admins│   ├── guides/                   # User guides

- **Charts**: Recharts

- **📚 Academic Management** - Classes, subjects, schedules│   └── archive/                  # Historical docs

---

- **📝 Attendance Tracking** - Manual & QR code check-in├── README.md                     # This file

## 📞 Support

- **📊 Grades & Assignments** - Grade entry, calculations, reports└── PROJECT_ANALYSIS_AND_REWORK_PLAN.md  # Master project plan

1. Check [docs/](docs/) for documentation

2. Check [START_HERE.md](START_HERE.md) for quick setup- **💰 Financial Management** - Fees, payments, invoices```

3. Check [docs/status/](docs/status/) for project status

- **📈 Analytics & Reports** - Comprehensive reporting- Keep `.env.local` out of version control; use Vercel environment variables for production.

---

- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client side.

**Last Updated**: December 9, 2025

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
