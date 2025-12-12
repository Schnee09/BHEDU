#!/usr/bin/env node

/**
 * Generate placeholder migration files for already-applied remote migrations
 * This syncs the local migrations directory with the remote Supabase history
 */

const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, 'migrations');

// Migrations that exist on remote but not locally
const missingMigrations = [
  '001', '002', '005', '006', '007', '008', '009',
  '011', '012', '013', '014', '015', '016', '017', '018', '019', '020',
  '021', '022', '023', '024', '025', '026', '027', '028', '029', '030',
  '031', '032', '033', '034', '037', '039', '040',
  '041', '042', '043', '044', '045', '046',
  '20251119', '20251120'
];

console.log('🔧 Creating placeholder migration files...\n');

let created = 0;

for (const migration of missingMigrations) {
  const filename = `${migration}_remote_migration.sql`;
  const filepath = path.join(migrationsDir, filename);
  
  // Check if file already exists
  if (fs.existsSync(filepath)) {
    console.log(`⏭️  Skipping ${filename} (already exists)`);
    continue;
  }
  
  // Create placeholder content
  const content = `-- Migration: ${migration}
-- Description: This migration was already applied remotely
-- Status: Applied on remote Supabase database
-- Note: This is a placeholder file to sync local migration history

-- This migration has already been executed on the remote database.
-- The actual schema changes are reflected in the current database state.
-- This file exists only to maintain migration history consistency.

-- No operations needed
SELECT 1;
`;
  
  fs.writeFileSync(filepath, content, 'utf-8');
  console.log(`✅ Created: ${filename}`);
  created++;
}

console.log(`\n✨ Done! Created ${created} placeholder files.`);
console.log('\nNow you can run: npx supabase db push');
console.log('Future migrations will work smoothly! 🚀');
