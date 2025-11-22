# 🎯 QUICK FIX: Add Environment Variables to Vercel

## Your Supabase Project
**Project ID:** `mwncwhkdimnjovxzhtjm`
**Region:** Asia Pacific (Singapore) - ap-southeast-1

## 📋 Copy These to Vercel Dashboard

### Step 1: Go to Vercel Environment Variables
```
https://vercel.com/[your-username]/[your-project]/settings/environment-variables
```

### Step 2: Add These Variables

For **ALL environments** (Production + Preview + Development):

**Variable 1:**
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://mwncwhkdimnjovxzhtjm.supabase.co
```

**Variable 2:**
```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: [GET THIS FROM SUPABASE DASHBOARD]
```

### Step 3: Get Your Anon Key

1. Go to: https://supabase.com/dashboard/project/mwncwhkdimnjovxzhtjm/settings/api
2. Copy the **"anon public"** key (starts with `eyJ...`)
3. Paste it as the value for `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Step 4: Save and Re-Deploy

After adding both variables:
- Go to GitHub Actions and re-run the failed workflow
- OR push a new commit to trigger deployment
- OR deploy manually: `cd web && npx vercel --prod`

## ✅ Checklist

- [ ] Added `NEXT_PUBLIC_SUPABASE_URL` to Vercel (all 3 environments)
- [ ] Added `NEXT_PUBLIC_SUPABASE_ANON_KEY` to Vercel (all 3 environments)
- [ ] Clicked "Save" in Vercel dashboard
- [ ] Re-triggered deployment

## 🚀 Expected Result

After adding the variables, the deployment should succeed and you'll see:
```
✅ Deployment Complete
🔗 https://your-project.vercel.app
```

## Test After Deployment

1. Visit your Vercel URL
2. Try logging in with: `schnee@example.com` / `Password123!`
3. Verify the dashboard loads

---

**That's it!** The "Unexpected error" is just Vercel's way of saying "missing environment variables". Once you add them, deployment will work.
