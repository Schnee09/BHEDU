/**
 * scripts/seed-simple.ts
 * Simple seed script - creates classes, students, enrollments, grades, attendance
 * Does not rely on subject_id column in classes table
 * 
 * Run with: npx tsx scripts/seed-simple.ts
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

// Education Center Classes 
const CLASS_NAMES = [
  "Toán Cơ Bản A",
  "Toán Cơ Bản B",
  "Toán Nâng Cao",
  "Tiếng Anh A1",
  "Tiếng Anh A2",
  "Tiếng Anh B1",
  "IELTS Foundation",
  "Ngữ Văn 10",
  "Ngữ Văn 11",
  "Ngữ Văn 12",
  "Vật Lý Cơ Bản",
  "Vật Lý Nâng Cao",
  "Hóa Học Cơ Bản",
  "Hóa Học Nâng Cao",
];

const FIRST_NAMES = ["Minh", "Hải", "Dũng", "Anh", "Tuấn", "Nam", "Đức", "Phong", "Lan", "Hương", "Mai", "Linh"];
const LAST_NAMES = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ"];

const COMPONENTS = ['oral', 'fifteen_min', 'one_period', 'midterm', 'final'];

function randomName() {
  return `${LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]} ${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]} ${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]}`;
}

function randomScore() {
  return Math.round((Math.random() * 5 + 5) * 10) / 10; // 5-10 range
}

async function main() {
  console.log("🌱 Simple Seed Script\n");

  // 1. Get first teacher
  const { data: teacher } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "teacher")
    .limit(1)
    .maybeSingle();
  
  const teacherId = teacher?.id || null;
  console.log(`Teacher ID: ${teacherId ? teacherId.slice(0, 8) + '...' : 'none'}`);

  // 2. Get first subject for reference
  const { data: subjects } = await supabase.from("subjects").select("id").limit(1);
  const subjectId = subjects?.[0]?.id || null;
  console.log(`Subject ID: ${subjectId ? subjectId.slice(0, 8) + '...' : 'none'}`);

  // 3. Create classes - try minimal insert first
  console.log("\n🏫 Creating classes...");
  const classIds: { id: string; name: string }[] = [];
  
  for (const name of CLASS_NAMES) {
    // Check if exists
    const { data: existing } = await supabase.from("classes").select("id").eq("name", name).maybeSingle();
    if (existing) {
      classIds.push({ id: existing.id, name });
      console.log(`  ⏭️  ${name} (exists)`);
      continue;
    }

    // Try insert with minimal fields
    const { data, error } = await supabase
      .from("classes")
      .insert({ name, teacher_id: teacherId })
      .select("id")
      .single();
    
    if (data) {
      classIds.push({ id: data.id, name });
      console.log(`  ✅ ${name}`);
    } else {
      console.log(`  ❌ ${name}: ${error?.message}`);
    }
  }

  if (classIds.length === 0) {
    console.log("\n❌ No classes created. Exiting.");
    return;
  }

  // 4. Create students
  console.log("\n👨‍🎓 Creating students...");
  const TOTAL_STUDENTS = 50;
  let createdStudents = 0;

  for (let i = 0; i < TOTAL_STUDENTS; i++) {
    const email = `student${i + 1}@bhedu.vn`;
    const name = randomName();
    const code = `HS${String(i + 1).padStart(3, '0')}`;

    // Check if exists
    const { data: existing } = await supabase.from("profiles").select("id").eq("email", email).maybeSingle();
    if (existing) continue;

    const { data: student, error } = await supabase
      .from("profiles")
      .insert({ email, full_name: name, role: "student", student_id: code })
      .select("id")
      .single();

    if (student) {
      createdStudents++;
      
      // Enroll in 2-4 random classes
      const numClasses = Math.floor(Math.random() * 3) + 2;
      const shuffled = [...classIds].sort(() => Math.random() - 0.5);
      const enrolled = shuffled.slice(0, numClasses);

      for (const cls of enrolled) {
        await supabase.from("enrollments").insert({
          student_id: student.id,
          class_id: cls.id,
          status: "active",
        });

        // Create grades
        for (const comp of COMPONENTS) {
          for (const sem of ['1', '2']) {
            if (Math.random() > 0.2) {
              await supabase.from("grades").insert({
                student_id: student.id,
                class_id: cls.id,
                subject_id: subjectId,
                component_type: comp,
                semester: sem,
                score: randomScore(),
              });
            }
          }
        }
      }
    }

    if ((i + 1) % 10 === 0) console.log(`  ✅ ${i + 1}/${TOTAL_STUDENTS} students`);
  }
  console.log(`Created ${createdStudents} new students`);

  // 5. Create attendance
  console.log("\n📋 Creating attendance...");
  const { data: enrollments } = await supabase.from("enrollments").select("student_id, class_id").limit(100);
  let attendanceCount = 0;
  const today = new Date();

  for (let d = 0; d < 10; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    const dateStr = date.toISOString().split('T')[0];

    for (const e of enrollments || []) {
      const status = Math.random() < 0.9 ? 'present' : 'absent';
      const { error } = await supabase.from("attendance").insert({
        student_id: e.student_id,
        class_id: e.class_id,
        date: dateStr,
        status,
      });
      if (!error) attendanceCount++;
    }
  }
  console.log(`Created ${attendanceCount} attendance records`);

  // Summary
  console.log("\n📊 Final counts:");
  for (const table of ['classes', 'profiles', 'enrollments', 'grades', 'attendance']) {
    const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
    console.log(`  ${table}: ${count || 0}`);
  }

  console.log("\n✨ Done!");
}

main().catch(console.error);
