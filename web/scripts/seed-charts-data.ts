/**
 * scripts/seed-charts-data.ts
 * Enhanced seeding for chart testing - handles conflicts gracefully
 * 
 * Run with: npx tsx scripts/seed-charts-data.ts
 */

import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import * as path from "path";

// Load environment variables
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

// ============================================================================
// ADDITIONAL STUDENTS FOR CHART TESTING
// ============================================================================

const EXTRA_STUDENTS = [
  { email: "student9@bhedu.com", full_name: "Ivy Thompson", first_name: "Ivy", last_name: "Thompson" },
  { email: "student10@bhedu.com", full_name: "Jack Lee", first_name: "Jack", last_name: "Lee" },
  { email: "student11@bhedu.com", full_name: "Karen White", first_name: "Karen", last_name: "White" },
  { email: "student12@bhedu.com", full_name: "Leo Harris", first_name: "Leo", last_name: "Harris" },
  { email: "student13@bhedu.com", full_name: "Mia Clark", first_name: "Mia", last_name: "Clark" },
  { email: "student14@bhedu.com", full_name: "Noah Lewis", first_name: "Noah", last_name: "Lewis" },
  { email: "student15@bhedu.com", full_name: "Olivia Walker", first_name: "Olivia", last_name: "Walker" },
  { email: "student16@bhedu.com", full_name: "Paul Hall", first_name: "Paul", last_name: "Hall" },
  { email: "student17@bhedu.com", full_name: "Quinn Young", first_name: "Quinn", last_name: "Young" },
  { email: "student18@bhedu.com", full_name: "Rose King", first_name: "Rose", last_name: "King" },
  { email: "student19@bhedu.com", full_name: "Sam Wright", first_name: "Sam", last_name: "Wright" },
  { email: "student20@bhedu.com", full_name: "Tina Scott", first_name: "Tina", last_name: "Scott" },
  { email: "student21@bhedu.com", full_name: "Uma Green", first_name: "Uma", last_name: "Green" },
  { email: "student22@bhedu.com", full_name: "Victor Adams", first_name: "Victor", last_name: "Adams" },
  { email: "student23@bhedu.com", full_name: "Wendy Baker", first_name: "Wendy", last_name: "Baker" },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getOrCreateStudent(studentData: typeof EXTRA_STUDENTS[0]): Promise<string | null> {
  // First check if profile already exists by email
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", studentData.email)
    .single();

  if (existingProfile) {
    console.log(`   ℹ️  Student exists: ${studentData.email}`);
    return existingProfile.id;
  }

  // Check if auth user exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existingAuthUser = existingUsers?.users.find(u => u.email === studentData.email);

  let userId: string;

  if (existingAuthUser) {
    userId = existingAuthUser.id;
    console.log(`   ℹ️  Auth user exists, creating profile: ${studentData.email}`);
  } else {
    // Create new auth user
    const { data: newUser, error } = await supabase.auth.admin.createUser({
      email: studentData.email,
      password: "Password123!",
      email_confirm: true,
    });

    if (error) {
      console.log(`   ⚠️  Cannot create user ${studentData.email}: ${error.message}`);
      return null;
    }
    userId = newUser.user!.id;
  }

  // Create profile
  const studentCode = `STU${String(Math.floor(Math.random() * 9000) + 1000)}`;
  const { error: profileError } = await supabase.from("profiles").upsert({
    id: userId,
    user_id: userId,
    email: studentData.email,
    full_name: studentData.full_name,
    first_name: studentData.first_name,
    last_name: studentData.last_name,
    role: "student",
    student_code: studentCode,
    is_active: true,
  });

  if (profileError) {
    console.log(`   ⚠️  Cannot create profile ${studentData.email}: ${profileError.message}`);
    return null;
  }

  console.log(`   ✅ Created: ${studentData.email}`);
  return userId;
}

// ============================================================================
// MAIN SEEDING FUNCTIONS
// ============================================================================

async function seedExtraStudents() {
  console.log("\n📝 Adding Extra Students (15 more for chart testing)...");
  const newStudentIds: string[] = [];

  for (const student of EXTRA_STUDENTS) {
    try {
      const userId = await getOrCreateStudent(student);
      if (userId) newStudentIds.push(userId);
    } catch (err) {
      console.log(`   ⚠️  Error with ${student.email}: ${err}`);
    }
  }

  console.log(`   📊 Total new students added: ${newStudentIds.length}`);
  return newStudentIds;
}

async function enrollStudentsInClasses(studentIds: string[]) {
  console.log("\n👥 Enrolling New Students in Classes...");
  
  if (studentIds.length === 0) {
    console.log("   ℹ️  No new students to enroll");
    return [];
  }

  const { data: classes } = await supabase.from("classes").select("id, name");
  if (!classes || classes.length === 0) {
    console.log("   ⚠️ No classes found. Run seed-complete.ts first.");
    return [];
  }

  // Get existing enrollments to avoid duplicates
  const { data: existingEnrollments } = await supabase
    .from("enrollments")
    .select("student_id, class_id");
  
  const existingSet = new Set(
    existingEnrollments?.map(e => `${e.student_id}-${e.class_id}`) || []
  );

  const enrollments = [];
  for (const studentId of studentIds) {
    const numClasses = 3 + Math.floor(Math.random() * 3);
    const studentClasses = [...classes].sort(() => 0.5 - Math.random()).slice(0, numClasses);
    
    for (const cls of studentClasses) {
      const key = `${studentId}-${cls.id}`;
      if (!existingSet.has(key)) {
        enrollments.push({
          student_id: studentId,
          class_id: cls.id,
          enrollment_date: "2024-09-01",
          status: "active",
        });
      }
    }
  }

  if (enrollments.length > 0) {
    const { error } = await supabase.from("enrollments").insert(enrollments);
    if (error) console.log(`   ⚠️ Enrollment error: ${error.message}`);
    else console.log(`   ✅ Created ${enrollments.length} new enrollments`);
  } else {
    console.log("   ℹ️ All students already enrolled");
  }
  
  return enrollments;
}

async function createMoreAssignments() {
  console.log("\n📚 Creating More Assignments for Each Class...");
  
  const { data: classes } = await supabase.from("classes").select("id, name");
  if (!classes || classes.length === 0) return;

  // Check existing assignments
  const { data: existingAssignments } = await supabase.from("assignments").select("title, class_id");
  const existingSet = new Set(existingAssignments?.map(a => `${a.title}-${a.class_id}`) || []);

  const categoryNames = ["Bài kiểm tra miệng", "Bài tập về nhà", "Dự án nhóm", "Thực hành", "Thi giữa kỳ", "Thi cuối kỳ"];
  const newAssignments = [];

  for (const cls of classes) {
    for (let i = 0; i < categoryNames.length; i++) {
      const title = `${categoryNames[i]} - ${cls.name}`;
      if (!existingSet.has(`${title}-${cls.id}`)) {
        newAssignments.push({
          class_id: cls.id,
          title: title,
          description: `${categoryNames[i]} cho môn ${cls.name}`,
          due_date: new Date(2024, 9 + Math.floor(i / 2), 10 + (i * 5)).toISOString().split('T')[0],
          max_points: i >= 4 ? 150 : 100,
        });
      }
    }
  }

  if (newAssignments.length > 0) {
    const { error } = await supabase.from("assignments").insert(newAssignments);
    if (error) console.log(`   ⚠️ Error: ${error.message}`);
    else console.log(`   ✅ Created ${newAssignments.length} new assignments`);
  } else {
    console.log("   ℹ️ All assignments already exist");
  }
}

async function createVariedGrades() {
  console.log("\n📝 Creating Varied Grade Data for Chart Testing...");
  
  const { data: enrollments } = await supabase.from("enrollments").select("student_id, class_id");
  if (!enrollments || enrollments.length === 0) {
    console.log("   ⚠️ No enrollments found");
    return;
  }

  const { data: assignments } = await supabase.from("assignments").select("id, class_id");
  if (!assignments || assignments.length === 0) {
    console.log("   ⚠️ No assignments found");
    return;
  }

  // Get existing grades to avoid duplicates
  const { data: existingGrades } = await supabase.from("grades").select("student_id, assignment_id");
  const existingSet = new Set(existingGrades?.map(g => `${g.student_id}-${g.assignment_id}`) || []);

  // Grade distribution: A=15%, B=25%, C=30%, D=20%, F=10%
  function getRandomGrade() {
    const rand = Math.random();
    if (rand < 0.15) return 90 + Math.floor(Math.random() * 11);      // A: 90-100
    if (rand < 0.40) return 80 + Math.floor(Math.random() * 10);      // B: 80-89
    if (rand < 0.70) return 70 + Math.floor(Math.random() * 10);      // C: 70-79
    if (rand < 0.90) return 60 + Math.floor(Math.random() * 10);      // D: 60-69
    return 40 + Math.floor(Math.random() * 20);                        // F: 40-59
  }

  const newGrades = [];
  for (const enrollment of enrollments) {
    const classAssignments = assignments.filter(a => a.class_id === enrollment.class_id);
    
    for (const assignment of classAssignments) {
      const key = `${enrollment.student_id}-${assignment.id}`;
      if (!existingSet.has(key)) {
        const score = getRandomGrade();
        newGrades.push({
          student_id: enrollment.student_id,
          assignment_id: assignment.id,
          score: score,
          feedback: score >= 90 ? "Xuất sắc! 🌟" : 
                    score >= 80 ? "Tốt lắm! 👍" : 
                    score >= 70 ? "Khá. Cần cố gắng thêm." : 
                    score >= 60 ? "Đạt. Cần nỗ lực nhiều hơn." : 
                    "Chưa đạt. Xin gặp riêng để hỗ trợ.",
          graded_at: new Date().toISOString(),
        });
      }
    }
  }

  if (newGrades.length > 0) {
    // Insert in batches
    const batchSize = 100;
    let insertedCount = 0;
    for (let i = 0; i < newGrades.length; i += batchSize) {
      const batch = newGrades.slice(i, i + batchSize);
      const { error } = await supabase.from("grades").insert(batch);
      if (!error) insertedCount += batch.length;
    }
    console.log(`   ✅ Created ${insertedCount} new grade records`);
  } else {
    console.log("   ℹ️ All grades already exist");
  }
}

async function createMoreAttendance() {
  console.log("\n📅 Creating Extended Attendance Data...");
  
  const { data: enrollments } = await supabase.from("enrollments").select("student_id, class_id");
  if (!enrollments) return;

  // Get existing attendance dates
  const { data: existingAtt } = await supabase
    .from("attendance")
    .select("student_id, class_id, date");
  
  const existingSet = new Set(
    existingAtt?.map(a => `${a.student_id}-${a.class_id}-${a.date}`) || []
  );

  const newAttendance = [];
  
  // Create attendance for days 30-60 (older records)
  for (let day = 30; day < 60; day++) {
    const date = new Date();
    date.setDate(date.getDate() - day);
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    
    const dateStr = date.toISOString().split("T")[0];

    for (const enrollment of enrollments) {
      const key = `${enrollment.student_id}-${enrollment.class_id}-${dateStr}`;
      if (!existingSet.has(key)) {
        const rand = Math.random();
        const status = rand < 0.78 ? "present" : 
                       rand < 0.88 ? "absent" : 
                       rand < 0.94 ? "late" : 
                       rand < 0.98 ? "excused" : "half_day";

        newAttendance.push({
          student_id: enrollment.student_id,
          class_id: enrollment.class_id,
          date: dateStr,
          status: status,
          notes: status === "absent" ? "Vắng không phép" : 
                 status === "excused" ? "Có đơn xin phép" : null,
        });
      }
    }
  }

  if (newAttendance.length > 0) {
    const batchSize = 500;
    let insertedCount = 0;
    for (let i = 0; i < newAttendance.length; i += batchSize) {
      const batch = newAttendance.slice(i, i + batchSize);
      const { error } = await supabase.from("attendance").insert(batch);
      if (!error) insertedCount += batch.length;
    }
    console.log(`   ✅ Created ${insertedCount} new attendance records`);
  } else {
    console.log("   ℹ️ Attendance data already exists for this period");
  }
}

// ============================================================================
// VERIFICATION
// ============================================================================

async function verify() {
  console.log("\n🔍 Final Data Summary...\n");

  const checks = [
    { name: "profiles", label: "Students", filter: { role: "student" } },
    { name: "classes", label: "Classes" },
    { name: "enrollments", label: "Enrollments" },
    { name: "assignments", label: "Assignments" },
    { name: "grades", label: "Grades" },
    { name: "attendance", label: "Attendance" },
  ];

  for (const check of checks) {
    let query = supabase.from(check.name).select("*", { count: "exact", head: true });
    if (check.filter) {
      for (const [k, v] of Object.entries(check.filter)) {
        query = query.eq(k, v);
      }
    }
    const { count } = await query;
    console.log(`   ✅ ${check.label}: ${count || 0} records`);
  }

  // Grade distribution
  const { data: grades } = await supabase.from("grades").select("score");
  if (grades && grades.length > 0) {
    const dist = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    for (const g of grades) {
      if (g.score >= 90) dist.A++;
      else if (g.score >= 80) dist.B++;
      else if (g.score >= 70) dist.C++;
      else if (g.score >= 60) dist.D++;
      else dist.F++;
    }
    console.log(`\n   📊 Grade Distribution:`);
    console.log(`      A (90-100): ${dist.A} | B (80-89): ${dist.B} | C (70-79): ${dist.C} | D (60-69): ${dist.D} | F (<60): ${dist.F}`);
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log("🌱 Starting Chart Test Data Seeding (Conflict-Safe)...\n");
  console.log("📍 Supabase URL:", url.substring(0, 40) + "...");

  try {
    const newStudentIds = await seedExtraStudents();
    await enrollStudentsInClasses(newStudentIds);
    await createMoreAssignments();
    await createVariedGrades();
    await createMoreAttendance();
    await verify();

    console.log("\n🎉 Chart test data seeding completed!");
    console.log("\n📊 You can now view charts at:");
    console.log("   - /dashboard/grades/analytics");
    console.log("   - /dashboard/students/[id]/progress");

  } catch (error) {
    console.error("\n❌ Seeding failed:", error);
    process.exit(1);
  }
}

main();
