/**
 * scripts/seed-grade-categories.ts
 * Creates grade_categories for each subject+class combination
 * Also backfills existing grades with the correct category_id
 * 
 * Run with: npx tsx scripts/seed-grade-categories.ts
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

// Vietnamese 6 core subjects
const SUBJECTS = [
  { code: "toan", name: "Toán học" },
  { code: "van", name: "Ngữ văn" },
  { code: "anh", name: "Tiếng Anh" },
  { code: "ly", name: "Vật lý" },
  { code: "hoa", name: "Hóa học" },
  { code: "sinh", name: "Sinh học" },
];

async function main() {
  console.log("🌱 Seeding Grade Categories & Backfilling Grades\n");

  // Step 1: Ensure subjects exist
  console.log("1️⃣  Ensuring subjects exist...");
  for (const subject of SUBJECTS) {
    const { data: existing } = await supabase
      .from("subjects")
      .select("id")
      .eq("code", subject.code)
      .maybeSingle();

    if (!existing) {
      const { error } = await supabase.from("subjects").insert({
        code: subject.code,
        name: subject.name,
      });
      if (error) {
        console.log(`   ❌ Failed to create subject ${subject.code}: ${error.message}`);
      } else {
        console.log(`   ✅ Created subject: ${subject.name}`);
      }
    } else {
      console.log(`   ⏭️  Subject exists: ${subject.name}`);
    }
  }

  // Step 2: Get all classes
  console.log("\n2️⃣  Getting all classes...");
  const { data: classes, error: classErr } = await supabase
    .from("classes")
    .select("id, name");

  if (classErr || !classes) {
    console.log(`   ❌ Failed to get classes: ${classErr?.message}`);
    return;
  }
  console.log(`   Found ${classes.length} classes`);

  // Step 3: Create grade_categories for each class+subject
  console.log("\n3️⃣  Creating grade_categories for each class+subject...");
  let createdCount = 0;
  let skippedCount = 0;

  for (const cls of classes) {
    for (const subject of SUBJECTS) {
      const { data: existing } = await supabase
        .from("grade_categories")
        .select("id")
        .eq("class_id", cls.id)
        .eq("code", subject.code)
        .maybeSingle();

      if (!existing) {
        const { error } = await supabase.from("grade_categories").insert({
          class_id: cls.id,
          code: subject.code,
          name: subject.name,
        });
        if (error) {
          console.log(`   ❌ ${cls.name}/${subject.code}: ${error.message}`);
        } else {
          createdCount++;
        }
      } else {
        skippedCount++;
      }
    }
  }
  console.log(`   ✅ Created: ${createdCount} | ⏭️  Skipped: ${skippedCount}`);

  // Step 4: Backfill orphaned grades
  console.log("\n4️⃣  Backfilling orphaned grades...");
  
  // Get all grades without category_id
  const { data: orphanedGrades, error: ogErr } = await supabase
    .from("grades")
    .select("id, student_id")
    .is("category_id", null);

  if (ogErr) {
    console.log(`   ❌ Error fetching orphaned grades: ${ogErr.message}`);
    return;
  }

  if (!orphanedGrades || orphanedGrades.length === 0) {
    console.log("   ⏭️  No orphaned grades to backfill");
  } else {
    console.log(`   Found ${orphanedGrades.length} orphaned grades`);

    // For each orphaned grade, find the student's enrollment and assign a category
    let backfilledCount = 0;
    let failedCount = 0;

    for (const grade of orphanedGrades) {
      // Find student's enrollment
      const { data: enrollment } = await supabase
        .from("enrollments")
        .select("class_id")
        .eq("student_id", grade.student_id)
        .limit(1)
        .maybeSingle();

      if (!enrollment) {
        failedCount++;
        continue;
      }

      // Find a category for this class (use first available if no specific match)
      const { data: category } = await supabase
        .from("grade_categories")
        .select("id")
        .eq("class_id", enrollment.class_id)
        .limit(1)
        .maybeSingle();

      if (category) {
        const { error: updateErr } = await supabase
          .from("grades")
          .update({ category_id: category.id })
          .eq("id", grade.id);

        if (!updateErr) {
          backfilledCount++;
        } else {
          failedCount++;
        }
      } else {
        failedCount++;
      }
    }

    console.log(`   ✅ Backfilled: ${backfilledCount} | ❌ Failed: ${failedCount}`);
  }

  // Step 5: Summary
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("📊 FINAL SUMMARY");
  console.log("═══════════════════════════════════════════════════════════");

  const { count: subjectCount } = await supabase.from("subjects").select("*", { count: "exact", head: true });
  const { count: categoryCount } = await supabase.from("grade_categories").select("*", { count: "exact", head: true });
  const { count: totalGrades } = await supabase.from("grades").select("*", { count: "exact", head: true });
  const { count: linkedGrades } = await supabase.from("grades").select("*", { count: "exact", head: true }).not("category_id", "is", null);

  console.log(`   Subjects: ${subjectCount}`);
  console.log(`   Grade Categories: ${categoryCount}`);
  console.log(`   Total Grades: ${totalGrades}`);
  console.log(`   Linked Grades: ${linkedGrades}`);
  console.log(`   Orphaned Grades: ${(totalGrades || 0) - (linkedGrades || 0)}`);

  console.log("\n✨ Seeding Complete!");
}

main().catch(console.error);
