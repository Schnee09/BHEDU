# Vercel Deployment Guide

## Current Issue
The GitHub Actions workflow builds successfully but fails during Vercel deployment with:
```
Error! Unexpected error. Please try again later. ()
```

## Root Cause
This error typically occurs when:
1. **Environment variables are not set in Vercel dashboard** (most likely)
2. Vercel API is experiencing temporary issues
3. The project has exceeded resource limits

## Solution Steps

### Step 1: Set Environment Variables in Vercel Dashboard

Go to your Vercel project settings and add these environment variables:

#### Required Variables:
```
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
```

#### Optional but Recommended:
```
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

#### Where to Add:
1. Go to https://vercel.com/[your-username]/[project-name]/settings/environment-variables
2. Add each variable for **Production**, **Preview**, and **Development** environments
3. Click "Save"

### Step 2: Verify Vercel Project Settings

Make sure:
- ✅ Framework Preset: **Next.js**
- ✅ Root Directory: `web`
- ✅ Build Command: `pnpm run build`
- ✅ Install Command: `pnpm install --frozen-lockfile`
- ✅ Output Directory: `.next`

### Step 3: Re-trigger Deployment

After setting environment variables:
1. Go to GitHub Actions
2. Re-run the failed workflow
3. Or push a new commit to trigger deployment

### Step 4: Manual Deployment (Alternative)

If GitHub Actions continues to fail, deploy manually:

```bash
cd web
npx vercel --prod
```

This will:
1. Prompt you to login to Vercel
2. Link to your project
3. Deploy directly

## Troubleshooting

### Error: "Unexpected error. Please try again later."
**Solution:** This is usually environment variables. Check step 1 above.

### Error: "Build failed"
**Solution:** Run `pnpm run build` locally first to debug.

### Error: "Module not found"
**Solution:** Verify all import paths use `@/lib/supabase/browser` for client components.

### Error: "Permission denied"
**Solution:** Make sure `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` are set in GitHub Secrets.

## Environment Variables Source

Get these values from your Supabase project:
1. Go to https://supabase.com/dashboard/project/[your-project]/settings/api
2. Copy **URL** → `NEXT_PUBLIC_SUPABASE_URL`
3. Copy **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Verification

After successful deployment:
1. Visit your Vercel URL
2. Test login with seeded users:
   - `schnee@example.com` (password: Password123!)
   - `admin@example.com` (password: Password123!)
3. Verify database connections work
4. Check browser console for any errors

## Next Steps

Once deployed:
- [ ] Set up custom domain (optional)
- [ ] Configure preview deployments
- [ ] Set up monitoring/analytics
- [ ] Update CORS settings in Supabase if needed
