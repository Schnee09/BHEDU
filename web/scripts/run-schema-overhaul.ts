/**
 * scripts/run-schema-overhaul.ts
 * Executes the schema overhaul migration
 * 
 * Run with: npx tsx scripts/run-schema-overhaul.ts
 */

import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import * as path from "path";
import * as fs from "fs";

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
  console.log("🔧 Schema Overhaul Migration\n");

  // Phase 1: Check current state
  console.log("═══════════════════════════════════════");
  console.log("📊 PHASE 1: Current State");
  console.log("═══════════════════════════════════════");

  const { count: gradeCount } = await supabase.from("grades").select("*", { count: "exact", head: true });
  const { count: subjectCount } = await supabase.from("subjects").select("*", { count: "exact", head: true });
  const { count: classCount } = await supabase.from("classes").select("*", { count: "exact", head: true });

  console.log(`   Grades: ${gradeCount}`);
  console.log(`   Subjects: ${subjectCount}`);
  console.log(`   Classes: ${classCount}`);

  // Phase 2: Ensure subjects exist
  console.log("\n═══════════════════════════════════════");
  console.log("📚 PHASE 2: Ensure Subjects");
  console.log("═══════════════════════════════════════");

  const SUBJECTS = [
    { code: "toan", name: "Toán học" },
    { code: "van", name: "Ngữ văn" },
    { code: "anh", name: "Tiếng Anh" },
    { code: "ly", name: "Vật lý" },
    { code: "hoa", name: "Hóa học" },
    { code: "sinh", name: "Sinh học" },
  ];

  for (const subject of SUBJECTS) {
    const { data: existing } = await supabase
      .from("subjects")
      .select("id")
      .eq("code", subject.code)
      .maybeSingle();

    if (!existing) {
      await supabase.from("subjects").insert(subject);
      console.log(`   ✅ Created: ${subject.name}`);
    } else {
      console.log(`   ⏭️  Exists: ${subject.name}`);
    }
  }

  // Phase 3: Add columns to grades
  console.log("\n═══════════════════════════════════════");
  console.log("🔧 PHASE 3: Add Columns");
  console.log("═══════════════════════════════════════");

  // Check if columns exist by trying to select them
  const { error: colCheck } = await supabase
    .from("grades")
    .select("subject_id, class_id")
    .limit(1);

  if (colCheck && colCheck.message.includes("subject_id")) {
    console.log("   ⚠️ subject_id column missing - run SQL migration first");
  } else {
    console.log("   ✅ Columns exist");
  }

  // Phase 4: Backfill grades
  console.log("\n═══════════════════════════════════════");
  console.log("🔄 PHASE 4: Backfill Grades");
  console.log("═══════════════════════════════════════");

  // Get all grades without subject_id
  const { data: gradesWithoutSubject } = await supabase
    .from("grades")
    .select("id, student_id, category_id, assignment_id")
    .is("subject_id", null)
    .limit(1000);

  console.log(`   Found ${gradesWithoutSubject?.length || 0} grades to backfill`);

  // Get default subject
  const { data: defaultSubject } = await supabase
    .from("subjects")
    .select("id")
    .eq("code", "toan")
    .single();

  // Get first class
  const { data: defaultClass } = await supabase
    .from("classes")
    .select("id")
    .limit(1)
    .single();

  if (gradesWithoutSubject && gradesWithoutSubject.length > 0 && defaultSubject && defaultClass) {
    let backfilled = 0;
    
    for (const grade of gradesWithoutSubject) {
      // Try to find class from student enrollment
      let classId = defaultClass.id;
      
      const { data: enrollment } = await supabase
        .from("enrollments")
        .select("class_id")
        .eq("student_id", grade.student_id)
        .limit(1)
        .maybeSingle();
      
      if (enrollment) {
        classId = enrollment.class_id;
      }

      await supabase
        .from("grades")
        .update({
          subject_id: defaultSubject.id,
          class_id: classId,
        })
        .eq("id", grade.id);
      
      backfilled++;
    }
    
    console.log(`   ✅ Backfilled: ${backfilled}`);
  }

  // Phase 5: Normalize scores
  console.log("\n═══════════════════════════════════════");
  console.log("📐 PHASE 5: Normalize Scores");
  console.log("═══════════════════════════════════════");

  const { data: highScores } = await supabase
    .from("grades")
    .select("id, score")
    .gt("score", 10)
    .limit(1000);

  if (highScores && highScores.length > 0) {
    console.log(`   Found ${highScores.length} scores > 10 to normalize`);
    
    for (const grade of highScores) {
      await supabase
        .from("grades")
        .update({ score: grade.score / 10, points_earned: grade.score / 10 })
        .eq("id", grade.id);
    }
    
    console.log(`   ✅ Normalized ${highScores.length} scores`);
  } else {
    console.log("   ⏭️ No scores > 10 to normalize");
  }

  // Phase 6: Set defaults
  console.log("\n═══════════════════════════════════════");
  console.log("📝 PHASE 6: Set Defaults");
  console.log("═══════════════════════════════════════");

  await supabase
    .from("grades")
    .update({ component_type: "one_period" })
    .is("component_type", null);

  await supabase
    .from("grades")
    .update({ semester: "1" })
    .is("semester", null);

  console.log("   ✅ Defaults set");

  // Summary
  console.log("\n═══════════════════════════════════════");
  console.log("📊 FINAL SUMMARY");
  console.log("═══════════════════════════════════════");

  const { count: finalGrades } = await supabase.from("grades").select("*", { count: "exact", head: true });
  const { count: gradesWithSubject } = await supabase.from("grades").select("*", { count: "exact", head: true }).not("subject_id", "is", null);
  const { count: gradesWithClass } = await supabase.from("grades").select("*", { count: "exact", head: true }).not("class_id", "is", null);

  console.log(`   Total Grades: ${finalGrades}`);
  console.log(`   With subject_id: ${gradesWithSubject}`);
  console.log(`   With class_id: ${gradesWithClass}`);

  console.log("\n✨ Migration Complete!");
  console.log("\n⚠️  To drop legacy tables, run the SQL migration:");
  console.log("   supabase/migrations/20251223_schema_overhaul.sql");
}

main().catch(console.error);
