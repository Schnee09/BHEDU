/**
 * scripts/seed-complete.ts
 * All-in-one seed script for complete Vietnamese Grade Management data
 * 
 * Run with: npx tsx scripts/seed-complete.ts
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

// Config
const SUBJECTS = [
  { code: "toan", name: "Toán học" },
  { code: "van", name: "Ngữ văn" },
  { code: "anh", name: "Tiếng Anh" },
  { code: "ly", name: "Vật lý" },
  { code: "hoa", name: "Hóa học" },
  { code: "khtn", name: "Khoa học tự nhiên" },
];

const CLASSES = ["10A", "10B", "10C", "11A", "11B", "11C", "12A", "12B", "12C"];

const FIRST_NAMES = ["Minh", "Hải", "Dũng", "Anh", "Tuấn", "Nam", "Đức", "Phong", "Lan", "Hương", "Mai", "Linh"];
const LAST_NAMES = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ"];

const COMPONENTS = ['oral', 'fifteen_min', 'one_period', 'midterm', 'final'];
const SEMESTERS = ['1', '2'];

function randomName() {
  return `${LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]} ${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]} ${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]}`;
}

function randomScore() {
  return Math.round((Math.random() * 5 + 5) * 10) / 10; // 5-10 range
}

async function main() {
  console.log("🌱 Complete Seed\n");

  // 1. Get ALL teachers to distribute classes among them
  const { data: teachers } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "teacher")
    .order("created_at");
  
  const teacherIds = teachers?.map(t => t.id) || [];
  console.log(`Found ${teacherIds.length} teachers:`);
  teachers?.forEach(t => console.log(`  - ${t.full_name} (${t.id.slice(0, 8)}...)`));

  // 2. Ensure subjects exist
  console.log("\n📚 Subjects:");
  const subjectIds: Record<string, string> = {};
  for (const s of SUBJECTS) {
    const { data: existing } = await supabase.from("subjects").select("id").eq("code", s.code).maybeSingle();
    if (existing) {
      subjectIds[s.code] = existing.id;
      console.log(`  ⏭️  ${s.name}`);
    } else {
      const { data, error } = await supabase.from("subjects").insert(s).select("id").single();
      if (data) { subjectIds[s.code] = data.id; console.log(`  ✅ ${s.name}`); }
      else console.log(`  ❌ ${s.name}: ${error?.message}`);
    }
  }

  // 3. Ensure classes exist - DISTRIBUTE among teachers
  console.log("\n🏫 Classes:");
  const classIds: Record<string, string> = {};
  let teacherIndex = 0;
  
  for (const name of CLASSES) {
    // Rotate through teachers so each gets some classes
    const assignedTeacherId = teacherIds.length > 0 ? teacherIds[teacherIndex % teacherIds.length] : null;
    teacherIndex++;
    
    const { data: existing } = await supabase.from("classes").select("id, teacher_id").eq("name", name).maybeSingle();
    if (existing) {
      classIds[name] = existing.id;
      // Update teacher_id if not set
      if (!existing.teacher_id && assignedTeacherId) {
        await supabase.from("classes").update({ teacher_id: assignedTeacherId }).eq("id", existing.id);
        console.log(`  🔄 ${name} (assigned to teacher)`);
      } else {
        console.log(`  ⏭️  ${name}`);
      }
    } else {
      const { data, error } = await supabase.from("classes").insert({ name, teacher_id: assignedTeacherId }).select("id").single();
      if (data) { classIds[name] = data.id; console.log(`  ✅ ${name} (teacher: ${assignedTeacherId?.slice(0, 8) || 'none'})`); }
      else console.log(`  ❌ ${name}: ${error?.message}`);
    }
  }

  // 4. Create students + enrollments + grades
  console.log("\n👨‍🎓 Students + Enrollments + Grades:");
  let studentNum = 1;
  let totalGrades = 0;

  for (const className of CLASSES) {
    const classId = classIds[className];
    if (!classId) continue;

    for (let i = 0; i < 10; i++) {
      const code = `HS${String(studentNum++).padStart(3, '0')}`;
      const name = randomName();
      
      // Determine grade level from class name (e.g., "10A" -> "Lớp 10")
      const gradeLevel = `Lớp ${className.match(/\d+/)?.[0] || '10'}`;
      // Random gender
      const genders = ['male', 'female', 'other'] as const;
      const gender = genders[Math.floor(Math.random() * genders.length)];
      
      // Create student with grade_level and gender
      const { data: student, error: sErr } = await supabase.from("profiles").insert({
        email: `student${studentNum}@bhedu.vn`,
        full_name: name,
        role: "student",
        grade_level: gradeLevel,
        gender: gender,
        status: "active",
      }).select("id").single();

      if (sErr) {
        console.log(`  ❌ ${code}: ${sErr.message}`);
        continue;
      }

      // Create enrollment
      await supabase.from("enrollments").insert({
        student_id: student.id,
        class_id: classId,
        status: "active",
      });

      // Create grades
      for (const subCode of Object.keys(subjectIds)) {
        for (const sem of SEMESTERS) {
          for (const comp of COMPONENTS) {
            if (Math.random() > 0.15) { // 85% chance
              await supabase.from("grades").insert({
                student_id: student.id,
                class_id: classId,
                subject_id: subjectIds[subCode],
                component_type: comp,
                semester: sem,
                score: randomScore(),
                points_earned: randomScore(),
              });
              totalGrades++;
            }
          }
        }
      }
    }
    console.log(`  ✅ ${className}: 10 students, grades created`);
  }

  // Summary
  console.log(`\n📊 Summary: ${SUBJECTS.length} subjects, ${CLASSES.length} classes, ${studentNum - 1} students, ${totalGrades} grades`);
  console.log("✨ Done!");
}

main().catch(console.error);
