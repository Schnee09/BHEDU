/**
 * scripts/seed-data-only.ts
 * Seeds enrollments, grades, and attendance for existing students and classes
 * 
 * Run with: npx tsx scripts/seed-data-only.ts
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

const COMPONENTS = ['oral', 'fifteen_min', 'one_period', 'midterm', 'final'];

function randomScore() {
  return Math.round((Math.random() * 5 + 5) * 10) / 10;
}

async function main() {
  console.log("🌱 Seeding Data Only\n");

  // Get all classes
  const { data: classes } = await supabase.from('classes').select('id, name');
  console.log(`📚 Classes: ${classes?.length || 0}`);

  // Get all students
  const { data: students } = await supabase.from('profiles').select('id').eq('role', 'student');
  console.log(`👨‍🎓 Students: ${students?.length || 0}`);

  // Get first subject for reference
  const { data: subjects } = await supabase.from('subjects').select('id').limit(1);
  const subjectId = subjects?.[0]?.id || null;

  if (!classes?.length || !students?.length) {
    console.log("❌ No classes or students found. Run seed-simple.ts first.");
    return;
  }

  // Create enrollments
  console.log("\n📋 Creating enrollments...");
  let enrollmentCount = 0;

  for (const student of students) {
    // Enroll each student in 2-4 random classes
    const numClasses = Math.floor(Math.random() * 3) + 2;
    const shuffled = [...classes].sort(() => Math.random() - 0.5);
    const enrolled = shuffled.slice(0, numClasses);

    for (const cls of enrolled) {
      // Check if enrollment exists
      const { data: existing } = await supabase
        .from('enrollments')
        .select('id')
        .eq('student_id', student.id)
        .eq('class_id', cls.id)
        .maybeSingle();

      if (!existing) {
        const { error } = await supabase.from('enrollments').insert({
          student_id: student.id,
          class_id: cls.id,
          status: 'active',
        });
        if (!error) enrollmentCount++;
      }
    }
  }
  console.log(`  ✅ Created ${enrollmentCount} enrollments`);

  // Get all enrollments for grades
  const { data: enrollments } = await supabase.from('enrollments').select('student_id, class_id');
  console.log(`  Total enrollments: ${enrollments?.length || 0}`);

  // Create grades
  console.log("\n📊 Creating grades...");
  let gradeCount = 0;

  for (const e of (enrollments || []).slice(0, 200)) { // Limit to 200 to avoid timeout
    for (const comp of COMPONENTS) {
      for (const sem of ['1', '2']) {
        if (Math.random() > 0.25) { // 75% chance
          const { error } = await supabase.from('grades').insert({
            student_id: e.student_id,
            class_id: e.class_id,
            subject_id: subjectId,
            component_type: comp,
            semester: sem,
            score: randomScore(),
          });
          if (!error) gradeCount++;
        }
      }
    }
  }
  console.log(`  ✅ Created ${gradeCount} grades`);

  // Create attendance
  console.log("\n📋 Creating attendance...");
  let attendanceCount = 0;
  const today = new Date();

  for (let d = 0; d < 10; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    const dateStr = date.toISOString().split('T')[0];

    for (const e of (enrollments || []).slice(0, 100)) {
      const status = Math.random() < 0.9 ? 'present' : 'absent';
      const { error } = await supabase.from('attendance').insert({
        student_id: e.student_id,
        class_id: e.class_id,
        date: dateStr,
        status,
      });
      if (!error) attendanceCount++;
    }
  }
  console.log(`  ✅ Created ${attendanceCount} attendance records`);

  // Summary
  console.log("\n📊 Final counts:");
  for (const table of ['classes', 'profiles', 'enrollments', 'grades', 'attendance']) {
    const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
    console.log(`  ${table}: ${count || 0}`);
  }

  console.log("\n✨ Done!");
}

main().catch(console.error);
