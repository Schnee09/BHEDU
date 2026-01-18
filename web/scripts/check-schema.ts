/**
 * Check Database Schema Script
 * Shows all tables, columns, and constraints
 *
 * Run: npx tsx scripts/check-schema.ts
 */

import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, "..", ".env.local") });
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

async function main() {
  console.log("🔍 Database Schema Check\n");
  console.log("=".repeat(60));

  // Check key tables
  const tables = [
    "profiles",
    "classes",
    "subjects",
    "enrollments",
    "timetable_slots",
    "timetable_weekly_notes",
    "grades",
    "attendance",
    "rooms",
    "semesters",
  ];

  for (const table of tables) {
    console.log(`\n📋 Table: ${table}`);
    console.log("-".repeat(40));

    // Try to select 1 row to see columns
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .limit(1);

    if (error) {
      console.log(`  ❌ Error: ${error.message}`);
      continue;
    }

    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      console.log(`  Columns (${columns.length}):`);
      columns.forEach((col) => console.log(`    - ${col}`));
    } else {
      console.log(`  (No data, cannot infer columns)`);

      // Try insert with empty to see schema
      const { error: insertError } = await supabase
        .from(table)
        .insert({});

      if (insertError) {
        // Parse error to get column info
        const msg = insertError.message;
        console.log(`  Schema hint from error: ${msg.slice(0, 100)}`);
      }
    }
  }

  // Count data in each table
  console.log("\n\n📊 DATA COUNTS:");
  console.log("-".repeat(40));

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });

    if (error) {
      console.log(`  ${table}: ERROR`);
    } else {
      console.log(`  ${table}: ${count || 0} rows`);
    }
  }

  // Check profiles columns specifically
  console.log("\n\n👤 PROFILES SAMPLE:");
  console.log("-".repeat(40));
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .limit(3);

  if (profiles && profiles.length > 0) {
    console.log("Columns:", Object.keys(profiles[0]).join(", "));
    profiles.forEach((p) =>
      console.log(`  ${p.role}: ${p.full_name || p.email}`)
    );
  }

  // Check classes columns
  console.log("\n🏫 CLASSES SAMPLE:");
  console.log("-".repeat(40));
  const { data: classes } = await supabase
    .from("classes")
    .select("*")
    .limit(3);

  if (classes && classes.length > 0) {
    console.log("Columns:", Object.keys(classes[0]).join(", "));
    classes.forEach((c) => console.log(`  ${c.name}`));
  }

  // Check enrollments
  console.log("\n📝 ENROLLMENTS SAMPLE:");
  console.log("-".repeat(40));
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("*")
    .limit(3);

  if (enrollments && enrollments.length > 0) {
    console.log("Columns:", Object.keys(enrollments[0]).join(", "));
  } else {
    console.log("  No enrollments found");
  }

  console.log("\n✨ Done!");
}

main().catch(console.error);
