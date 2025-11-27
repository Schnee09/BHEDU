# 🚨 VERCEL DEPLOYMENT FIX

## Problem
GitHub Actions workflow builds successfully but Vercel deployment fails with:
```
Error! Unexpected error. Please try again later. ()
```

## Root Cause
**Environment variables are not set in Vercel project dashboard.**

The build works locally and in CI because we have a `.env` file, but Vercel doesn't have access to those variables.

## ✅ Solution (3 Steps)

### Step 1: Get Your Environment Variables

Run this command to see your current values:

```bash
cd web
pnpm run check-vercel
```

This will show you exactly what to copy to Vercel.

### Step 2: Add Variables to Vercel Dashboard

1. **Go to Vercel Project Settings:**
   ```
   https://vercel.com/[your-username]/[project-name]/settings/environment-variables
   ```

2. **Add these variables for ALL environments** (Production + Preview + Development):

   ```
   Variable Name: NEXT_PUBLIC_SUPABASE_URL
   Variable Value: [copy from .env file]
   
   Variable Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
   Variable Value: [copy from .env file]
   ```

3. **Click "Save"** after adding each variable

### Step 3: Re-Deploy

**Option A: Trigger GitHub Actions**
- Go to GitHub → Actions → Re-run failed workflow
- Or push a new commit to trigger deployment

**Option B: Manual Deployment**
```bash
cd web
npx vercel --prod
```

## Verification

After deployment succeeds:
1. Visit your Vercel URL
2. Test login with: `schnee@example.com` / `Password123!`
3. Verify database connections work

## Files Updated

✅ `VERCEL_DEPLOYMENT_GUIDE.md` - Complete deployment documentation
✅ `web/scripts/check-vercel-config.js` - Helper script to verify config
✅ `web/package.json` - Added `pnpm run check-vercel` command

## Why This Happened

- ✅ Code is correct
- ✅ Build works locally
- ✅ TypeScript passes
- ✅ Next.js build succeeds
- ❌ **Vercel doesn't have environment variables**

The "Unexpected error" from Vercel CLI is misleading - it's actually just missing env vars.

## Next Steps

1. Run `cd web && pnpm run check-vercel` to see your variables
2. Copy them to Vercel dashboard (link above)
3. Re-run the deployment
4. ✨ Success!

---

**Need help?** Check `VERCEL_DEPLOYMENT_GUIDE.md` for detailed troubleshooting.
