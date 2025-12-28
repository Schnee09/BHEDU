/**
 * scripts/sync-supabase.ts
 * Sync local code with Supabase database
 * 
 * This script:
 * 1. Generates TypeScript types from remote Supabase database
 * 2. Validates the types were generated
 * 3. Shows summary of tables and columns
 * 
 * Run with: npx tsx scripts/sync-supabase.ts
 * 
 * BEST PRACTICE:
 * Run this script after any changes to Supabase Dashboard
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const TYPES_FILE = path.join(__dirname, "..", "lib", "database.types.ts");
const ROOT_DIR = path.join(__dirname, "..", "..");

async function main() {
  console.log("🔄 Syncing with Supabase...\n");

  // Step 1: Generate types
  console.log("📝 Generating TypeScript types from remote database...");
  try {
    execSync(`npx supabase gen types typescript --linked > "${TYPES_FILE}"`, {
      cwd: ROOT_DIR,
      stdio: "inherit",
      encoding: "utf8",
    });
    console.log("  ✅ Types generated\n");
  } catch (error) {
    console.error("  ❌ Failed to generate types");
    console.error("  Make sure you're logged in: npx supabase login");
    console.error("  And project is linked: npx supabase link");
    process.exit(1);
  }

  // Step 2: Validate file exists and has content
  console.log("🔍 Validating generated types...");
  if (!fs.existsSync(TYPES_FILE)) {
    console.error("  ❌ Types file not created");
    process.exit(1);
  }

  const content = fs.readFileSync(TYPES_FILE, "utf8");
  if (content.length < 100) {
    console.error("  ❌ Types file is too small (may be empty)");
    process.exit(1);
  }
  console.log(`  ✅ Types file: ${(content.length / 1024).toFixed(1)} KB\n`);

  // Step 3: Extract and show table names
  console.log("📋 Tables found in schema:");
  const tableMatches = content.match(/(\w+): \{[\s\S]*?Row:/g);
  if (tableMatches) {
    const tables = tableMatches
      .map((m) => m.split(":")[0].trim())
      .filter((t) => t !== "Row" && t !== "Insert" && t !== "Update");
    
    const uniqueTables = [...new Set(tables)];
    uniqueTables.forEach((t) => console.log(`  • ${t}`));
    console.log(`\n  Total: ${uniqueTables.length} tables`);
  }

  console.log("\n✨ Sync complete!");
  console.log("\nNext steps:");
  console.log("  1. Import types: import { Database } from '@/lib/database.types'");
  console.log("  2. Use in Supabase client for type safety");
  console.log("  3. Re-run this script after any DB schema changes");
}

main().catch(console.error);
