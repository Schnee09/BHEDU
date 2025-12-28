/**
 * scripts/check-data-counts.ts
 * Quick script to check current data counts in database
 * 
 * Run with: npx tsx scripts/check-data-counts.ts
 */

import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, "..", ".env.local") });
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !service) {
  console.error("❌ Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(url, service, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log("📊 Checking Database Data Counts...\n");

  const tables = [
    { name: "profiles", label: "All Users" },
    { name: "profiles", label: "Students", filter: { role: "student" } },
    { name: "profiles", label: "Teachers", filter: { role: "teacher" } },
    { name: "profiles", label: "Admins", filter: { role: "admin" } },
    { name: "classes", label: "Classes" },
    { name: "enrollments", label: "Enrollments" },
    { name: "assignments", label: "Assignments" },
    { name: "grades", label: "Grades" },
    { name: "attendance", label: "Attendance Records" },
    { name: "academic_years", label: "Academic Years" },
    { name: "grading_scales", label: "Grading Scales" },
  ];

  for (const table of tables) {
    try {
      let query = supabase.from(table.name).select("*", { count: "exact", head: true });
      
      if (table.filter) {
        for (const [key, value] of Object.entries(table.filter)) {
          query = query.eq(key, value);
        }
      }
      
      const { count, error } = await query;
      
      if (error) {
        console.log(`   ❌ ${table.label}: Error - ${error.message}`);
      } else {
        const emoji = (count || 0) > 0 ? "✅" : "⚠️";
        console.log(`   ${emoji} ${table.label}: ${count || 0} records`);
      }
    } catch (err) {
      console.log(`   ❌ ${table.label}: Exception`);
    }
  }

  // Show grade distribution if grades exist
  console.log("\n📈 Grade Distribution (if data exists):");
  const { data: grades } = await supabase.from("grades").select("score");
  
  if (grades && grades.length > 0) {
    const ranges = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    for (const g of grades) {
      if (g.score >= 90) ranges.A++;
      else if (g.score >= 80) ranges.B++;
      else if (g.score >= 70) ranges.C++;
      else if (g.score >= 60) ranges.D++;
      else ranges.F++;
    }
    console.log(`   A (90-100): ${ranges.A} | B (80-89): ${ranges.B} | C (70-79): ${ranges.C} | D (60-69): ${ranges.D} | F (<60): ${ranges.F}`);
  } else {
    console.log("   No grades found");
  }

  console.log("\n✨ Done!");
}

main();
