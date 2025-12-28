/**
 * scripts/check-schema.ts
 * Check current Supabase schema and data counts
 * 
 * Run with: npx tsx scripts/check-schema.ts
 */

import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, "..", ".env.local") });
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  console.log("📊 Supabase Schema & Data Check\n");

  // Tables to check
  const tables = ['profiles', 'classes', 'subjects', 'enrollments', 'grades', 'attendance'];

  for (const table of tables) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`❌ ${table}: ${error.message}`);
    } else {
      console.log(`✅ ${table}: ${count} rows`);
    }
  }

  // Check classes structure
  console.log("\n=== CLASSES ===");
  const { data: classes } = await supabase.from('classes').select('id, name, subject_id, teacher_id').limit(5);
  if (classes && classes.length > 0) {
    console.log("Columns: id, name, subject_id, teacher_id");
    console.log("Samples:");
    classes.forEach(c => console.log(`  • ${c.name} (subject_id: ${c.subject_id ? 'yes' : 'no'})`));
  }

  // Check grades structure
  console.log("\n=== GRADES ===");
  const { data: grades } = await supabase.from('grades').select('id, student_id, class_id, subject_id, score, component_type, semester').limit(3);
  if (grades && grades.length > 0) {
    console.log("Columns: id, student_id, class_id, subject_id, score, component_type, semester");
    console.log("Sample:", JSON.stringify(grades[0], null, 2));
  } else {
    console.log("No grades found");
  }

  // Check enrollments structure
  console.log("\n=== ENROLLMENTS ===");
  const { data: enrollments } = await supabase.from('enrollments').select('id, student_id, class_id, status').limit(3);
  if (enrollments && enrollments.length > 0) {
    console.log("Columns: id, student_id, class_id, status");
    console.log("Sample:", JSON.stringify(enrollments[0], null, 2));
  } else {
    console.log("No enrollments found");
  }

  // Check subjects
  console.log("\n=== SUBJECTS ===");
  const { data: subjects } = await supabase.from('subjects').select('*');
  if (subjects) {
    console.log(`${subjects.length} subjects:`);
    subjects.forEach(s => console.log(`  • ${s.code}: ${s.name}`));
  }

  console.log("\n✨ Done!");
}

main().catch(console.error);
