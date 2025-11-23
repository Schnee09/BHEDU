/**
 * scripts/seed-complete.ts
 * Comprehensive database seeding with data for ALL tables
 * 
 * Run with: npx tsx scripts/seed-complete.ts
 * 
 * ✅ Seeds ALL tables with realistic test data
 * ✅ Auto-verifies data after seeding
 * ✅ Replaces existing data (safe for development)
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
// TEST DATA DEFINITIONS
// ============================================================================

const USERS = [
  { email: "admin@bhedu.com", password: "Password123!", role: "admin", full_name: "Admin User", first_name: "Admin", last_name: "User" },
  { email: "schnee@example.com", password: "Password123!", role: "admin", full_name: "Schnee Ookami", first_name: "Schnee", last_name: "Ookami" },
  { email: "teacher1@bhedu.com", password: "Password123!", role: "teacher", full_name: "John Smith", first_name: "John", last_name: "Smith" },
  { email: "teacher2@bhedu.com", password: "Password123!", role: "teacher", full_name: "Emily Johnson", first_name: "Emily", last_name: "Johnson" },
  { email: "teacher3@bhedu.com", password: "Password123!", role: "teacher", full_name: "Michael Brown", first_name: "Michael", last_name: "Brown" },
  { email: "student1@bhedu.com", password: "Password123!", role: "student", full_name: "Alice Williams", first_name: "Alice", last_name: "Williams" },
  { email: "student2@bhedu.com", password: "Password123!", role: "student", full_name: "Bob Davis", first_name: "Bob", last_name: "Davis" },
  { email: "student3@bhedu.com", password: "Password123!", role: "student", full_name: "Charlie Miller", first_name: "Charlie", last_name: "Miller" },
  { email: "student4@bhedu.com", password: "Password123!", role: "student", full_name: "Diana Garcia", first_name: "Diana", last_name: "Garcia" },
  { email: "student5@bhedu.com", password: "Password123!", role: "student", full_name: "Ethan Martinez", first_name: "Ethan", last_name: "Martinez" },
  { email: "student6@bhedu.com", password: "Password123!", role: "student", full_name: "Fiona Rodriguez", first_name: "Fiona", last_name: "Rodriguez" },
  { email: "student7@bhedu.com", password: "Password123!", role: "student", full_name: "George Wilson", first_name: "George", last_name: "Wilson" },
  { email: "student8@bhedu.com", password: "Password123!", role: "student", full_name: "Hannah Anderson", first_name: "Hannah", last_name: "Anderson" },
];

const ACADEMIC_YEARS = [
  { name: "2024-2025", start_date: "2024-09-01", end_date: "2025-06-30", is_current: true },
  { name: "2023-2024", start_date: "2023-09-01", end_date: "2024-06-30", is_current: false },
  { name: "2025-2026", start_date: "2025-09-01", end_date: "2026-06-30", is_current: false },
];

const GRADING_SCALES = [
  { name: "Standard Scale", description: "Traditional A-F grading", is_default: true },
  { name: "Pass/Fail", description: "Simple pass or fail", is_default: false },
];

const GRADE_SCALE_ITEMS = [
  // Standard Scale
  { grade: "A", min_score: 90, max_score: 100, gpa_value: 4.0, description: "Excellent" },
  { grade: "B", min_score: 80, max_score: 89, gpa_value: 3.0, description: "Good" },
  { grade: "C", min_score: 70, max_score: 79, gpa_value: 2.0, description: "Average" },
  { grade: "D", min_score: 60, max_score: 69, gpa_value: 1.0, description: "Below Average" },
  { grade: "F", min_score: 0, max_score: 59, gpa_value: 0.0, description: "Failing" },
  // Pass/Fail
  { grade: "P", min_score: 60, max_score: 100, gpa_value: null, description: "Pass" },
  { grade: "F", min_score: 0, max_score: 59, gpa_value: null, description: "Fail" },
];

const CLASSES = [
  { name: "Mathematics 101", description: "Introduction to Algebra", grade_level: "9th Grade" },
  { name: "English Literature", description: "Classic and Modern Literature", grade_level: "9th Grade" },
  { name: "Biology", description: "Introduction to Life Sciences", grade_level: "10th Grade" },
  { name: "World History", description: "Ancient to Modern History", grade_level: "10th Grade" },
  { name: "Chemistry", description: "Introduction to Chemical Sciences", grade_level: "11th Grade" },
  { name: "Physics", description: "Classical and Modern Physics", grade_level: "11th Grade" },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function deleteUser(email: string) {
  const { data: existing } = await supabase.auth.admin.listUsers();
  const user = existing.users.find((u) => u.email === email);
  if (user) {
    await supabase.auth.admin.deleteUser(user.id);
    console.log(`   🗑️  Deleted existing user: ${email}`);
  }
}

async function createUser(userData: typeof USERS[0]) {
  // Delete if exists
  await deleteUser(userData.email);

  // Create auth user
  const { data, error } = await supabase.auth.admin.createUser({
    email: userData.email,
    password: userData.password,
    email_confirm: true,
  });

  if (error) throw new Error(`Failed to create user ${userData.email}: ${error.message}`);
  if (!data.user) throw new Error(`No user returned for ${userData.email}`);

  // Create profile
  const { error: profileError } = await supabase.from("profiles").insert({
    id: data.user.id,
    user_id: data.user.id,
    email: userData.email,
    full_name: userData.full_name,
    first_name: userData.first_name,
    last_name: userData.last_name,
    role: userData.role,
  });

  if (profileError) throw new Error(`Failed to create profile for ${userData.email}: ${profileError.message}`);

  console.log(`   ✅ Created: ${userData.email} (${userData.role})`);
  return data.user.id;
}

// ============================================================================
// SEEDING FUNCTIONS
// ============================================================================

async function seedUsers() {
  console.log("\n📝 Seeding Users & Profiles...");
  const userIds: Record<string, string> = {};

  for (const user of USERS) {
    const userId = await createUser(user);
    userIds[user.email] = userId;
  }

  return userIds;
}

async function seedAcademicYears() {
  console.log("\n📅 Seeding Academic Years...");
  
  // Clear existing
  await supabase.from("academic_years").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  const { data, error } = await supabase
    .from("academic_years")
    .insert(ACADEMIC_YEARS)
    .select();

  if (error) throw new Error(`Failed to seed academic years: ${error.message}`);
  console.log(`   ✅ Created ${data.length} academic years`);
  return data;
}

async function seedGradingScales() {
  console.log("\n📊 Seeding Grading Scales...");
  
  // Clear existing
  await supabase.from("grading_scales").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  const { data: scales, error } = await supabase
    .from("grading_scales")
    .insert(GRADING_SCALES)
    .select();

  if (error) throw new Error(`Failed to seed grading scales: ${error.message}`);

  // Seed grade scale items
  const items = GRADE_SCALE_ITEMS.map((item, idx) => ({
    ...item,
    grading_scale_id: scales[idx < 5 ? 0 : 1].id, // First 5 items to Standard, rest to Pass/Fail
  }));

  const { error: itemsError } = await supabase.from("grade_scale_items").insert(items);
  if (itemsError) throw new Error(`Failed to seed grade scale items: ${itemsError.message}`);

  console.log(`   ✅ Created ${scales.length} grading scales with ${items.length} items`);
  return scales;
}

async function seedClasses(userIds: Record<string, string>, academicYearId: string) {
  console.log("\n🏫 Seeding Classes...");
  
  // Clear existing
  await supabase.from("classes").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  const teachers = USERS.filter(u => u.role === "teacher");
  const classesData = CLASSES.map((cls, idx) => ({
    ...cls,
    teacher_id: userIds[teachers[idx % teachers.length].email],
    academic_year_id: academicYearId,
  }));

  const { data, error } = await supabase
    .from("classes")
    .insert(classesData)
    .select();

  if (error) throw new Error(`Failed to seed classes: ${error.message}`);
  console.log(`   ✅ Created ${data.length} classes`);
  return data;
}

async function seedEnrollments(userIds: Record<string, string>, classes: any[]) {
  console.log("\n👥 Seeding Enrollments...");
  
  // Clear existing
  await supabase.from("enrollments").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  const students = USERS.filter(u => u.role === "student");
  const enrollments = [];

  // Enroll each student in 3-4 random classes
  for (const student of students) {
    const numClasses = 3 + Math.floor(Math.random() * 2); // 3 or 4 classes
    const studentClasses = classes.sort(() => 0.5 - Math.random()).slice(0, numClasses);
    
    for (const cls of studentClasses) {
      enrollments.push({
        student_id: userIds[student.email],
        class_id: cls.id,
        enrollment_date: "2024-09-01",
      });
    }
  }

  const { error } = await supabase.from("enrollments").insert(enrollments);
  if (error) throw new Error(`Failed to seed enrollments: ${error.message}`);
  
  console.log(`   ✅ Created ${enrollments.length} enrollments`);
  return enrollments;
}

async function seedAssignments(classes: any[]) {
  console.log("\n📚 Seeding Assignments...");
  
  // Clear existing
  await supabase.from("assignments").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  const assignments = [];
  
  for (const cls of classes) {
    // Create 3-5 assignments per class
    const numAssignments = 3 + Math.floor(Math.random() * 3);
    
    for (let i = 1; i <= numAssignments; i++) {
      assignments.push({
        class_id: cls.id,
        title: `Assignment ${i}`,
        description: `${cls.name} - Assignment ${i}`,
        due_date: new Date(2024, 10, i * 7).toISOString(), // Spread across weeks
        max_score: 100,
      });
    }
  }

  const { data, error } = await supabase
    .from("assignments")
    .insert(assignments)
    .select();

  if (error) throw new Error(`Failed to seed assignments: ${error.message}`);
  console.log(`   ✅ Created ${data.length} assignments`);
  return data;
}

async function seedGrades(enrollments: any[], assignments: any[]) {
  console.log("\n📝 Seeding Grades...");
  
  // Clear existing
  await supabase.from("grades").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  const grades = [];

  // For each enrollment, create grades for assignments in that class
  for (const enrollment of enrollments) {
    const classAssignments = assignments.filter(a => a.class_id === enrollment.class_id);
    
    for (const assignment of classAssignments) {
      // Random score between 60-100
      const score = 60 + Math.floor(Math.random() * 41);
      
      grades.push({
        student_id: enrollment.student_id,
        assignment_id: assignment.id,
        score: score,
        feedback: score >= 90 ? "Excellent work!" : score >= 80 ? "Good job!" : score >= 70 ? "Keep improving" : "Needs more effort",
      });
    }
  }

  const { error } = await supabase.from("grades").insert(grades);
  if (error) throw new Error(`Failed to seed grades: ${error.message}`);
  
  console.log(`   ✅ Created ${grades.length} grades`);
}

async function seedAttendance(enrollments: any[]) {
  console.log("\n✅ Seeding Attendance...");
  
  // Clear existing
  await supabase.from("attendance").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  const attendance = [];
  const statuses = ["present", "absent", "late", "excused"];

  // Create attendance for last 30 days
  for (let day = 0; day < 30; day++) {
    const date = new Date();
    date.setDate(date.getDate() - day);
    const dateStr = date.toISOString().split("T")[0];

    for (const enrollment of enrollments) {
      // Random attendance status (80% present, 10% absent, 5% late, 5% excused)
      const rand = Math.random();
      const status = rand < 0.8 ? "present" : rand < 0.9 ? "absent" : rand < 0.95 ? "late" : "excused";

      attendance.push({
        student_id: enrollment.student_id,
        class_id: enrollment.class_id,
        date: dateStr,
        status: status,
        notes: status === "absent" ? "Unexcused absence" : status === "excused" ? "Doctor's appointment" : null,
      });
    }
  }

  const { error } = await supabase.from("attendance").insert(attendance);
  if (error) throw new Error(`Failed to seed attendance: ${error.message}`);
  
  console.log(`   ✅ Created ${attendance.length} attendance records`);
}

// ============================================================================
// VERIFICATION FUNCTIONS
// ============================================================================

async function verifyData() {
  console.log("\n🔍 Verifying Seeded Data...\n");

  const tables = [
    { name: "profiles", expectedMin: 13 },
    { name: "academic_years", expectedMin: 3 },
    { name: "grading_scales", expectedMin: 2 },
    { name: "grade_scale_items", expectedMin: 7 },
    { name: "classes", expectedMin: 6 },
    { name: "enrollments", expectedMin: 20 },
    { name: "assignments", expectedMin: 18 },
    { name: "grades", expectedMin: 50 },
    { name: "attendance", expectedMin: 500 },
  ];

  let allPassed = true;

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table.name)
      .select("*", { count: "exact", head: true });

    if (error) {
      console.log(`   ❌ ${table.name}: Error - ${error.message}`);
      allPassed = false;
    } else if (count === null || count < table.expectedMin) {
      console.log(`   ⚠️  ${table.name}: ${count || 0} records (expected >= ${table.expectedMin})`);
      allPassed = false;
    } else {
      console.log(`   ✅ ${table.name}: ${count} records`);
    }
  }

  return allPassed;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log("🌱 Starting Complete Database Seed...\n");
  console.log("📍 Supabase URL:", url);
  console.log("🔑 Service Key:", service.substring(0, 20) + "...");

  try {
    // Seed in order (respecting foreign key dependencies)
    const userIds = await seedUsers();
    const academicYears = await seedAcademicYears();
    const gradingScales = await seedGradingScales();
    const classes = await seedClasses(userIds, academicYears[0].id);
    const enrollments = await seedEnrollments(userIds, classes);
    const assignments = await seedAssignments(classes);
    await seedGrades(enrollments, assignments);
    await seedAttendance(enrollments);

    // Verify
    const verified = await verifyData();

    if (verified) {
      console.log("\n🎉 Database seeding completed successfully!");
      console.log("\n📋 Test Credentials:");
      console.log("   Admin:   admin@bhedu.com / Password123!");
      console.log("   Admin:   schnee@example.com / Password123!");
      console.log("   Teacher: teacher1@bhedu.com / Password123!");
      console.log("   Student: student1@bhedu.com / Password123!");
    } else {
      console.log("\n⚠️  Seeding completed with warnings. Check the verification results above.");
    }

  } catch (error) {
    console.error("\n❌ Seeding failed:", error);
    process.exit(1);
  }
}

main();
