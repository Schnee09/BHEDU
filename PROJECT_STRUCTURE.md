# 📁 BH-EDU Project Structure

**Last Updated**: November 22, 2025  
**Status**: Organized and production-ready

---

## 🏗️ Root Structure

```
BH-EDU/
├── web/                          ← Next.js frontend application
├── supabase/                     ← Database schema and configuration
├── scripts/                      ← Utility scripts (PowerShell, JS)
├── docs/                         ← Documentation files (if any)
└── [config files]                ← package.json, .gitignore, etc.
```

---

## 📂 Detailed Breakdown

### `supabase/` - Database Files

```
supabase/
├── COMPLETE_STUDENT_MANAGEMENT.sql    ← 🎯 MAIN: Schema + RLS + Functions
├── COMPLETE_TEST_SEED.sql             ← Reference data seeding
├── VERIFY_MIGRATION.sql               ← Optional: Debugging queries
├── SQL_FILES_AUDIT.md                 ← Audit documentation
├── CONSOLIDATION_COMPLETE.md          ← Consolidation summary
├── migrations_archived/               ← Archived migrations (historical)
│   ├── README.md
│   ├── 001_schema.sql ... 046_*.sql
│   └── [50+ historical files]
└── _obsolete/                         ← Obsolete files (safe to delete later)
    ├── README.md
    ├── ADD_INSERT_POLICIES.sql
    ├── APPLY_*.sql
    ├── DISABLE_RLS_*.sql
    ├── ENABLE_RLS_*.sql
    └── create-admin-user.sql
```

**What to use:**
- ✅ **COMPLETE_STUDENT_MANAGEMENT.sql** - Apply this for fresh database
- ✅ **COMPLETE_TEST_SEED.sql** - Run after schema to add reference data
- ✅ **VERIFY_MIGRATION.sql** - For debugging/verification

**What to ignore:**
- ❌ `migrations_archived/` - Historical only, don't apply
- ❌ `_obsolete/` - Superseded files

---

### `web/` - Frontend Application

```
web/
├── app/                              ← Next.js App Router
│   ├── api/                          ← API routes (134+ endpoints)
│   ├── dashboard/                    ← Dashboard pages
│   ├── login/                        ← Auth pages
│   └── signup/
├── components/                       ← React components
│   ├── AuthGuard.tsx
│   ├── NavBar.tsx
│   ├── Header.tsx
│   └── [other components]
├── lib/                              ← Utility libraries
│   ├── supabase/                     ← Supabase clients
│   │   ├── client.ts                 ← Browser client
│   │   ├── server.ts                 ← Server client
│   │   ├── browser.ts                ← Alternative browser client
│   │   └── README.md
│   └── [other utils]
├── hooks/                            ← Custom React hooks
│   └── useProfile.ts
├── scripts/                          ← 🔧 Utility scripts
│   ├── seed.ts                       ← 🎯 MAIN: Complete seeding
│   ├── seed-auth-users.js            ← Auth users only (alternative)
│   ├── health-check.js               ← Database health check
│   ├── test-env.js                   ← Environment test
│   ├── README.md                     ← Scripts documentation
│   └── [test/debug scripts]
├── public/                           ← Static assets
├── styles/                           ← CSS/Tailwind
├── .env                              ← Environment variables (local)
├── .env.example                      ← Environment template
├── package.json                      ← Dependencies
├── tsconfig.json                     ← TypeScript config
└── next.config.js                    ← Next.js config
```

**Key Scripts:**
- ✅ **seed.ts** - Complete database seeding (users + data)
- ✅ **seed-auth-users.js** - Auth users only (simpler alternative)
- ✅ **health-check.js** - Verify database is working

---

### `scripts/` - Root Utility Scripts

```
scripts/
├── convert-api-routes.ps1            ← PowerShell utilities
├── create-test-users.ts              ← User creation
├── generate-api-key.ps1
├── post-deployment-setup.ps1
├── pre-deploy-check.ps1
├── set-vercel-org.ps1
├── test-apis.bat
├── run-migration.js
├── print-tree.js
└── [verification scripts]
```

---

## 🎯 Important Files Reference

### Database Schema
| File | Purpose | When to Use |
|------|---------|-------------|
| `COMPLETE_STUDENT_MANAGEMENT.sql` | Complete schema | Fresh database setup |
| `COMPLETE_TEST_SEED.sql` | Reference data | After schema applied |

### Seeding
| File | Purpose | Creates |
|------|---------|---------|
| `web/scripts/seed.ts` | Complete seeding | Users + Classes + Data |
| `web/scripts/seed-auth-users.js` | Auth only | Users + Profiles only |

### Supabase Clients
| File | Purpose | Use In |
|------|---------|--------|
| `web/lib/supabase/client.ts` | Browser client | Client components |
| `web/lib/supabase/server.ts` | Server client | API routes, Server components |
| `web/lib/supabase/browser.ts` | Alt browser | Alternative browser client |

---

## 🚀 Quick Start

### 1. Database Setup
```bash
# Go to Supabase Dashboard → SQL Editor
# Run: supabase/COMPLETE_STUDENT_MANAGEMENT.sql
# Run: supabase/COMPLETE_TEST_SEED.sql
```

### 2. Seed Test Data
```bash
cd web
npx tsx scripts/seed.ts
```

### 3. Run Frontend
```bash
cd web
pnpm install
pnpm dev
```

---

## 🗑️ Files Safe to Delete (After Testing)

1. **supabase/_obsolete/** - All files inside
2. **supabase/migrations_archived/** - Keep for history, or delete if space needed
3. **web/scripts/seed-auth-users.js** - If using seed.ts exclusively

---

## 📝 File Naming Conventions

- **UPPERCASE.sql** - Important schema/seed files
- **lowercase-hyphen.js/ts** - Scripts and utilities
- **PascalCase.tsx** - React components
- **camelCase.ts** - TypeScript utilities
- **_prefix/** - Internal/obsolete folders

---

## ✅ Structure Status

- ✅ All SQL files organized and consolidated
- ✅ Obsolete files moved to `_obsolete/`
- ✅ Historical migrations archived
- ✅ Scripts properly categorized
- ✅ Documentation files in place
- ✅ Clear file naming conventions

---

**Ready for deployment!** 🎉
