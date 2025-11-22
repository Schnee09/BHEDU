# 🚨 URGENT FIX: Root Directory Error

## Error Message
```
The specified Root Directory "web" does not exist. 
Please update your Project Settings.
```

## 🔍 Root Cause
- **GitHub Actions** sets `working-directory: ./web` (deploys FROM web folder)
- **Vercel Dashboard** has Root Directory set to `web` (looking FOR web folder)
- This creates a conflict: Vercel looks for `web/web` which doesn't exist

## ✅ QUICK FIX (2 minutes)

### Step 1: Go to Vercel Project Settings
```
https://vercel.com/[your-username]/[your-project]/settings
```

### Step 2: Update Root Directory
1. Scroll to **"Root Directory"** section
2. **Clear the field** (leave it empty or set to `.`)
3. Click **"Save"**

### Step 3: Add Environment Variables (while you're there)
Go to: `Settings → Environment Variables`

Add these for **ALL 3 environments** (Production + Preview + Development):

```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://mwncwhkdimnjovxzhtjm.supabase.co

Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: [Get from Supabase dashboard]
```

### Step 4: Re-trigger Deployment
- Go to GitHub Actions
- Re-run the failed workflow
- OR push a dummy commit

## 📊 Why This Happens

**GitHub Actions Approach:**
```
Repository root/
  web/              ← GitHub Actions deploys FROM here
    package.json
    next.config.js
```

**Vercel expects:**
```
Deployment root/   ← This is already web/ folder
  package.json     ← Vercel finds these directly
  next.config.js
```

When Vercel Root Directory is set to "web", it tries to find:
```
Deployment root/
  web/             ← Doesn't exist! (we're already in web/)
    package.json
```

## ✅ Solution Summary

| Setting | Old Value | New Value |
|---------|-----------|-----------|
| Vercel Root Directory | `web` | `` (empty) or `.` |
| GitHub Actions working-directory | `./web` | `./web` (keep) |

## 🎯 After Fix

The workflow will:
1. ✅ Checkout code
2. ✅ `cd web` (via working-directory)
3. ✅ Build from web folder
4. ✅ Deploy to Vercel (no root directory specified)
5. ✅ Vercel receives the web folder content directly

---

**Next Step:** Clear the Root Directory in Vercel settings and re-run the deployment!
