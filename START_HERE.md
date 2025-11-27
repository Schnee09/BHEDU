# 🚀 Quick Start - BH-EDU

Get BH-EDU running in **3 simple steps** (5 minutes total).

## Step 1: Setup Database (2 minutes)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Open your project → **SQL Editor**
3. Copy **ALL** content from `supabase/NUCLEAR_FIX_COMPLETE_REBUILD.sql`
4. Click **RUN** (Ctrl+Enter)
5. Wait for ✅ Success message

This creates:
- All database tables with correct schema
- 5 RPC functions (attendance, grades, QR codes)
- Indexes for performance
- Default data

## Step 2: Configure Environment (1 minute)

```bash
cd web
cp .env.example .env.local
```

Edit `web/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

Get these from: Supabase Dashboard → Settings → API

## Step 3: Run Development Server (30 seconds)

```bash
cd web
pnpm install  # First time only
pnpm dev
```

Open: **http://localhost:3000**

## ✅ Verify It Works

Test these pages - should load without errors:
- http://localhost:3000/dashboard
- http://localhost:3000/dashboard/users
- http://localhost:3000/dashboard/attendance/mark
- http://localhost:3000/dashboard/grades/entry
- http://localhost:3000/dashboard/finance/payments

## 🎉 You're Done!

### Next Steps

1. **Create Admin User** (if needed):
```sql
-- Run in Supabase SQL Editor
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES ('admin@bhedu.com', crypt('your_password', gen_salt('bf')), NOW());

INSERT INTO profiles (user_id, email, role, full_name, is_active)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@bhedu.com'),
  'admin@bhedu.com',
  'admin',
  'Admin User',
  true
);
```

2. **Explore the System**:
   - Login with admin credentials
   - Create students, teachers, classes
   - Mark attendance
   - Enter grades
   - Generate reports

3. **Read the Docs**:
   - `docs/QUICK_START.md` - Detailed setup
   - `docs/DEPLOYMENT.md` - Deploy to production
   - `docs/TROUBLESHOOTING.md` - Fix common issues

## 🆘 Troubleshooting

### Database errors?
- Verify SQL ran successfully (no red errors)
- Check all columns exist: `SELECT * FROM profiles LIMIT 1;`
- Re-run the SQL if needed (it's safe)

### Page shows 500 error?
- Check browser console for errors
- Verify `.env.local` has correct Supabase credentials
- Restart dev server: `Ctrl+C` then `pnpm dev`

### Lint blocking commits?
```bash
# Already fixed! But if needed:
git commit --no-verify -m "your message"
```

### Need more help?
See `docs/TROUBLESHOOTING.md` for detailed solutions.

---

**That's it!** You should have a fully working BH-EDU installation. 🎉
