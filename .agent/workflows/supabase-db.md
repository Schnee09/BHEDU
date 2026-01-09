---
description: How to manage Supabase database with CLI commands
---

# Supabase Database Management

## Prerequisites
- Node.js 20+ required for CLI
- Docker Desktop (or compatible container runtime) for local development

## Key Commands

### Link to Remote Project
```bash
# Link local project to remote Supabase
npx supabase link --project-ref YOUR_PROJECT_REF
```

### Database Commands
```bash
# Push local migrations to remote database
npx supabase db push

# Preview changes before pushing
npx supabase db push --dry-run

# Pull remote schema changes to local
npx supabase db pull

# Create a new migration file
npx supabase migration new my_migration_name

# List migration status
npx supabase migration list

# Reset local database (applies all migrations + seed)
npx supabase db reset
```

### Seeding
- Seed file location: `supabase/seed.sql`
- Runs after migrations on `supabase start` and `supabase db reset`
- Configure multiple seed files in `config.toml`:
```toml
[db.seed]
enabled = true
sql_paths = ['./seeds/*.sql']
```

### Dump & Backup
```bash
# Dump schema diff to migration file
npx supabase db diff -f my_schema

# Dump data for seeding
npx supabase db dump --local --data-only > supabase/seed.sql
```

### Best Practices
1. Keep seed.sql data-only (no schema statements)
2. Use `--dry-run` before pushing migrations
3. Commit `supabase/` folder to version control
4. Use service role key for admin operations that bypass RLS
