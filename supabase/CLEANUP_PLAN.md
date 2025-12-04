# Supabase Directory Cleanup Plan

## Current State Analysis

### Active & Important Files (KEEP)
- ✅ `migrations/003_audit_logs.sql` - NEW audit trail system (needs to be run)
- ✅ `config.toml` - Supabase configuration
- ✅ `functions/` - Supabase Edge Functions
- ✅ `.gitignore` - Git configuration

### Files to Review & Consolidate
- 📄 `NUCLEAR_FIX_COMPLETE_REBUILD.sql` - Column additions to profiles table
- 📄 `COMPLETE_RLS_FIX.sql` - RLS policies for admin access
- 📄 `FIX_ADMIN_RLS_POLICIES.sql` - Admin RLS fixes
- 📄 `FIX_MISSING_RPC_FUNCTIONS.sql` - RPC function definitions
- 📄 `CHECK_FOREIGN_KEYS.sql` - Diagnostic script
- 📄 `CHECK_RLS_POLICIES.sql` - Diagnostic script

### Documentation (KEEP)
- 📚 `README.md`
- 📚 `QUICK_MIGRATION_GUIDE.md`
- 📚 `CONSOLIDATION_COMPLETE.md`
- 📚 `SQL_FILES_AUDIT.md`
- 📚 `README_RECOVERY.md`

### Folders to Archive/Delete
- 🗑️ `archive/` - Empty folder (DELETE)
- 🗑️ `_obsolete/` - 21 old fix scripts (DELETE - already obsolete by name)
- 🗑️ `migrations_archived/` - 50+ old migrations (ARCHIVE - may have useful reference)

---

## Recommended Actions

### Step 1: Run Essential Migration (DO THIS FIRST!)
```bash
# In Supabase SQL Editor, run:
migrations/003_audit_logs.sql
```

### Step 2: Create Final Consolidated Migration
Based on the SQL files in root, create one master migration that:
1. Ensures all columns exist in profiles table
2. Ensures all RLS policies are correct
3. Ensures all RPC functions exist
4. Can be run safely multiple times (uses IF NOT EXISTS)

### Step 3: Delete Obsolete Files
```cmd
# Delete empty archive folder
rmdir /s /q e:\TTGDBH\BH-EDU\supabase\archive

# Delete obsolete folder
rmdir /s /q e:\TTGDBH\BH-EDU\supabase\_obsolete
```

### Step 4: Archive Old Migrations
```cmd
# Already in migrations_archived/ - just keep for reference
# Or compress to .zip and delete folder
```

### Step 5: Clean Root SQL Files
After consolidating into one master migration, delete these individual fix files:
- NUCLEAR_FIX_COMPLETE_REBUILD.sql (consolidate)
- COMPLETE_RLS_FIX.sql (consolidate)
- FIX_ADMIN_RLS_POLICIES.sql (consolidate)
- FIX_MISSING_RPC_FUNCTIONS.sql (consolidate)

Keep these diagnostic scripts:
- CHECK_FOREIGN_KEYS.sql
- CHECK_RLS_POLICIES.sql

---

## After Cleanup Structure

```
supabase/
├── migrations/
│   ├── 003_audit_logs.sql           ← NEW audit system
│   └── 004_consolidated_fixes.sql   ← Future consolidated migration
├── functions/                        ← Edge functions
├── config.toml                       ← Supabase config
├── CHECK_FOREIGN_KEYS.sql           ← Diagnostic
├── CHECK_RLS_POLICIES.sql           ← Diagnostic
└── README.md                         ← Documentation
```

---

## Audit Logs Usage

The `audit_logs` table is **already in use** in these files:
- `web/lib/auditLog.ts`
- `web/lib/audit.ts`
- `web/app/api/admin/students/import/route.ts`
- `web/app/api/admin/students/[id]/route.ts`
- `web/app/api/admin/students/[id]/guardians/route.ts`
- `web/app/api/attendance/bulk/route.ts`
- `web/app/api/attendance/qr/generate/route.ts`

**So you MUST run the 003_audit_logs.sql migration!**

---

## Important Notes

1. **migrations_archived/** may contain useful SQL as reference - don't delete immediately
2. The code is already trying to insert into `audit_logs` table
3. Some root SQL files may still be useful for fixing issues
4. Always backup database before running migrations

---

## Next Steps

1. ✅ Run `migrations/003_audit_logs.sql` in Supabase NOW
2. Test that audit logging works
3. Create consolidated migration from root SQL files
4. Delete obsolete folders
5. Archive or compress old migrations
