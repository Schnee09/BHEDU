/**
 * scripts/seed-fresh-data.ts
 * Creates fresh, clean seed data for Vietnamese Grade Management
 * 
 * Run with: npx tsx scripts/seed-fresh-data.ts
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

// ============================================
// DATA DEFINITIONS
// ============================================

const SUBJECTS = [
  { code: "toan", name: "Toán học" },
  { code: "van", name: "Ngữ văn" },
  { code: "anh", name: "Tiếng Anh" },
  { code: "ly", name: "Vật lý" },
  { code: "hoa", name: "Hóa học" },
  { code: "khtn", name: "Khoa học tự nhiên" },
];

const CLASSES = [
  { name: "10A" },
  { name: "10B" },
  { name: "10C" },
  { name: "11A" },
  { name: "11B" },
  { name: "11C" },
  { name: "12A" },
  { name: "12B" },
  { name: "12C" },
];

const VIETNAMESE_FIRST_NAMES = [
  "Minh", "Hải", "Dũng", "Hùng", "Anh", "Tuấn", "Nam", "Đức", "Phong", "Bình",
  "Lan", "Hương", "Mai", "Linh", "Ngọc", "Thảo", "Hà", "Phương", "Trang", "Chi",
];

const VIETNAMESE_LAST_NAMES = [
  "Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng",
  "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lý",
];

const COMPONENT_TYPES = ['oral', 'fifteen_min', 'one_period', 'midterm', 'final'];
const SEMESTERS = ['1', '2'];

// ============================================
// HELPER FUNCTIONS
// ============================================

function randomName(): string {
  const last = VIETNAMESE_LAST_NAMES[Math.floor(Math.random() * VIETNAMESE_LAST_NAMES.length)];
  const first = VIETNAMESE_FIRST_NAMES[Math.floor(Math.random() * VIETNAMESE_FIRST_NAMES.length)];
  const middle = VIETNAMESE_FIRST_NAMES[Math.floor(Math.random() * VIETNAMESE_FIRST_NAMES.length)];
  return `${last} ${middle} ${first}`;
}

function randomScore(): number {
  // Vietnamese 10-point scale with realistic distribution
  const base = Math.random() * 10;
  // Slight bias towards passing grades (5-8)
  const score = base < 2 ? base + 3 : base;
  return Math.round(Math.min(10, score) * 10) / 10;
}

function generateStudentCode(index: number): string {
  return `HS${String(index).padStart(4, '0')}`;
}

// ============================================
// MAIN SEEDING FUNCTION
// ============================================

async function main() {
  console.log("🌱 Fresh Data Seeding\n");
  console.log("═══════════════════════════════════════════════════════════");

  // Phase 1: Clear old grades
  console.log("\n1️⃣  CLEARING OLD GRADES");
  console.log("═══════════════════════════════════════════════════════════");
  const { error: clearErr } = await supabase.from("grades").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (clearErr) {
    console.log(`   ⚠️ Warning: ${clearErr.message}`);
  } else {
    console.log("   ✅ Old grades cleared");
  }

  // Phase 2: Seed Subjects
  console.log("\n2️⃣  SEEDING SUBJECTS");
  console.log("═══════════════════════════════════════════════════════════");
  
  const subjectMap: Record<string, string> = {};
  for (const subject of SUBJECTS) {
    // Check if exists first
    const { data: existing } = await supabase
      .from("subjects")
      .select("id")
      .eq("code", subject.code)
      .maybeSingle();

    if (existing) {
      subjectMap[subject.code] = existing.id;
      console.log(`   ⏭️  ${subject.name} (exists)`);
    } else {
      const { data, error } = await supabase
        .from("subjects")
        .insert(subject)
        .select("id")
        .single();

      if (error) {
        console.log(`   ❌ ${subject.name}: ${error.message}`);
      } else {
        subjectMap[subject.code] = data.id;
        console.log(`   ✅ ${subject.name}`);
      }
    }
  }

  // Phase 3: Get or create teacher
  console.log("\n3️⃣  GETTING TEACHER");
  console.log("═══════════════════════════════════════════════════════════");
  
  const { data: teachers } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "teacher")
    .limit(1);

  let teacherId: string | null = teachers?.[0]?.id || null;
  
  if (!teacherId) {
    // Get any admin user instead
    const { data: admins } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "admin")
      .limit(1);
    teacherId = admins?.[0]?.id || null;
  }

  if (teacherId) {
    console.log(`   ✅ Teacher ID: ${teacherId.slice(0, 8)}...`);
  } else {
    console.log("   ⚠️ No teacher found, classes will have no teacher");
  }

  // Phase 4: Seed Classes
  console.log("\n4️⃣  SEEDING CLASSES");
  console.log("═══════════════════════════════════════════════════════════");
  
  const classMap: Record<string, string> = {};
  for (const cls of CLASSES) {
    // Check if exists first
    const { data: existing } = await supabase
      .from("classes")
      .select("id")
      .eq("name", cls.name)
      .maybeSingle();

    if (existing) {
      classMap[cls.name] = existing.id;
      console.log(`   ⏭️  ${cls.name} (exists)`);
    } else {
      const { data, error } = await supabase
        .from("classes")
        .insert({ name: cls.name, teacher_id: teacherId })
        .select("id")
        .single();

      if (error) {
        console.log(`   ❌ ${cls.name}: ${error.message}`);
      } else {
        classMap[cls.name] = data.id;
        console.log(`   ✅ ${cls.name}`);
      }
    }
  }

  // Phase 5: Seed Students
  console.log("\n5️⃣  SEEDING STUDENTS");
  console.log("═══════════════════════════════════════════════════════════");
  
  const studentsByClass: Record<string, string[]> = {};
  const STUDENTS_PER_CLASS = 12;

  // First get existing students
  const { data: existingStudents } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "student");

  const existingStudentIds = existingStudents?.map(s => s.id) || [];
  let studentIndex = existingStudentIds.length + 1;
  let usedExistingIndex = 0;

  for (const classCode of Object.keys(classMap)) {
    studentsByClass[classCode] = [];
    const classId = classMap[classCode];

    // Check for existing enrollments in this class
    const { data: existingEnrollments } = await supabase
      .from("enrollments")
      .select("student_id")
      .eq("class_id", classId);

    const existingEnrolledIds = existingEnrollments?.map(e => e.student_id) || [];

    if (existingEnrolledIds.length >= STUDENTS_PER_CLASS) {
      // Use existing students
      studentsByClass[classCode] = existingEnrolledIds.slice(0, STUDENTS_PER_CLASS);
      console.log(`   ⏭️  ${classCode}: ${existingEnrolledIds.length} students (existing)`);
    } else {
      // Need to create new students
      for (let i = 0; i < STUDENTS_PER_CLASS; i++) {
        // Try to use existing student first
        if (usedExistingIndex < existingStudentIds.length) {
          studentsByClass[classCode].push(existingStudentIds[usedExistingIndex++]);
        } else {
          // Create new student
          const studentCode = generateStudentCode(studentIndex++);
          const fullName = randomName();
          const email = `${studentCode.toLowerCase()}@bhedu.vn`;

          const { data, error } = await supabase
            .from("profiles")
            .insert({
              email,
              full_name: fullName,
              student_code: studentCode,
              role: "student",
            })
            .select("id")
            .single();

          if (error) {
            console.log(`   ❌ ${studentCode}: ${error.message}`);
          } else {
            studentsByClass[classCode].push(data.id);
          }
        }
      }
      console.log(`   ✅ ${classCode}: ${studentsByClass[classCode].length} students`);
    }
  }

  // Phase 6: Seed Enrollments
  console.log("\n6️⃣  SEEDING ENROLLMENTS");
  console.log("═══════════════════════════════════════════════════════════");
  
  let enrollmentCount = 0;
  for (const [classCode, studentIds] of Object.entries(studentsByClass)) {
    const classId = classMap[classCode];
    
    for (const studentId of studentIds) {
      const { error } = await supabase
        .from("enrollments")
        .insert({
          student_id: studentId,
          class_id: classId,
          status: "active",
        });

      if (!error) enrollmentCount++;
    }
  }
  console.log(`   ✅ Created ${enrollmentCount} enrollments`);

  // Phase 7: Seed Grades
  console.log("\n7️⃣  SEEDING GRADES");
  console.log("═══════════════════════════════════════════════════════════");
  
  let gradeCount = 0;
  const gradeBatches: any[] = [];

  for (const [classCode, studentIds] of Object.entries(studentsByClass)) {
    const classId = classMap[classCode];
    
    for (const studentId of studentIds) {
      for (const subjectCode of Object.keys(subjectMap)) {
        const subjectId = subjectMap[subjectCode];
        
        for (const semester of SEMESTERS) {
          for (const componentType of COMPONENT_TYPES) {
            // Random chance to have a grade (80% chance)
            if (Math.random() > 0.2) {
              const score = randomScore();
              gradeBatches.push({
                student_id: studentId,
                class_id: classId,
                subject_id: subjectId,
                component_type: componentType,
                semester: semester,
                score: score,
                points_earned: score,
                graded_at: new Date().toISOString(),
              });
              gradeCount++;
            }
          }
        }
      }
    }
  }

  // Insert grades in batches of 100
  const BATCH_SIZE = 100;
  for (let i = 0; i < gradeBatches.length; i += BATCH_SIZE) {
    const batch = gradeBatches.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("grades").insert(batch);
    if (error) {
      console.log(`   ⚠️ Batch ${Math.floor(i / BATCH_SIZE) + 1} error: ${error.message}`);
    }
  }
  console.log(`   ✅ Created ${gradeCount} grades in ${Math.ceil(gradeBatches.length / BATCH_SIZE)} batches`);

  // Summary
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("📊 SUMMARY");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`   Subjects: ${Object.keys(subjectMap).length}`);
  console.log(`   Classes: ${Object.keys(classMap).length}`);
  console.log(`   Students: ${studentIndex - 1}`);
  console.log(`   Enrollments: ${enrollmentCount}`);
  console.log(`   Grades: ${gradeCount}`);

  console.log("\n✨ Seeding Complete!");
}

main().catch(console.error);
