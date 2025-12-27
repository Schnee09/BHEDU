/**
 * scripts/verify-grades-relationships.ts
 * Verifies the data relationships for the grade system in Supabase
 * 
 * Run with: npx tsx scripts/verify-grades-relationships.ts
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
  console.log("🔍 Verifying Grade Data Relationships...\n");

  // 1. Check grade_categories table
  console.log("═══════════════════════════════════════");
  console.log("📚 GRADE_CATEGORIES Table");
  console.log("═══════════════════════════════════════");
  const { data: categories, error: catErr } = await supabase
    .from("grade_categories")
    .select("*, classes(id, name)")
    .limit(10);

  if (catErr) {
    console.log(`   ❌ Error: ${catErr.message}`);
  } else if (!categories || categories.length === 0) {
    console.log("   ⚠️ No grade_categories found");
  } else {
    console.log(`   ✅ Found ${categories.length} categories:`);
    categories.forEach((cat: any) => {
      console.log(`      - ID: ${cat.id.slice(0, 8)}... | Code: "${cat.code}" | Name: "${cat.name}" | Class: ${cat.classes?.name || 'N/A'}`);
    });
  }

  // 2. Check grades table structure
  console.log("\n═══════════════════════════════════════");
  console.log("📝 GRADES Table Sample");
  console.log("═══════════════════════════════════════");
  const { data: grades, error: gradeErr } = await supabase
    .from("grades")
    .select(`
      id,
      score,
      points_earned,
      component_type,
      semester,
      assignment_id,
      category_id,
      student_id
    `)
    .limit(10);

  if (gradeErr) {
    console.log(`   ❌ Error: ${gradeErr.message}`);
  } else if (!grades || grades.length === 0) {
    console.log("   ⚠️ No grades found");
  } else {
    console.log(`   ✅ Found ${grades.length} grade records:`);
    grades.forEach((g: any) => {
      console.log(`      - Score: ${g.score} | Points: ${g.points_earned} | Component: ${g.component_type || 'N/A'} | Semester: ${g.semester || 'N/A'}`);
      console.log(`        └─ assignment_id: ${g.assignment_id ? g.assignment_id.slice(0, 8) + '...' : 'NULL'} | category_id: ${g.category_id ? g.category_id.slice(0, 8) + '...' : 'NULL'}`);
    });
  }

  // 3. Check grades linked to assignments (Legacy path)
  console.log("\n═══════════════════════════════════════");
  console.log("🔗 GRADES → ASSIGNMENTS (Legacy Path)");
  console.log("═══════════════════════════════════════");
  const { data: assignmentGrades, error: agErr } = await supabase
    .from("grades")
    .select(`
      id,
      score,
      assignment:assignments(id, title, max_points, category_id)
    `)
    .not("assignment_id", "is", null)
    .limit(5);

  if (agErr) {
    console.log(`   ❌ Error: ${agErr.message}`);
  } else if (!assignmentGrades || assignmentGrades.length === 0) {
    console.log("   ⚠️ No grades linked to assignments");
  } else {
    console.log(`   ✅ Found ${assignmentGrades.length} grades with assignments:`);
    assignmentGrades.forEach((g: any) => {
      const a = Array.isArray(g.assignment) ? g.assignment[0] : g.assignment;
      console.log(`      - Score: ${g.score} | Assignment: "${a?.title || 'N/A'}" | Max Points: ${a?.max_points || 'N/A'}`);
    });
  }

  // 4. Check grades linked to categories (Vietnamese path)
  console.log("\n═══════════════════════════════════════");
  console.log("🔗 GRADES → GRADE_CATEGORIES (Vietnamese Path)");
  console.log("═══════════════════════════════════════");
  const { data: categoryGrades, error: cgErr } = await supabase
    .from("grades")
    .select(`
      id,
      score,
      points_earned,
      component_type,
      semester,
      grade_category:grade_categories(id, code, name)
    `)
    .not("category_id", "is", null)
    .limit(5);

  if (cgErr) {
    console.log(`   ❌ Error: ${cgErr.message}`);
  } else if (!categoryGrades || categoryGrades.length === 0) {
    console.log("   ⚠️ No grades linked to categories");
  } else {
    console.log(`   ✅ Found ${categoryGrades.length} grades with categories:`);
    categoryGrades.forEach((g: any) => {
      const c = Array.isArray(g.grade_category) ? g.grade_category[0] : g.grade_category;
      console.log(`      - Score: ${g.score} | Points: ${g.points_earned} | Component: ${g.component_type} | Semester: ${g.semester}`);
      console.log(`        └─ Category: "${c?.name || c?.code || 'N/A'}"`);
    });
  }

  // 5. Check assignments table
  console.log("\n═══════════════════════════════════════");
  console.log("📄 ASSIGNMENTS Table Sample");
  console.log("═══════════════════════════════════════");
  const { data: assignments, error: assErr } = await supabase
    .from("assignments")
    .select("id, title, max_points, category_id, class_id")
    .limit(5);

  if (assErr) {
    console.log(`   ❌ Error: ${assErr.message}`);
  } else if (!assignments || assignments.length === 0) {
    console.log("   ⚠️ No assignments found");
  } else {
    console.log(`   ✅ Found ${assignments.length} assignments:`);
    assignments.forEach((a: any) => {
      console.log(`      - Title: "${a.title}" | Max Points: ${a.max_points} | category_id: ${a.category_id ? a.category_id.slice(0, 8) + '...' : 'NULL'}`);
    });
  }

  // 6. Summary Stats
  console.log("\n═══════════════════════════════════════");
  console.log("📊 SUMMARY STATISTICS");
  console.log("═══════════════════════════════════════");

  const { count: totalGrades } = await supabase.from("grades").select("*", { count: "exact", head: true });
  const { count: gradesWithAssignment } = await supabase.from("grades").select("*", { count: "exact", head: true }).not("assignment_id", "is", null);
  const { count: gradesWithCategory } = await supabase.from("grades").select("*", { count: "exact", head: true }).not("category_id", "is", null);
  const { count: gradesWithBoth } = await supabase.from("grades").select("*", { count: "exact", head: true }).not("assignment_id", "is", null).not("category_id", "is", null);
  const { count: gradesWithNeither } = await supabase.from("grades").select("*", { count: "exact", head: true }).is("assignment_id", null).is("category_id", null);

  console.log(`   Total Grades: ${totalGrades || 0}`);
  console.log(`   ├─ With assignment_id: ${gradesWithAssignment || 0}`);
  console.log(`   ├─ With category_id: ${gradesWithCategory || 0}`);
  console.log(`   ├─ With BOTH: ${gradesWithBoth || 0}`);
  console.log(`   └─ With NEITHER (orphaned): ${gradesWithNeither || 0}`);

  console.log("\n✨ Verification Complete!");
}

main().catch(console.error);
