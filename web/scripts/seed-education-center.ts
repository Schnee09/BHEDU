/**
 * scripts/seed-education-center.ts
 * Seed script for Education Center model where each class = 1 subject
 * 
 * Run with: npx tsx scripts/seed-education-center.ts
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

// Education Center Classes - Each class is ONE subject
// Format: "Subject Name + Level/Group"
const CLASSES_CONFIG = [
  // Math classes
  { name: "Toán Cơ Bản A", subject_code: "toan", teacher_index: 0 },
  { name: "Toán Cơ Bản B", subject_code: "toan", teacher_index: 0 },
  { name: "Toán Nâng Cao", subject_code: "toan", teacher_index: 0 },
  
  // English classes
  { name: "Tiếng Anh A1", subject_code: "anh", teacher_index: 1 },
  { name: "Tiếng Anh A2", subject_code: "anh", teacher_index: 1 },
  { name: "Tiếng Anh B1", subject_code: "anh", teacher_index: 1 },
  { name: "IELTS Foundation", subject_code: "anh", teacher_index: 2 },
  
  // Vietnamese classes
  { name: "Ngữ Văn 10", subject_code: "van", teacher_index: 3 },
  { name: "Ngữ Văn 11", subject_code: "van", teacher_index: 3 },
  { name: "Ngữ Văn 12", subject_code: "van", teacher_index: 3 },
  
  // Physics classes
  { name: "Vật Lý Cơ Bản", subject_code: "ly", teacher_index: 4 },
  { name: "Vật Lý Nâng Cao", subject_code: "ly", teacher_index: 4 },
  
  // Chemistry classes
  { name: "Hóa Học Cơ Bản", subject_code: "hoa", teacher_index: 5 },
  { name: "Hóa Học Nâng Cao", subject_code: "hoa", teacher_index: 5 },
];

const SUBJECTS = [
  { code: "toan", name: "Toán học" },
  { code: "van", name: "Ngữ văn" },
  { code: "anh", name: "Tiếng Anh" },
  { code: "ly", name: "Vật lý" },
  { code: "hoa", name: "Hóa học" },
];

const TEACHER_NAMES = [
  "Nguyễn Văn Minh",
  "Trần Thị Lan",
  "Lê Hoàng Nam",
  "Phạm Thị Hương",
  "Hoàng Văn Đức",
  "Vũ Thị Mai",
];

const FIRST_NAMES = ["Minh", "Hải", "Dũng", "Anh", "Tuấn", "Nam", "Đức", "Phong", "Lan", "Hương", "Mai", "Linh", "Hà", "Trang", "Thuý"];
const LAST_NAMES = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Đặng", "Bùi"];

const COMPONENTS = ['oral', 'fifteen_min', 'one_period', 'midterm', 'final'];
const SEMESTERS = ['1', '2'];

function randomName() {
  return `${LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]} ${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]} ${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]}`;
}

function randomScore() {
  return Math.round((Math.random() * 5 + 5) * 10) / 10; // 5-10 range
}

async function main() {
  console.log("🌱 Education Center Seed\n");
  console.log("📋 Model: Each class = 1 subject\n");

  // 1. Create or get teachers
  console.log("👨‍🏫 Teachers:");
  const teacherIds: string[] = [];
  for (let i = 0; i < TEACHER_NAMES.length; i++) {
    const email = `teacher${i + 1}@bhedu.vn`;
    const { data: existing } = await supabase.from("profiles").select("id").eq("email", email).maybeSingle();
    
    if (existing) {
      teacherIds.push(existing.id);
      console.log(`  ⏭️  ${TEACHER_NAMES[i]}`);
    } else {
      const { data, error } = await supabase.from("profiles").insert({
        email,
        full_name: TEACHER_NAMES[i],
        role: "teacher",
      }).select("id").single();
      
      if (data) {
        teacherIds.push(data.id);
        console.log(`  ✅ ${TEACHER_NAMES[i]}`);
      } else {
        console.log(`  ❌ ${TEACHER_NAMES[i]}: ${error?.message}`);
        teacherIds.push(''); // placeholder
      }
    }
  }

  // 2. Ensure subjects exist
  console.log("\n📚 Subjects (for categorization):");
  const subjectIds: Record<string, string> = {};
  for (const s of SUBJECTS) {
    const { data: existing } = await supabase.from("subjects").select("id").eq("code", s.code).maybeSingle();
    if (existing) {
      subjectIds[s.code] = existing.id;
      console.log(`  ⏭️  ${s.name}`);
    } else {
      const { data, error } = await supabase.from("subjects").insert(s).select("id").single();
      if (data) {
        subjectIds[s.code] = data.id;
        console.log(`  ✅ ${s.name}`);
      } else {
        console.log(`  ❌ ${s.name}: ${error?.message}`);
      }
    }
  }

  // 3. Create classes (each class is a subject instance)
  console.log("\n🏫 Classes (each = 1 subject):");
  const classData: { id: string; name: string; subject_id: string }[] = [];
  
  for (const config of CLASSES_CONFIG) {
    const subjectId = subjectIds[config.subject_code];
    const teacherId = teacherIds[config.teacher_index] || null;
    
    const { data: existing } = await supabase.from("classes").select("id").eq("name", config.name).maybeSingle();
    
    if (existing) {
      classData.push({ id: existing.id, name: config.name, subject_id: subjectId });
      console.log(`  ⏭️  ${config.name}`);
    } else {
      const { data, error } = await supabase.from("classes").insert({
        name: config.name,
        teacher_id: teacherId,
        subject_id: subjectId,
      }).select("id").single();
      
      if (data) {
        classData.push({ id: data.id, name: config.name, subject_id: subjectId });
        console.log(`  ✅ ${config.name} (${SUBJECTS.find(s => s.code === config.subject_code)?.name})`);
      } else {
        console.log(`  ❌ ${config.name}: ${error?.message}`);
      }
    }
  }

  // 4. Create students and enroll them in 2-3 classes each
  console.log("\n👨‍🎓 Students + Enrollments:");
  const TOTAL_STUDENTS = 50;
  let studentCount = 0;
  let enrollmentCount = 0;
  let gradeCount = 0;

  for (let i = 0; i < TOTAL_STUDENTS; i++) {
    const code = `HS${String(i + 1).padStart(3, '0')}`;
    const name = randomName();
    const email = `student${i + 1}@bhedu.vn`;
    
    // Check if student exists
    const { data: existing } = await supabase.from("profiles").select("id").eq("email", email).maybeSingle();
    
    let studentId: string;
    if (existing) {
      studentId = existing.id;
    } else {
      const { data: student, error: sErr } = await supabase.from("profiles").insert({
        email,
        full_name: name,
        role: "student",
        student_id: code,
      }).select("id").single();

      if (sErr || !student) {
        console.log(`  ❌ ${code}: ${sErr?.message}`);
        continue;
      }
      studentId = student.id;
      studentCount++;
    }

    // Enroll in 2-4 random classes
    const numClasses = Math.floor(Math.random() * 3) + 2; // 2-4 classes
    const shuffledClasses = [...classData].sort(() => Math.random() - 0.5);
    const enrolledClasses = shuffledClasses.slice(0, numClasses);

    for (const cls of enrolledClasses) {
      // Check if enrollment exists
      const { data: existingEnroll } = await supabase
        .from("enrollments")
        .select("id")
        .eq("student_id", studentId)
        .eq("class_id", cls.id)
        .maybeSingle();

      if (!existingEnroll) {
        await supabase.from("enrollments").insert({
          student_id: studentId,
          class_id: cls.id,
          status: "active",
        });
        enrollmentCount++;
      }

      // Create grades for this class (class = subject)
      for (const sem of SEMESTERS) {
        for (const comp of COMPONENTS) {
          if (Math.random() > 0.2) { // 80% chance
            const { error: gErr } = await supabase.from("grades").insert({
              student_id: studentId,
              class_id: cls.id,
              subject_id: cls.subject_id,
              component_type: comp,
              semester: sem,
              score: randomScore(),
              points_earned: randomScore(),
            });
            if (!gErr) gradeCount++;
          }
        }
      }
    }

    if ((i + 1) % 10 === 0) {
      console.log(`  ✅ ${i + 1}/${TOTAL_STUDENTS} students processed`);
    }
  }

  // 5. Create attendance records
  console.log("\n📋 Attendance:");
  let attendanceCount = 0;
  const today = new Date();
  
  // Get all enrollments
  const { data: allEnrollments } = await supabase.from("enrollments").select("student_id, class_id").eq("status", "active");
  
  // Create attendance for last 14 days
  for (let d = 0; d < 14; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    const dateStr = date.toISOString().split('T')[0];
    
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    
    for (const enrollment of (allEnrollments || []).slice(0, 100)) {
      const rand = Math.random();
      const status = rand < 0.90 ? 'present' : 'absent';
      
      const { error } = await supabase.from("attendance").insert({
        student_id: enrollment.student_id,
        class_id: enrollment.class_id,
        date: dateStr,
        status,
      });
      if (!error) attendanceCount++;
    }
  }
  console.log(`  ✅ ${attendanceCount} attendance records`);

  // Summary
  console.log(`\n📊 Summary:`);
  console.log(`   ${SUBJECTS.length} subjects`);
  console.log(`   ${classData.length} classes (each = 1 subject)`);
  console.log(`   ${teacherIds.filter(Boolean).length} teachers`);
  console.log(`   ${studentCount} new students + existing`);
  console.log(`   ${enrollmentCount} enrollments`);
  console.log(`   ${gradeCount} grades`);
  console.log(`   ${attendanceCount} attendance records`);
  console.log("\n✨ Done!");
}

main().catch(console.error);
