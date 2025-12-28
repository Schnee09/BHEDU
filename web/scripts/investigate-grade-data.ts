/**
 * scripts/investigate-grade-data.ts
 * Deep investigation of grade data for backfill mapping
 * 
 * Run with: npx tsx scripts/investigate-grade-data.ts
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
  console.log("🔬 Deep Investigation of Grade Data for Backfill Mapping\n");

  // 1. Sample of raw grades data
  console.log("═══════════════════════════════════════════════════════════");
  console.log("1️⃣  RAW GRADES SAMPLE (First 5 records)");
  console.log("═══════════════════════════════════════════════════════════");
  const { data: rawGrades, error: rgErr } = await supabase
    .from("grades")
    .select("*")
    .limit(5);

  if (rgErr) {
    console.log(`❌ Error: ${rgErr.message}`);
  } else if (!rawGrades || rawGrades.length === 0) {
    console.log("⚠️ No grades found in database");
    return;
  } else {
    console.log(`Found ${rawGrades.length} records. Sample columns:`);
    const sample = rawGrades[0];
    const columns = Object.keys(sample);
    console.log(`Columns: ${columns.join(", ")}`);
    console.log("\nData sample:");
    rawGrades.forEach((g, i) => {
      console.log(`\n--- Record ${i + 1} ---`);
      for (const [key, value] of Object.entries(g)) {
        if (value !== null) {
          console.log(`  ${key}: ${value}`);
        }
      }
    });
  }

  // 2. Check what classes exist
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("2️⃣  CLASSES IN DATABASE");
  console.log("═══════════════════════════════════════════════════════════");
  const { data: classes } = await supabase
    .from("classes")
    .select("id, name, teacher_id")
    .limit(10);

  if (classes && classes.length > 0) {
    console.log(`Found ${classes.length} classes:`);
    classes.forEach(c => {
      console.log(`  - ${c.name} (ID: ${c.id.slice(0, 8)}...)`);
    });
  } else {
    console.log("⚠️ No classes found");
  }

  // 3. Check grade_categories
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("3️⃣  GRADE_CATEGORIES IN DATABASE");
  console.log("═══════════════════════════════════════════════════════════");
  const { data: categories, error: catErr } = await supabase
    .from("grade_categories")
    .select("id, class_id, code, name")
    .limit(20);

  if (catErr) {
    console.log(`❌ Error: ${catErr.message}`);
  } else if (categories && categories.length > 0) {
    console.log(`Found ${categories.length} grade_categories:`);
    categories.forEach(c => {
      console.log(`  - Code: "${c.code}" | Name: "${c.name}" | Class ID: ${c.class_id?.slice(0, 8) || 'NULL'}...`);
    });
  } else {
    console.log("⚠️ No grade_categories found - THIS IS THE PROBLEM!");
    console.log("   You need to create grade_categories for each subject/class combination.");
  }

  // 4. Check subjects table
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("4️⃣  SUBJECTS IN DATABASE");
  console.log("═══════════════════════════════════════════════════════════");
  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, code, name")
    .limit(20);

  if (subjects && subjects.length > 0) {
    console.log(`Found ${subjects.length} subjects:`);
    subjects.forEach(s => {
      console.log(`  - Code: "${s.code}" | Name: "${s.name}"`);
    });
  } else {
    console.log("⚠️ No subjects found");
  }

  // 5. Check enrollments
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("5️⃣  ENROLLMENTS (Student-Class Links)");
  console.log("═══════════════════════════════════════════════════════════");
  const { count: enrollmentCount } = await supabase
    .from("enrollments")
    .select("*", { count: "exact", head: true });

  console.log(`Total enrollments: ${enrollmentCount || 0}`);

  const { data: sampleEnrollments } = await supabase
    .from("enrollments")
    .select(`
      student_id,
      class_id,
      status,
      student:profiles!enrollments_student_id_fkey(full_name),
      class:classes!enrollments_class_id_fkey(name)
    `)
    .limit(5);

  if (sampleEnrollments && sampleEnrollments.length > 0) {
    console.log("Sample enrollments:");
    sampleEnrollments.forEach(e => {
      const student = Array.isArray(e.student) ? e.student[0] : e.student;
      const cls = Array.isArray(e.class) ? e.class[0] : e.class;
      console.log(`  - ${student?.full_name || 'Unknown'} → ${cls?.name || 'Unknown'} (${e.status})`);
    });
  }

  // 6. Recommendation
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("📋 RECOMMENDED ACTIONS");
  console.log("═══════════════════════════════════════════════════════════");
  
  const catCount = categories?.length || 0;
  const subjectCount = subjects?.length || 0;
  const classCount = classes?.length || 0;

  if (catCount === 0 && subjectCount > 0 && classCount > 0) {
    console.log("✅ You have subjects and classes, but no grade_categories.");
    console.log("   ACTION: Create grade_categories for each subject+class combination.");
    console.log("");
    console.log("   Example SQL:");
    console.log("   INSERT INTO grade_categories (class_id, code, name)");
    console.log("   SELECT c.id, s.code, s.name");
    console.log("   FROM classes c CROSS JOIN subjects s;");
  } else if (catCount > 0) {
    console.log("✅ You have grade_categories. Now need to link grades to them.");
    console.log("   ACTION: Update grades.category_id based on available mapping.");
  } else {
    console.log("⚠️ Missing both subjects and grade_categories.");
    console.log("   ACTION: First create subjects, then create grade_categories.");
  }

  console.log("\n✨ Investigation Complete!");
}

main().catch(console.error);
