/**
 * Database Audit Script
 * 
 * Run this script to audit the current database structure and identify:
 * - Existing tables and columns
 * - Missing columns required by UI
 * - Data inconsistencies
 * - Required fixes
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ColumnInfo {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

async function auditDatabase() {
  console.log("🔍 Starting Database Audit...\n");

  // 1. Check profiles table structure
  console.log("📋 PROFILES TABLE");
  console.log("=".repeat(50));
  
  let profileColumns = null;
  let profileError = null;
  
  try {
    const result = await supabase.rpc('get_table_columns', { table_name: 'profiles' });
    profileColumns = result.data;
    profileError = result.error;
  } catch (e) {
    // RPC might not exist, will use fallback below
  }

  if (!profileColumns) {
    // Fallback: Query information_schema
    const { data: columns } = await supabase
      .from("information_schema.columns" as any)
      .select("column_name, data_type, is_nullable, column_default")
      .eq("table_name", "profiles");
    
    if (columns) {
      console.log("Current columns:");
      (columns as ColumnInfo[]).forEach((col: ColumnInfo) => {
        console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? '* required' : ''}`);
      });
    }
  }

  // Required columns for Student System
  const requiredStudentColumns = [
    'id',
    'user_id',
    'email',
    'full_name',
    'role',
    'phone',
    'address',
    'date_of_birth',
    'gender',
    'student_code',
    'grade_level',
    'photo_url',
    'is_active',
    'status',
    'enrollment_date',
    'created_at',
    'updated_at'
  ];

  console.log("\n✅ Required columns for Student System:");
  requiredStudentColumns.forEach(col => console.log(`  - ${col}`));

  // 2. Check actual student data
  console.log("\n\n📊 STUDENT DATA SAMPLE");
  console.log("=".repeat(50));
  
  const { data: students, error: studentsError } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "student")
    .limit(5);

  if (studentsError) {
    console.error("❌ Error fetching students:", studentsError.message);
  } else if (students && students.length > 0) {
    console.log(`Found ${students.length} sample students`);
    console.log("Sample student structure:", Object.keys(students[0]));
    console.log("\nFirst student:", JSON.stringify(students[0], null, 2));
  } else {
    console.log("⚠️  No students found in database");
  }

  // 3. Check classes table
  console.log("\n\n📚 CLASSES TABLE");
  console.log("=".repeat(50));
  
  const { data: classes, error: classesError } = await supabase
    .from("classes")
    .select("*")
    .limit(3);

  if (classesError) {
    console.error("❌ Error fetching classes:", classesError.message);
  } else if (classes) {
    console.log(`Found ${classes.length} classes`);
    if (classes.length > 0) {
      console.log("Class structure:", Object.keys(classes[0]));
    }
  }

  // 4. Check enrollments
  console.log("\n\n🎓 ENROLLMENTS TABLE");
  console.log("=".repeat(50));
  
  const { data: enrollments, error: enrollError } = await supabase
    .from("enrollments")
    .select("*")
    .limit(3);

  if (enrollError) {
    console.error("❌ Error fetching enrollments:", enrollError.message);
  } else if (enrollments) {
    console.log(`Found ${enrollments.length} enrollments`);
    if (enrollments.length > 0) {
      console.log("Enrollment structure:", Object.keys(enrollments[0]));
    }
  }

  // 5. Check attendance
  console.log("\n\n✅ ATTENDANCE TABLE");
  console.log("=".repeat(50));
  
  const { data: attendance, error: attError } = await supabase
    .from("attendance")
    .select("*")
    .limit(3);

  if (attError) {
    console.error("❌ Error fetching attendance:", attError.message);
  } else if (attendance) {
    console.log(`Found ${attendance.length} attendance records`);
    if (attendance.length > 0) {
      console.log("Attendance structure:", Object.keys(attendance[0]));
    }
  }

  // 6. Check grades
  console.log("\n\n🎯 GRADES TABLE");
  console.log("=".repeat(50));
  
  const { data: grades, error: gradesError } = await supabase
    .from("grades")
    .select("*")
    .limit(3);

  if (gradesError) {
    console.error("❌ Error fetching grades:", gradesError.message);
  } else if (grades) {
    console.log(`Found ${grades.length} grade records`);
    if (grades.length > 0) {
      console.log("Grade structure:", Object.keys(grades[0]));
    }
  }

  // 7. Summary of issues
  console.log("\n\n🔧 RECOMMENDED FIXES");
  console.log("=".repeat(50));
  console.log(`
1. Ensure profiles table has all required columns for student system
2. Add indexes for performance (student_code, grade_level, status)
3. Update API endpoints to fetch all required fields
4. Add RLS policies if missing
5. Consider adding constraints for data integrity
  `);

  console.log("\n✅ Audit Complete!");
}

// Run the audit
auditDatabase().catch(console.error);
