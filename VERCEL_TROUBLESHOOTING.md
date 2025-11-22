# 🔍 Vercel Deployment Troubleshooting

## Current Issue
Deployment failing with "Unexpected error" on Vercel.

## Deployment URL
- Inspect: https://vercel.com/schnees-projects-fc5cc4c6/bhedu/36zkqvSET5QwinAmZDbMZPk9td9V
- Preview: https://bhedu-4uczj7wm1-schnees-projects-fc5cc4c6.vercel.app

## Possible Causes

### 1. Missing Environment Variables
The build might be failing because environment variables aren't set in Vercel Dashboard.

**Solution:**
1. Go to: https://vercel.com/schnees-projects-fc5cc4c6/bhedu/settings/environment-variables
2. Add these 3 variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Set for all environments: Production, Preview, Development

### 2. Vercel Project Root Configuration
The warning "The vercel.json file should be inside of the provided root directory" suggests Vercel might not be configured to use `./web` as the root.

**Solution:**
1. Go to: https://vercel.com/schnees-projects-fc5cc4c6/bhedu/settings/general
2. Under "Root Directory":
   - Click "Edit"
   - Set to: `web`
   - Click "Save"

### 3. Build Command Issue
Vercel might not be using the correct build command.

**Solution:**
1. Go to: https://vercel.com/schnees-projects-fc5cc4c6/bhedu/settings/general
2. Under "Build & Development Settings":
   - Framework Preset: `Next.js`
   - Build Command: `pnpm run build` (or override with custom)
   - Install Command: `pnpm install --frozen-lockfile`
   - Output Directory: `.next` (leave as default)

## Quick Fix Steps

1. **Set Root Directory to `web`** (Most likely fix)
2. **Add environment variables**
3. **Redeploy from Vercel Dashboard**

## Alternative: Deploy Directly from Vercel CLI

If GitHub Actions continue to fail, you can deploy directly:

```bash
cd web
npx vercel --prod
```

This will deploy directly to Vercel and show more detailed error messages.

## Check Deployment Logs

Visit the inspect URL above to see detailed build logs:
https://vercel.com/schnees-projects-fc5cc4c6/bhedu/36zkqvSET5QwinAmZDbMZPk9td9V
