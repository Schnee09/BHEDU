/**
 * Master Seed Script for BH-EDU (Improved V2)
 *
 * Improvements:
 * - Robust Profile handling (Update vs Upsert to avoid duplicates from triggers)
 * - Academic Years, Extended Profiles, Attendance History
 * - Batch inserts for performance
 * - Pre-fetching users for reliable lookups
 *
 * Run with: npm run seed
 */

import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase URL or Service Role Key in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// -- Constants --
const ACADEMIC_YEAR = {
  name: "2025-2026",
  start_date: "2025-09-05",
  end_date: "2026-05-31",
  is_current: true,
};

const SUBJECTS = [
  { code: "TOAN", name: "Toán học" },
  { code: "VAN", name: "Ngữ văn" },
  { code: "ANH", name: "Tiếng Anh" },
  { code: "LY", name: "Vật lý" },
  { code: "HOA", name: "Hóa học" },
];

const CLASSES = ["10A1", "10A2", "11A1", "11A2", "12A1", "12A2"];

const CORE_USERS = [
  {
    email: "superadmin@bhedu.vn",
    password: "admin123",
    role: "super_admin",
    name: "Siêu Quản Trị",
  },
  {
    email: "owner@bhedu.vn",
    password: "owner123",
    role: "owner",
    name: "Chủ Trung Tâm",
  },
  {
    email: "admin@bhedu.vn",
    password: "admin123",
    role: "admin",
    name: "Quản Trị Viên",
  },
  {
    email: "staff@bhedu.vn",
    password: "staff123",
    role: "staff",
    name: "Nhân Viên Vận Hành",
  },
  {
    email: "teacher@bhedu.vn",
    password: "teacher123",
    role: "teacher",
    name: "Giáo Viên Mẫu",
  },
  {
    email: "parent@bhedu.vn",
    password: "parent123",
    role: "parent",
    name: "Phụ Huynh Mẫu",
  },
  {
    email: "student@bhedu.vn",
    password: "student123",
    role: "student",
    name: "Học Sinh Mẫu",
  },
  {
    email: "tutor@bhedu.vn",
    password: "tutor123",
    role: "tutor",
    name: "Gia Sư Mẫu",
  },
];

// -- Helpers --
const FIRST_NAMES = [
  "Minh",
  "Hải",
  "Dũng",
  "Anh",
  "Tuấn",
  "Nam",
  "Đức",
  "Phong",
  "Lan",
  "Hương",
  "Mai",
  "Linh",
];
const LAST_NAMES = [
  "Nguyễn",
  "Trần",
  "Lê",
  "Phạm",
  "Hoàng",
  "Huỳnh",
  "Phan",
  "Vũ",
  "Đặng",
  "Bùi",
];

const GENDERS = ["male", "female"];

function randomName() {
  return `${LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]} ${
    FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]
  } ${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]}`;
}

function randomGender() {
  return GENDERS[Math.floor(Math.random() * GENDERS.length)];
}

function randomScore() {
  return Math.round((Math.random() * 4 + 6) * 10) / 10; // Scores 6.0 to 10.0
}

async function main() {
  console.log("🚀 BH-EDU Improved Seed Starting...\n");

  // 1. Academic Year
  console.log("📅 Seeding Academic Year...");
  let academicYearId: string;
  const { data: existingYear } = await supabase.from("academic_years").select(
    "id",
  ).eq("name", ACADEMIC_YEAR.name).maybeSingle();

  if (existingYear) {
    academicYearId = existingYear.id;
    console.log("  ⏭️  Using existing academic year");
    await supabase.from("academic_years").update({ is_current: true }).eq(
      "id",
      academicYearId,
    );
  } else {
    const { data: newYear, error } = await supabase.from("academic_years")
      .insert(ACADEMIC_YEAR).select("id").single();
    if (error) {
      console.error("Error creating academic year:", error);
      process.exit(1);
    }
    academicYearId = newYear.id;
    console.log("  ✅ Created academic year: 2025-2026");
  }

  // 2. Subjects
  console.log("\n📚 Seeding Subjects...");
  const subjectMap: Record<string, string> = {};
  for (const s of SUBJECTS) {
    const { data: ext } = await supabase.from("subjects").select("id").eq(
      "code",
      s.code,
    ).maybeSingle();
    if (ext) {
      subjectMap[s.code] = ext.id;
    } else {
      const { data } = await supabase.from("subjects").insert(s).select("id")
        .single();
      if (data) subjectMap[s.code] = data.id;
    }
  }
  console.log(`  ✅ Synced ${Object.keys(subjectMap).length} subjects`);

  // 2.1 Courses
  console.log("\n📘 Seeding Courses...");
  const courseMap: Record<string, string> = {};
  for (const [code, id] of Object.entries(subjectMap)) {
    const s = SUBJECTS.find((subj) => subj.code === code);
    const { data: ext } = await supabase.from("courses").select("id").eq(
      "code",
      `C-${code}`,
    ).maybeSingle();

    if (ext) {
      courseMap[code] = ext.id;
    } else {
      const { data, error } = await supabase.from("courses").insert({
        name: s?.name || "Khóa học",
        code: `C-${code}`,
        subject_id: id,
        description: `Khóa học ${s?.name || ""}`,
        credits: 1,
      }).select("id").single();

      if (error) {
        console.error(
          `  ❌ Failed to create course for ${code}: ${error.message}`,
        );
      } else if (data) {
        courseMap[code] = data.id;
      }
    }
  }
  console.log(`  ✅ Synced ${Object.keys(courseMap).length} courses`);

  // 3. Core Users & Profiles (Defensive)
  console.log("\n🔐 Seeding Core Users...");

  // Pre-fetch all users to avoid pagination issues and fragile error checks
  console.log("  ⚡ Prefetching Auth Users...");
  let allUsers: any[] = [];
  let page = 1;
  const PER_PAGE = 50;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: PER_PAGE,
    });
    if (error) {
      console.error("Failed to list users:", error);
      process.exit(1);
    }
    const users = data.users;
    if (!users || users.length === 0) break;

    allUsers = [...allUsers, ...users];
    console.log(`    Fetched page ${page} (${users.length} users)...`);
    page++;
  }

  const emailToIdMap = new Map<string, string>();
  allUsers.forEach((u) => u.email && emailToIdMap.set(u.email, u.id));
  console.log(`  Found ${emailToIdMap.size} existing users.`);

  const profileIds: Record<string, string> = {};

  for (const u of CORE_USERS) {
    let userId = emailToIdMap.get(u.email);

    if (!userId) {
      // Create if not exists
      const { data: authData, error: authErr } = await supabase.auth.admin
        .createUser({
          email: u.email,
          password: u.password,
          email_confirm: true,
          user_metadata: { full_name: u.name, role: u.role },
        });

      if (authErr) {
        console.error(`  ❌ Auth Error (${u.email}): ${authErr.message}`);
        continue;
      }

      if (authData.user) {
        userId = authData.user.id;
        emailToIdMap.set(u.email, userId);
      }
    } else {
      console.log(`  Header: User ${u.email} already exists (ID: ${userId})`);
      // Update metadata to ensure role is correct
      await supabase.auth.admin.updateUserById(userId, {
        user_metadata: { full_name: u.name, role: u.role },
      });
    }

    if (!userId) continue;

    // Check by user_id
    const { data: existingProfile } = await supabase.from("profiles").select(
      "id",
    ).eq("user_id", userId).maybeSingle();
    let profileId: string;

    if (existingProfile) {
      await supabase.from("profiles").update({
        full_name: u.name,
        role: u.role,
        status: "active",
        is_active: true,
      }).eq("id", existingProfile.id);
      profileId = existingProfile.id;
    } else {
      const fixedId = u.email === "student@bhedu.vn"
        ? "00000000-0000-0000-0000-000000000007"
        : u.email === "parent@bhedu.vn"
        ? "00000000-0000-0000-0000-000000000006"
        : undefined;

      const { data: newProfile, error } = await supabase.from("profiles")
        .insert({
          id: fixedId,
          user_id: userId,
          email: u.email,
          full_name: u.name,
          role: u.role,
          status: "active",
          is_active: true,
        }).select("id").single();

      if (error) {
        console.error("Profile Insert Error:", error);
        continue;
      }
      profileId = newProfile.id;
    }
    profileIds[u.email] = profileId;

    if (u.role === "teacher" || u.role === "tutor") {
      await supabase.from("teacher_profiles").upsert({
        profile_id: profileId,
        teacher_type: u.role === "tutor" ? "tutor" : "full_time",
        department: "Khoa học tự nhiên",
        specialization: "Toán, Lý, Hóa",
        teaching_subjects: [subjectMap["TOAN"], subjectMap["LY"]],
        hourly_rate: u.role === "tutor" ? 200000 : null,
      }, { onConflict: "profile_id" });
    }

    // Create student_profiles for core student
    if (u.role === "student") {
      await supabase.from("student_profiles").upsert({
        profile_id: profileId,
        student_code: "HS202500001",
        grade_level: "Lớp 10",
        enrollment_date: "2025-09-01",
      }, { onConflict: "profile_id" });
    }
  }
  console.log("  ✅ Core profiles synced");

  // 4. Classes
  console.log("\n🏫 Seeding Classes...");
  const classMap: Record<string, string> = {};
  const teacherId = profileIds["teacher@bhedu.vn"];

  if (!teacherId) {
    console.error(
      "  ❌ Teacher teacher@bhedu.vn not found, skipping classes assignment",
    );
  }

  for (const name of CLASSES) {
    const { data: ext } = await supabase.from("classes").select("id").eq(
      "name",
      name,
    ).maybeSingle();

    let classId = ext?.id;

    if (!classId && teacherId) {
      // Use detected schema: id, name, teacher_id, class_type, max_capacity, sessions_per_week
      const { data, error } = await supabase.from("classes").insert({
        name,
        teacher_id: teacherId,
        class_type: "group",
        max_capacity: 40,
        sessions_per_week: 3,
      }).select("id").single();

      if (error) {
        console.error(
          `  ❌ Failed to create class ${name}: ${error.message} (Detail: ${error.details})`,
        );
      } else {
        classId = data?.id;
      }
    }
    if (classId) classMap[name] = classId;
    else {console.error(
        `  ❌ Final Result: Failed to get/create class: ${name}`,
      );}
  }
  console.log(`  ✅ Synced ${Object.keys(classMap).length} classes`);

  // 5. Parent Link
  console.log("\n🔗 Linking Parent-Student...");
  if (profileIds["parent@bhedu.vn"] && profileIds["student@bhedu.vn"]) {
    await supabase.from("parent_student_links").upsert({
      parent_id: profileIds["parent@bhedu.vn"],
      student_id: profileIds["student@bhedu.vn"],
      relationship: "father",
      status: "approved",
      can_view_grades: true,
      can_view_attendance: true,
    }, { onConflict: "parent_id,student_id" });
  }

  // 6. Bulk Data Generation
  console.log("\n👨‍🎓 Generating Bulk Demo Data...");

  // USERS are already pre-fetched in emailToIdMap

  const STUDENTS_PER_CLASS = 5;
  const ATTENDANCE_DAYS = 20;

  const gradesToInsert: any[] = [];
  const attendanceToInsert: any[] = [];
  const enrollmentsToInsert: any[] = [];
  const studentProfilesToInsert: any[] = [];

  const today = new Date();
  let totalStudents = 0;

  for (const cls of CLASSES) {
    const classId = classMap[cls];
    if (!classId) {
      console.warn(
        `  ⚠️ Skip class ${cls} (ID missing from map: ${
          JSON.stringify(classMap)
        })`,
      );
      continue;
    }

    for (let i = 0; i < STUDENTS_PER_CLASS; i++) {
      totalStudents++;
      const sName = randomName();
      const sEmail = `s${cls.toLowerCase().replace("lớp ", "")}_${
        i + 1
      }@demo.bhedu.vn`;
      const sCode = `HS2025${
        (1000 + totalStudents).toString().padStart(4, "0")
      }`;

      let sUserId = emailToIdMap.get(sEmail);

      if (!sUserId) {
        const { data: authUser, error: authErr } = await supabase.auth.admin
          .createUser({
            email: sEmail,
            password: "password123",
            email_confirm: true,
            user_metadata: { full_name: sName, role: "student" },
          });

        if (authUser.user) {
          sUserId = authUser.user.id;
          emailToIdMap.set(sEmail, sUserId); // Cache it
        } else {
          // Double check if weird race
          if (
            authErr &&
            authErr.message.toLowerCase().includes("already registered")
          ) {
            // Should have been in map but maybe List limit or race?
            // If so, fetch freshly.
            const { data: uList } = await supabase.auth.admin.listUsers();
            const found = uList.users.find((x) => x.email === sEmail);
            if (found) {
              sUserId = found.id;
              emailToIdMap.set(sEmail, sUserId);
            }
          } else {
            console.error(
              `Failed to create user ${sEmail}: ${authErr?.message}`,
            );
            continue;
          }
        }
      }

      if (!sUserId) continue;

      // Get/Create Profile Logic (Simplified)
      // Check local profile existence? No, just upsert check.
      // But trigger? Trigger inserts.
      // We can check profile existence by user_id

      let sProfileId: string | null = null;
      const { data: existingProf, error: findError } = await supabase.from(
        "profiles",
      ).select(
        "id, full_name",
      ).eq("user_id", sUserId).maybeSingle();

      if (findError) {
        console.error(
          `  ❌ Error fetching profile for ${sEmail}: ${findError.message}`,
        );
      }

      if (existingProf) {
        sProfileId = existingProf.id;
        // Update it to ensure it has student_code and other fields
        await supabase.from("profiles").update({
          student_code: sCode,
          role: "student",
          status: "active",
          is_active: true,
        }).eq("id", sProfileId);
      } else {
        // Try insert
        const { data: newP, error: insError } = await supabase.from("profiles")
          .insert({
            user_id: sUserId,
            email: sEmail,
            full_name: sName,
            role: "student",
            status: "active",
            student_code: sCode,
            student_id: sCode, // Link for legacy code
            is_active: true,
            gender: randomGender(),
          }).select("id").maybeSingle();

        if (insError) {
          console.error(
            `  ❌ Profile Insert Error for ${sEmail}: ${insError.message} (Detail: ${insError.details})`,
          );
          // One more try: maybe it was created by trigger in between?
          const { data: retryProf } = await supabase.from("profiles").select(
            "id",
          ).eq("user_id", sUserId).maybeSingle();
          sProfileId = retryProf?.id || null;
        } else {
          sProfileId = newP?.id || null;
        }
      }

      if (!sProfileId) {
        console.warn(`Failed to resolve Profile ID for ${sEmail}`);
        continue;
      }

      // Populate Arrays
      studentProfilesToInsert.push({
        profile_id: sProfileId,
        student_code: sCode,
        grade_level: cls,
        enrollment_date: "2025-09-01",
      });
      enrollmentsToInsert.push({
        student_id: sProfileId,
        class_id: classId,
        status: "active",
        enrollment_date: "2025-09-01",
      });

      // Attendance
      for (let d = 0; d < ATTENDANCE_DAYS; d++) {
        const date = new Date(today);
        date.setDate(date.getDate() - d);
        if (date.getDay() === 0 || date.getDay() === 6) continue;
        const statusRoll = Math.random();
        const status = statusRoll > 0.9
          ? "absent"
          : statusRoll > 0.85
          ? "late"
          : "present";
        attendanceToInsert.push({
          student_id: sProfileId,
          class_id: classId,
          date: date.toISOString().split("T")[0],
          status: status,
          remarks: status === "absent" ? "Sick" : "",
        });
      }

      // Grades
      const subToan = subjectMap["TOAN"];
      const subVan = subjectMap["VAN"];

      if (subToan) {
        const sc = randomScore();
        gradesToInsert.push({
          student_id: sProfileId,
          class_id: classId,
          subject_id: subToan,
          component_type: "final",
          semester: "1",
          score: sc,
          points_earned: sc,
        });
        const sc2 = randomScore();
        gradesToInsert.push({
          student_id: sProfileId,
          class_id: classId,
          subject_id: subToan,
          component_type: "midterm",
          semester: "1",
          score: sc2,
          points_earned: sc2,
        });
      }
      if (subVan) {
        const sc = randomScore();
        gradesToInsert.push({
          student_id: sProfileId,
          class_id: classId,
          subject_id: subVan,
          component_type: "final",
          semester: "1",
          score: sc,
          points_earned: sc,
        });
        const sc2 = randomScore();
        gradesToInsert.push({
          student_id: sProfileId,
          class_id: classId,
          subject_id: subVan,
          component_type: "midterm",
          semester: "1",
          score: sc2,
          points_earned: sc2,
        });
      }
    }
  }

  console.log(
    `\nBefore Insert: Students: ${totalStudents}, Profiles: ${studentProfilesToInsert.length}, Attendance: ${attendanceToInsert.length}, Grades: ${gradesToInsert.length}`,
  );

  console.log("\n💾 Bulk Inserting Data...");
  if (studentProfilesToInsert.length) {
    await supabase.from("student_profiles").upsert(studentProfilesToInsert, {
      onConflict: "profile_id",
    });
  }
  if (enrollmentsToInsert.length) {
    await supabase.from("enrollments").upsert(enrollmentsToInsert, {
      ignoreDuplicates: true,
    });
  }

  if (attendanceToInsert.length) {
    console.log(
      `  Inserting ${attendanceToInsert.length} attendance records...`,
    );
    const chunkSize = 1000;
    for (let i = 0; i < attendanceToInsert.length; i += chunkSize) {
      const chunk = attendanceToInsert.slice(i, i + chunkSize);
      const { error } = await supabase.from("attendance").upsert(chunk, {
        ignoreDuplicates: true,
      });
      if (error) console.error("Error inserting attendance chunk:", error);
    }
  }

  if (gradesToInsert.length) {
    console.log(`  Inserting ${gradesToInsert.length} grades...`);
    const { error } = await supabase.from("grades").upsert(gradesToInsert, {
      onConflict: "student_id, class_id, subject_id, component_type, semester",
    });
    if (error) console.error("Error inserting grades:", error);
  }

  console.log(`\n✨ Seed Complete!`);
}

main().catch(console.error);
