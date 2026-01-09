#!/usr/bin/env node
/*
  Simple migration runner for raw SQL files in database/migrations.

  Usage:
    - Dry run (no DB commands executed):
        node scripts/run-migrations.js --dry-run

    - Run against a database URL (psql must be available on PATH):
        set DATABASE_URL=postgres://user:pass@host:5432/dbname
        node scripts/run-migrations.js

  The script finds all *.sql files under database/migrations, sorts them by filename,
  and executes them in order with psql -f <file>. It is intentionally minimal —
  for production use prefer a full-featured migration tool.
*/

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'database', 'migrations');

const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry-run') || argv.includes('-n');

function listSqlFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.sql'))
    .sort()
    .map(f => path.join(dir, f));
}

function runFile(filePath) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable not set. Aborting.');
    process.exit(2);
  }

  console.log(`-> Executing ${path.basename(filePath)} ...`);
  const result = spawnSync('psql', ['-v', 'ON_ERROR_STOP=1', databaseUrl, '-f', filePath], { stdio: 'inherit' });
  if (result.error) {
    console.error('Failed to run psql:', result.error);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`psql exited with status ${result.status}`);
    process.exit(result.status || 1);
  }
}

function main() {
  const files = listSqlFiles(MIGRATIONS_DIR);
  if (files.length === 0) {
    console.log('No SQL migration files found in', MIGRATIONS_DIR);
    return;
  }

  console.log('Found', files.length, 'migration file(s):');
  files.forEach(f => console.log(' -', path.basename(f)));

  if (dryRun) {
    console.log('\nDry run mode: not executing psql. To run for real, set DATABASE_URL and run without --dry-run.');
    return;
  }

  // Confirm with user
  console.log('\nAbout to run migrations in order. This will execute SQL against the database in DATABASE_URL.');
  const answer = require('readline-sync').question('Continue? (yes/no) ');
  if (answer.toLowerCase() !== 'yes') {
    console.log('Aborted by user.');
    process.exit(0);
  }

  for (const f of files) runFile(f);
  console.log('All migrations executed successfully.');
}

main();
