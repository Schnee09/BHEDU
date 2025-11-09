/**
 * scripts/seed.ts
 * Run with: npx tsx scripts/seed.ts
 *
 * ✅ Automatically cleans duplicates
 * ✅ Uses service role to bypass RLS
 * ✅ Creates users, profiles, and test data
 */

import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: "./.env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !service) {
  console.error("❌ Missing Supabase credentials in .env.local");
  process.exit(1);
}

console.log("🌍 Using Supabase URL:", url);
console.log("🔑 Using Service Key Prefix:", service.substring(0, 16));

const supabase = createClient(url, service, {
  auth: { persistSession: false },
  global: { headers: { Authorization: `Bearer ${service}` } },
});

// ------------------------------------------------------------------
// 🧩 Base test data
// ------------------------------------------------------------------
const users = [
  { email: "admin@example.com", password: "password", role: "admin", full_name: "Admin User" },
  { email: "shin@example.com", password: "password", role: "teacher", full_name: "Shin Ookami" },
  { email: "sara@example.com", password: "password", role: "student", full_name: "Sara Suigetsu" },
  { email: "a@example.com", password: "password", role: "student", full_name: "Student A" },
  { email: "b@example.com", password: "password", role: "student", full_name: "Student B" },
  { email: "c@example.com", password: "password", role: "student", full_name: "Student C" },
];

// ------------------------------------------------------------------
// 🧰 Helpers
// ------------------------------------------------------------------
async function safeDeleteUser(email: string) {
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) {
      throw new Error(`Failed to list users for deletion check: ${error.message}`);
    }
    const existing = data.users.find((u) => u.email === email);
    if (existing) {
      const { error: delError } = await supabase.auth.admin.deleteUser(existing.id);
      if (delError) {
        throw new Error(`Failed to delete existing user ${email}: ${delError.message}`);
      }
      console.log(`🗑️ Removed duplicate: ${email}`);
    }
  } catch (error) {
    console.error(`⚠️ Error in safeDeleteUser for ${email}:`, error);
    throw error;
  }
}

async function getOrCreateUser(u: { email: string; password: string; role: string; full_name: string }) {
  try {
    // Check if user exists using listUsers
    const { data: userList, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      throw new Error(`Failed to list users for ${u.email}: ${listError.message}`);
    }
    const existingUser = userList.users.find((user) => user.email === u.email);
    if (existingUser) {
      console.log(`✅ User already exists: ${u.email}`);
      return existingUser.id;
    }

    // Delete any duplicates (for safety, though redundant here)
    await safeDeleteUser(u.email);

    // Create user
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

    console.log(`✅ Created user: ${u.email}`);
    return data.user.id;
  } catch (error) {
    console.error(`❌ Error in getOrCreateUser for ${u.email}:`, error);
    throw error;
  }
}

async function upsertProfile(id: string, u: { full_name: string; role: string; email: string }) {
  try {
    const { error } = await supabase.from("profiles").upsert({
      id,
      full_name: u.full_name,
      role: u.role,
      email: u.email,
    });

    if (error) {
      throw new Error(`Profile upsert failed for ${u.email}: ${error.message}`);
    }
    console.log(`✅ Profile linked for ${u.email}`);
  } catch (error) {
    console.error(`⚠️ Profile error (${u.email}):`, error);
    throw error;
  }
}

// ------------------------------------------------------------------
// 🚀 Main seeding logic
// ------------------------------------------------------------------
async function main() {
  console.log("🌱 Starting Supabase seed...");

  const userIds: Record<string, string> = {};
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
          { name: "Math 101", teacher_id: userIds["shin@example.com"] },
          { name: "Science 102", teacher_id: userIds["shin@example.com"] },
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
  for (const studentEmail of ["sara@example.com", "a@example.com", "b@example.com", "c@example.com"]) {
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
  console.log("→ Inserting scores...");
  try {
    const { data: existingScores } = await supabase.from("scores").select("id");
    if (!existingScores || existingScores.length === 0) {
      const { error } = await supabase.from("scores").insert([
        { student_id: userIds["sara@example.com"], class_id: classIds[0], score: 95 },
        { student_id: userIds["a@example.com"], class_id: classIds[0], score: 88 },
      ]);
      if (error) {
        throw new Error(`Score insertion error: ${error.message}`);
      }
      console.log("✅ Scores inserted");
    } else {
      console.log("✅ Scores already exist");
    }
  } catch (error) {
    console.error("❌ Score setup failed:", error);
    throw error;
  }

  // Attendance
  console.log("→ Recording attendance...");
  try {
    const { data: existingAttendance } = await supabase.from("attendance").select("id");
    if (!existingAttendance || existingAttendance.length === 0) {
      const { error } = await supabase.from("attendance").insert([
        { student_id: userIds["sara@example.com"], class_id: classIds[0], status: "present" },
        { student_id: userIds["a@example.com"], class_id: classIds[0], status: "absent" },
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
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});