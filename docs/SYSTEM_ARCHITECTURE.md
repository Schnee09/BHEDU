# BH-EDU System Architecture - How It Works

## 🔄 Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        LOGIN FLOW                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. User enters email/password                                  │
│                     ↓                                           │
│  2. supabase.auth.signInWithPassword()                         │
│                     ↓                                           │
│  3. Supabase returns auth.users.id as session.user.id          │
│                     ↓                                           │
│  4. Query profiles WHERE user_id = session.user.id             │
│     ⚠️ Login page INCORRECTLY uses .eq("id", user.id)          │
│                     ↓                                           │
│  5. Get profile.role → redirect based on role                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 📊 Database Schema Issue

### Current State
```
auth.users                    profiles
┌────────────────────┐       ┌─────────────────────────┐
│ id (UUID)          │───┐   │ id (UUID)              │ ← NOT the same as auth.users.id!
│ email              │   │   │ user_id (UUID) ────────│─┘ This links to auth.users.id
│ encrypted_password │   │   │ email                  │
└────────────────────┘   │   │ role                   │
                         │   │ full_name              │
                         └──→│ ...                    │
                             └─────────────────────────┘
```

### The Problem
- `profiles.id` is the profile's own UUID (auto-generated)
- `profiles.user_id` links to `auth.users.id`
- **BUT** some code queries by `profiles.id` expecting it to equal `auth.users.id`

## 🐛 Bugs Found

### Bug 1: Login Page (CRITICAL)
**File**: `web/app/(auth)/login/page.tsx`
```typescript
// WRONG - queries by profile's own id
.eq("id", data.user?.id)

// CORRECT - should query by user_id
.eq("user_id", data.user?.id)
```

### Bug 2: Some Profiles Missing user_id
Some profiles have `user_id: null` which means:
- They were created without linking to auth.users
- The user cannot login because profile lookup fails

### Bug 3: Duplicate Profiles
Multiple profiles exist for the same email address, causing:
- Confusion about which profile is correct
- Potential data inconsistency

## ✅ Correct Patterns in Codebase

### adminAuth.ts (CORRECT)
```typescript
.eq('user_id', user.id)  // ✅ Uses user_id
```

### useProfile.ts (CORRECT)
```typescript
.eq("user_id", session.user.id)  // ✅ Uses user_id
```

### /api/auth/me (CORRECT)
```typescript
.eq('user_id', user.id)  // ✅ Uses user_id
```

## 🔧 Required Fixes

### 1. Fix Login Page
Change profile lookup to use `user_id`:
```typescript
const { data: profileRow } = await supabase
  .from("profiles")
  .select("role")
  .eq("user_id", data.user?.id)  // Changed from "id"
  .single();
```

### 2. Clean Up Duplicate Profiles
```sql
-- Find duplicates
SELECT email, COUNT(*) FROM profiles GROUP BY email HAVING COUNT(*) > 1;

-- Delete profiles with null user_id (orphans)
DELETE FROM profiles WHERE user_id IS NULL;
```

### 3. Ensure All Auth Users Have Profiles
When creating users, always:
1. Create auth user
2. Create profile with `user_id = auth.users.id`

## 🏗️ Recommended Architecture

### Option A: Keep Separate IDs (Current)
```
profiles.id = unique profile UUID
profiles.user_id = auth.users.id (foreign key)
```
**Rule**: Always query by `user_id` when looking up by authenticated user

### Option B: Use Same ID (Simpler)
```
profiles.id = auth.users.id (same as auth user)
profiles.user_id = removed (redundant)
```
**Pros**: Simpler queries, no confusion
**Cons**: Requires migration

## 📁 Files to Fix

| File | Issue | Fix |
|------|-------|-----|
| `web/app/(auth)/login/page.tsx` | Uses `.eq("id", ...)` | Change to `.eq("user_id", ...)` |
| `scripts/seed-test-users.js` | May create duplicate profiles | Add duplicate check |
| Database | Orphan profiles with `user_id: null` | Clean up |
| Database | Duplicate profiles | Clean up |

## 🔐 Role-Based Access Summary

### How Roles Work
1. User logs in → gets session with `auth.users.id`
2. Fetch profile by `user_id` → get `role`
3. API routes check role:
   - `adminAuth()` → requires `role = 'admin'`
   - `staffAuth()` → requires `role IN ('admin', 'staff')`
   - `teacherAuth()` → requires `role IN ('admin', 'staff', 'teacher', 'student')`

### Role Permissions
| Role | Access |
|------|--------|
| admin | Everything |
| staff | Most things except system config |
| teacher | Own classes only |
| student | Own data only |
