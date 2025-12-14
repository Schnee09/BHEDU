#!/usr/bin/env node
/*
  Simple validator: checks that referenced tables (REFERENCES public.<table>) exist in the set of migration files
  under database/migrations. Usage: node scripts/validate-migrations-schema.js
  It is a static, best-effort check (not a full SQL parser).
*/

const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'database', 'migrations');

function readFiles(dir) {
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.sql'))
    .map(f => ({ name: f, content: fs.readFileSync(path.join(dir, f), 'utf8') }));
}

function extractCreatedTables(sql) {
  const regex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?([a-zA-Z0-9_]+)/gi;
  const tables = new Set();
  let m;
  while ((m = regex.exec(sql))) {
    tables.add(m[1]);
  }
  return tables;
}

function extractReferencedTables(sql) {
  const regex = /REFERENCES\s+(?:public\.)?([a-zA-Z0-9_]+)/gi;
  const refs = new Set();
  let m;
  while ((m = regex.exec(sql))) {
    refs.add(m[1]);
  }
  return refs;
}

function main() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.error('Migrations dir not found:', MIGRATIONS_DIR);
    process.exit(2);
  }

  const files = readFiles(MIGRATIONS_DIR);
  const created = new Set();
  const referenced = new Set();

  for (const f of files) {
    const c = f.content;
    extractCreatedTables(c).forEach(t => created.add(t));
    extractReferencedTables(c).forEach(t => referenced.add(t));
  }

  // Exclude references to well-known schemas (auth) and to tables we intentionally don't create here
  const allowedExternal = new Set(['users', 'auth.users']);

  const missing = [];
  for (const r of referenced) {
    if (!created.has(r) && !allowedExternal.has(r)) missing.push(r);
  }

  if (missing.length === 0) {
    console.log('No missing referenced tables detected among migration files.');
    process.exit(0);
  }

  console.warn('Potential missing table definitions detected for the following referenced tables:');
  missing.forEach(t => console.warn(' -', t));
  console.warn('\nThis is a static check — if some referenced tables are created outside database/migrations (e.g., Supabase auth schema), they can be safely ignored.');
  process.exit(1);
}

main();
