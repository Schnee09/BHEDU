/**
 * scripts/seed.ts
 * Complete database seeding with test users and sample data
 * 
 * Run with: npx tsx scripts/seed.ts
 * Or: pnpm tsx scripts/seed.ts
 *
 * ✅ Automatically replaces duplicate users
 * ✅ Uses service role to bypass RLS
 * ✅ Creates users, profiles, classes, enrollments, assignments, scores, and attendance
 * ✅ Loads from .env or .env.local
 */

import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import * as path from "path";

// Load from .env or .env.local (prioritize .env.local for production safety)
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !service) {
  console.error("❌ Missing Supabase credentials in .env or .env.local");
  process.exit(1);
}

console.log("🌍 Using Supabase URL:", url);
console.log("🔑 Using Service Key Prefix:", service.substring(0, 16));
console.log("♻️  Mode: Replace existing users\n");

const supabase = createClient(url, service, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  db: {
    schema: 'public',
  },
});

// ------------------------------------------------------------------
// 🧩 Base test data
// ------------------------------------------------------------------
const users = [
  { email: "admin@bhedu.com", password: "test123", role: "admin", full_name: "Admin User" },
  { email: "teacher@bhedu.com", password: "teacher123", role: "teacher", full_name: "Shin Ookami" },
  { email: "sara@student.com", password: "student123", role: "student", full_name: "Sara Suigetsu" },
  { email: "charlie@student.com", password: "student123", role: "student", full_name: "Charlie Student" },
  { email: "dana@student.com", password: "student123", role: "student", full_name: "Dana Student" },
  { email: "alex@student.com", password: "student123", role: "student", full_name: "Alex Student" },
];

// ------------------------------------------------------------------
// 🧰 Helpers
// ------------------------------------------------------------------
async function forceDeleteUser(email: string) {
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) {
      throw new Error(`Failed to list users for deletion check: ${error.message}`);
    }
    const existing = data.users.find((u) => u.email === email);
    if (existing) {
      // Delete auth user (profile will be cascade deleted if FK is set up)
      const { error: delError } = await supabase.auth.admin.deleteUser(existing.id);
      if (delError) {
        throw new Error(`Failed to delete existing user ${email}: ${delError.message}`);
      }
      console.log(`🗑️  Removed old user: ${email} (ID: ${existing.id})`);
      
      // Also try to delete profile directly (if cascade didn't work)
      await supabase.from("profiles").delete().eq("id", existing.id);
      
      return true;
    }
    return false;
  } catch (error) {
    console.error(`⚠️  Error in forceDeleteUser for ${email}:`, error);
    throw error;
  }
}

async function getOrCreateUser(u: { email: string; password: string; role: string; full_name: string }) {
  try {
    // Always delete existing user first (force replace)
    const wasDeleted = await forceDeleteUser(u.email);
    if (wasDeleted) {
      // Wait a bit to ensure deletion is complete
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Create new user
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { full_name: u.full_name, role: u.role },
    });

    if (error || !data?.user) {
      console.error(`❌ Failed to create ${u.email}:`, error?.message || 'No user data returned');
      console.dir(error, { depth: null });
      throw error || new Error('User creation failed');
    }

    console.log(`✅ Created user: ${u.email} (ID: ${data.user.id})`);
    return data.user.id;
  } catch (error) {
    console.error(`❌ Error in getOrCreateUser for ${u.email}:`, error);
    throw error;
  }
}

async function upsertProfile(id: string, u: { full_name: string; role: string; email: string }) {
  try {
    // Use insert instead of upsert to avoid RLS issues
    // First try to delete any existing profile with this ID
    await supabase.from("profiles").delete().eq("id", id);
    
    // Then insert fresh
    const { error } = await supabase.from("profiles").insert({
      id,
      full_name: u.full_name,
      role: u.role,
      email: u.email,
    });

    if (error) {
      throw new Error(`Profile insert failed for ${u.email}: ${error.message}`);
    }
    console.log(`✅ Profile created for ${u.email}`);
  } catch (error) {
    console.error(`⚠️  Profile error (${u.email}):`, error);
    throw error;
  }
}

// ------------------------------------------------------------------
// 🚀 Main seeding logic
// ------------------------------------------------------------------
async function main() {
  console.log("🌱 Starting Supabase seed (force replace mode)...\n");

  const userIds: Record<string, string> = {};
  console.log("👥 Processing users (deleting old, creating new)...");
  for (const u of users) {
    try {
      const id = await getOrCreateUser(u);
      userIds[u.email] = id;
      await upsertProfile(id, u);
    } catch (error) {
      console.error(`❌ Failed to process ${u.email}`);
      throw error; // Stop on any user failure
    }
  }

  console.log("\n✅ All users created and profiles linked!\n");

  // Validate user IDs
  for (const email of users.map((u) => u.email)) {
    if (!userIds[email]) {
      throw new Error(`No user ID for ${email}. Aborting.`);
    }
  }

  // Classes
  console.log("→ Ensuring sample classes...");
  let classIds: string[] = [];
  try {
    const { data: classes, error: clsErr } = await supabase.from("classes").select("id");
    if (clsErr) {
      throw new Error(`Class fetch error: ${clsErr.message}`);
    }

    if (!classes || classes.length === 0) {
      const { data, error } = await supabase
        .from("classes")
        .insert([
          { name: "Math 101", teacher_id: userIds["teacher@bhedu.com"] },
          { name: "Science 102", teacher_id: userIds["teacher@bhedu.com"] },
        ])
        .select("id");
      if (error) {
        throw new Error(`Class creation error: ${error.message}`);
      }
      classIds = data.map((c) => c.id);
      console.log("✅ Classes created");
    } else {
      classIds = classes.map((c) => c.id);
      console.log("✅ Classes already exist");
    }
  } catch (error) {
    console.error("❌ Class setup failed:", error);
    throw error;
  }

  // Enrollments
  console.log("→ Creating enrollments...");
  for (const studentEmail of ["sara@student.com", "charlie@student.com", "dana@student.com", "alex@student.com"]) {
    if (!userIds[studentEmail]) {
      console.error(`⚠️ Skipping enrollment for ${studentEmail}: User ID not found`);
      continue;
    }
    for (const classId of classIds) {
      try {
        const { data: existing } = await supabase
          .from("enrollments")
          .select("id")
          .eq("student_id", userIds[studentEmail])
          .eq("class_id", classId)
          .maybeSingle();

        if (!existing) {
          const { error } = await supabase.from("enrollments").insert({
            student_id: userIds[studentEmail],
            class_id: classId,
          });
          if (error) {
            throw new Error(`Enrollment error (${studentEmail} → Class ${classId}): ${error.message}`);
          }
          console.log(`✅ Enrolled ${studentEmail} → Class ${classId}`);
        }
      } catch (error) {
        console.error(`❌ Enrollment failed for ${studentEmail}:`, error);
        throw error;
      }
    }
  }

  // Assignments
  console.log("→ Creating assignments...");
  try {
    const { data: existingAssignments } = await supabase.from("assignments").select("id");
    if (!existingAssignments || existingAssignments.length === 0) {
      const { error } = await supabase.from("assignments").insert([
        { class_id: classIds[0], title: "Homework 1", description: "Basic Algebra" },
        { class_id: classIds[1], title: "Experiment 1", description: "Lab Safety" },
      ]);
      if (error) {
        throw new Error(`Assignment creation error: ${error.message}`);
      }
      console.log("✅ Assignments created");
    } else {
      console.log("✅ Assignments already exist");
    }
  } catch (error) {
    console.error("❌ Assignment setup failed:", error);
    throw error;
  }

  // Scores
  // Grades
  console.log("→ Inserting grades...");
  try {
    // First, get assignment IDs that were created
    const { data: assignments } = await supabase.from("assignments").select("id").limit(2);
    
    if (!assignments || assignments.length < 2) {
      console.log("⚠️  Skipping grades - not enough assignments");
    } else {
      const { data: existingGrades } = await supabase.from("grades").select("id");
      if (!existingGrades || existingGrades.length === 0) {
        const { error } = await supabase.from("grades").insert([
          { 
            student_id: userIds["sara@student.com"], 
            assignment_id: assignments[0].id, 
            score: 95, 
            feedback: "Excellent work!" 
          },
          { 
            student_id: userIds["charlie@student.com"], 
            assignment_id: assignments[0].id, 
            score: 88, 
            feedback: "Good job!" 
          },
        ]);
        if (error) {
          throw new Error(`Grade insertion error: ${error.message}`);
        }
        console.log("✅ Grades inserted");
      } else {
        console.log("✅ Grades already exist");
      }
    }
  } catch (error) {
    console.error("❌ Grade setup failed:", error);
    throw error;
  }

  // Attendance
  console.log("→ Recording attendance...");
  try {
    const { data: existingAttendance } = await supabase.from("attendance").select("id");
    if (!existingAttendance || existingAttendance.length === 0) {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const { error } = await supabase.from("attendance").insert([
        { 
          student_id: userIds["sara@student.com"], 
          class_id: classIds[0], 
          date: today,
          status: "present" 
        },
        { 
          student_id: userIds["charlie@student.com"], 
          class_id: classIds[0], 
          date: today,
          status: "absent" 
        },
      ]);
      if (error) {
        throw new Error(`Attendance insertion error: ${error.message}`);
      }
      console.log("✅ Attendance recorded");
    } else {
      console.log("✅ Attendance already exist");
    }
  } catch (error) {
    console.error("❌ Attendance setup failed:", error);
    throw error;
  }

  console.log("🌟 Seeding complete!");
  console.log("\n📝 Test credentials:");
  console.log("   Admin: admin@bhedu.com / admin123");
  console.log("   Teacher: teacher@bhedu.com / teacher123");
  console.log("   Students: sara@student.com, charlie@student.com, dana@student.com, alex@student.com / student123");
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});