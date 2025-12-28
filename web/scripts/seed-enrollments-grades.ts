/**
 * scripts/seed-enrollments-grades.ts
 * Seeds enrollments and grades for existing students
 * 
 * Run with: npx tsx scripts/seed-enrollments-grades.ts
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

const COMPONENT_TYPES = ['oral', 'fifteen_min', 'one_period', 'midterm', 'final'];
const SEMESTERS = ['1', '2'];

function randomScore(): number {
  const base = Math.random() * 10;
  const score = base < 2 ? base + 3 : base;
  return Math.round(Math.min(10, score) * 10) / 10;
}

async function main() {
  console.log("🌱 Seeding Enrollments & Grades\n");

  // Get classes
  const { data: classes } = await supabase.from("classes").select("id, name");
  if (!classes?.length) {
    console.log("❌ No classes found!");
    return;
  }
  console.log(`✅ Found ${classes.length} classes`);

  // Get subjects
  const { data: subjects } = await supabase.from("subjects").select("id, code");
  if (!subjects?.length) {
    console.log("❌ No subjects found!");
    return;
  }
  console.log(`✅ Found ${subjects.length} subjects`);

  // Get students
  const { data: students } = await supabase.from("profiles").select("id").eq("role", "student");
  if (!students?.length) {
    console.log("❌ No students found!");
    return;
  }
  console.log(`✅ Found ${students.length} students`);

  // Distribute students across classes (12 per class)
  const STUDENTS_PER_CLASS = 12;
  let studentIndex = 0;
  let enrollmentCount = 0;
  let gradeCount = 0;

  for (const cls of classes) {
    const assignedStudents = students.slice(studentIndex, studentIndex + STUDENTS_PER_CLASS);
    studentIndex += STUDENTS_PER_CLASS;

    // Create enrollments
    for (const student of assignedStudents) {
      // Check if enrollment exists
      const { data: existing } = await supabase
        .from("enrollments")
        .select("id")
        .eq("student_id", student.id)
        .eq("class_id", cls.id)
        .maybeSingle();

      if (!existing) {
        const { error } = await supabase.from("enrollments").insert({
          student_id: student.id,
          class_id: cls.id,
          status: "active",
        });
        if (!error) enrollmentCount++;
      }

      // Create grades for each subject
      for (const subject of subjects) {
        for (const semester of SEMESTERS) {
          for (const componentType of COMPONENT_TYPES) {
            // 80% chance to have a grade
            if (Math.random() > 0.2) {
              const score = randomScore();
              const { error } = await supabase.from("grades").insert({
                student_id: student.id,
                class_id: cls.id,
                subject_id: subject.id,
                component_type: componentType,
                semester: semester,
                score: score,
                points_earned: score,
                graded_at: new Date().toISOString(),
              });
              if (!error) gradeCount++;
            }
          }
        }
      }
    }
    console.log(`✅ ${cls.name}: ${assignedStudents.length} students enrolled`);
  }

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log(`📊 Created ${enrollmentCount} enrollments, ${gradeCount} grades`);
  console.log("✨ Done!");
}

main().catch(console.error);
