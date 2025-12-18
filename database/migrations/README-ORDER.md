Ordering migrations
-------------------

This folder contains raw SQL migration files. The runner `scripts/run-migrations.js`
will apply files in lexicographical order. To ensure a stable order, prefix filenames
with an index or ISO date/time (e.g., `001-init.sql`, `2025-12-13-fix-schema.sql`).

Guidelines
- Prefer small, focused migrations.
- Do not put destructive operations (DROP TABLE, mass data deletions) in the same file as many constraint changes.
- Test each migration on a staging database before applying to production.

Runner
- Dry-run: `node scripts/run-migrations.js --dry-run` (no DB changes)
- Actual run: set `DATABASE_URL` env var then run `node scripts/run-migrations.js` and confirm the prompt.

Notes
- The runner is intentionally minimal. For robust production workflows, consider using a migration tool such as node-pg-migrate, Flyway, or Liquibase.
