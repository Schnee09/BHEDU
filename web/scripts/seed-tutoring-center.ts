/**
 * Seed script for Tutoring Center (Trung tâm gia sư)
 *
 * Creates:
 * - Subjects (Toán, Văn, Anh, Lý, Hóa)
 * - Classes (6A, 6B, 7A, 7B, 8A, 8B, 9A, 9B, 10A, 10B, 11A, 11B, 12A, 12B)
 * - Students with proper enrollments
 * - Timetable slots for each class
 * - Sample grades
 *
 * Run with: npx tsx scripts/seed-tutoring-center.ts
 */

import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, "..", ".env.local") });
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
);

// ============================================
// CONFIGURATION
// ============================================

const SUBJECTS = [
    { code: "toan", name: "Toán học" },
    { code: "van", name: "Ngữ văn" },
    { code: "anh", name: "Tiếng Anh" },
    { code: "ly", name: "Vật lý" },
    { code: "hoa", name: "Hóa học" },
];

// Classes for tutoring center (Khối 6-12, A&B)
const CLASS_NAMES = [
    "6A",
    "6B",
    "7A",
    "7B",
    "8A",
    "8B",
    "9A",
    "9B",
    "10A",
    "10B",
    "11A",
    "11B",
    "12A",
    "12B",
];

// Timetable sessions (ca học)
const TIMETABLE_SESSIONS = [
    { start: "17:00", end: "18:30", day: 1 }, // Mon Ca 1
    { start: "18:30", end: "20:00", day: 1 }, // Mon Ca 2
    { start: "17:00", end: "18:30", day: 3 }, // Wed Ca 1
    { start: "18:30", end: "20:00", day: 3 }, // Wed Ca 2
    { start: "17:00", end: "18:30", day: 5 }, // Fri Ca 1
    { start: "08:00", end: "09:30", day: 6 }, // Sat Morning
    { start: "09:30", end: "11:00", day: 6 }, // Sat Morning 2
    { start: "14:00", end: "15:30", day: 0 }, // Sun Afternoon
];

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
    "Thảo",
    "Ngọc",
    "Quân",
    "Hùng",
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

const COMPONENTS = ["oral", "fifteen_min", "one_period", "midterm", "final"];

function randomName() {
    return `${LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]} ${
        FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]
    } ${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]}`;
}

function randomScore() {
    return Math.round((Math.random() * 4 + 6) * 10) / 10; // 6-10 range
}

// ============================================
// MAIN SEED FUNCTION
// ============================================

async function main() {
    console.log("🌱 Tutoring Center Complete Seed\n");
    console.log("=".repeat(50));

    // 1. Get active semester (or create one)
    let semesterId: string;
    const { data: existingSemester } = await supabase
        .from("semesters")
        .select("id")
        .eq("is_active", true)
        .maybeSingle();

    if (existingSemester) {
        semesterId = existingSemester.id;
        console.log("📅 Using existing active semester");
    } else {
        const { data: newSemester, error } = await supabase
            .from("semesters")
            .insert({
                name: "Học kỳ 2 - 2025-2026",
                start_date: "2026-01-01",
                end_date: "2026-06-30",
                is_active: true,
            })
            .select("id")
            .single();

        if (error) {
            console.log("❌ Failed to create semester:", error.message);
            return;
        }
        semesterId = newSemester.id;
        console.log("✅ Created new semester");
    }

    // 2. Get teachers
    const { data: teachers } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("role", "teacher");

    const teacherIds = teachers?.map((t) => t.id) || [];
    console.log(`\n👨‍🏫 Found ${teacherIds.length} teachers`);

    // 3. Create/get subjects
    console.log("\n📚 Subjects:");
    const subjectIds: Record<string, string> = {};
    for (const s of SUBJECTS) {
        const { data: existing } = await supabase.from("subjects").select("id")
            .eq("code", s.code).maybeSingle();
        if (existing) {
            subjectIds[s.code] = existing.id;
            console.log(`  ⏭️  ${s.name}`);
        } else {
            const { data, error } = await supabase.from("subjects").insert(s)
                .select("id").single();
            if (data) {
                subjectIds[s.code] = data.id;
                console.log(`  ✅ ${s.name}`);
            } else console.log(`  ❌ ${s.name}: ${error?.message}`);
        }
    }

    // 4. Create classes with teachers
    console.log("\n🏫 Classes:");
    const classIds: Record<string, string> = {};
    let teacherIndex = 0;

    for (const name of CLASS_NAMES) {
        const teacherId = teacherIds.length > 0
            ? teacherIds[teacherIndex % teacherIds.length]
            : null;
        teacherIndex++;

        const { data: existing } = await supabase.from("classes").select("id")
            .eq("name", name).maybeSingle();
        if (existing) {
            classIds[name] = existing.id;
            console.log(`  ⏭️  ${name}`);
        } else {
            const gradeLevel = parseInt(name.match(/\d+/)?.[0] || "10");
            const { data, error } = await supabase.from("classes").insert({
                name,
                grade_level: `Khối ${gradeLevel}`,
                teacher_id: teacherId,
            }).select("id").single();

            if (data) {
                classIds[name] = data.id;
                console.log(`  ✅ ${name}`);
            } else console.log(`  ❌ ${name}: ${error?.message}`);
        }
    }

    // 5. Create students with enrollments
    console.log("\n👨‍🎓 Students + Enrollments:");
    let studentNum = 1;
    const studentIdsMap: Record<string, string[]> = {};

    for (const className of CLASS_NAMES) {
        const classId = classIds[className];
        if (!classId) continue;

        studentIdsMap[className] = [];
        const studentsPerClass = 5 + Math.floor(Math.random() * 6); // 5-10 students per class

        for (let i = 0; i < studentsPerClass; i++) {
            const gradeNum = className.match(/\d+/)?.[0] || "10";
            // Student code format: HS + 4-digit year + 4-digit sequence (e.g., HS20260001)
            const code = `HS${2026}${String(studentNum).padStart(4, "0")}`;
            const email = `${code.toLowerCase()}@student.bhedu.vn`;

            // Check if student already exists
            const { data: existingStudent } = await supabase
                .from("profiles")
                .select("id")
                .eq("email", email)
                .maybeSingle();

            let studentId: string;

            if (existingStudent) {
                studentId = existingStudent.id;
            } else {
                const { data: newStudent, error } = await supabase.from(
                    "profiles",
                ).insert({
                    email,
                    full_name: randomName(),
                    role: "student",
                    student_code: code,
                    grade_level: `Lớp ${gradeNum}`,
                    gender: Math.random() > 0.5 ? "male" : "female",
                    status: "active",
                }).select("id").single();

                if (error) {
                    console.log(`  ❌ ${code}: ${error.message}`);
                    studentNum++;
                    continue;
                }
                studentId = newStudent.id;
            }

            studentIdsMap[className].push(studentId);

            // Create enrollment (upsert to avoid duplicates)
            const { error: enrollError } = await supabase.from("enrollments")
                .upsert({
                    student_id: studentId,
                    class_id: classId,
                    status: "active",
                    enrollment_date: new Date().toISOString().split("T")[0],
                }, { onConflict: "student_id,class_id" });

            if (enrollError && enrollError.code !== "23505") {
                console.log(
                    `  ⚠️  Enrollment error for ${code}: ${enrollError.message}`,
                );
            }

            studentNum++;
        }

        console.log(
            `  ✅ ${className}: ${
                studentIdsMap[className].length
            } students enrolled`,
        );
    }

    // 6. Create timetable slots
    console.log("\n📅 Timetable Slots:");
    let slotCount = 0;

    for (const className of CLASS_NAMES) {
        const classId = classIds[className];
        if (!classId) continue;

        const teacherId = teacherIds.length > 0
            ? teacherIds[Math.floor(Math.random() * teacherIds.length)]
            : null;
        const subjectCodes = Object.keys(subjectIds);

        // Assign 2-3 sessions per class
        const sessionsForClass = TIMETABLE_SESSIONS.slice(
            0,
            2 + Math.floor(Math.random() * 2),
        );

        for (let i = 0; i < sessionsForClass.length; i++) {
            const session = sessionsForClass[i];
            const subjectCode = subjectCodes[i % subjectCodes.length];

            // Check if slot exists
            const { data: existing } = await supabase
                .from("timetable_slots")
                .select("id")
                .eq("class_id", classId)
                .eq("day_of_week", session.day)
                .eq("start_time", session.start)
                .maybeSingle();

            if (!existing) {
                const { error } = await supabase.from("timetable_slots").insert(
                    {
                        class_id: classId,
                        teacher_id: teacherId,
                        subject_id: subjectIds[subjectCode],
                        semester_id: semesterId,
                        day_of_week: session.day,
                        start_time: session.start,
                        end_time: session.end,
                        room: `P${100 + Math.floor(Math.random() * 20)}`,
                    },
                );

                if (!error) slotCount++;
            }
        }
    }
    console.log(`  ✅ Created ${slotCount} timetable slots`);

    // 7. Create sample grades
    console.log("\n📊 Sample Grades:");
    let gradeCount = 0;

    for (const className of CLASS_NAMES) {
        const classId = classIds[className];
        const students = studentIdsMap[className] || [];

        for (const studentId of students.slice(0, 3)) { // Only first 3 students get grades
            for (const subCode of Object.keys(subjectIds).slice(0, 3)) { // Only first 3 subjects
                for (const comp of COMPONENTS.slice(0, 3)) { // Only first 3 components
                    if (Math.random() > 0.3) { // 70% chance
                        const { error } = await supabase.from("grades").insert({
                            student_id: studentId,
                            class_id: classId,
                            subject_id: subjectIds[subCode],
                            component_type: comp,
                            semester: "2",
                            score: randomScore(),
                            points_earned: randomScore(),
                        });
                        if (!error) gradeCount++;
                    }
                }
            }
        }
    }
    console.log(`  ✅ Created ${gradeCount} grade entries`);

    // 8. Create attendance records
    console.log("\n📋 Attendance Records:");
    let attendanceCount = 0;
    const today = new Date();

    for (const className of CLASS_NAMES.slice(0, 6)) { // Only first 6 classes
        const classId = classIds[className];
        const students = studentIdsMap[className] || [];

        // Create attendance for last 5 class sessions
        for (let daysAgo = 0; daysAgo < 10; daysAgo += 2) {
            const date = new Date(today);
            date.setDate(date.getDate() - daysAgo);
            const dateStr = date.toISOString().split("T")[0];

            for (const studentId of students) {
                const statuses = [
                    "present",
                    "present",
                    "present",
                    "present",
                    "late",
                    "absent",
                ];
                const status =
                    statuses[Math.floor(Math.random() * statuses.length)];

                const { error } = await supabase.from("attendance").insert({
                    student_id: studentId,
                    class_id: classId,
                    date: dateStr,
                    status,
                    marked_at: new Date().toISOString(),
                });

                if (!error) attendanceCount++;
            }
        }
    }
    console.log(`  ✅ Created ${attendanceCount} attendance records`);

    // 9. Create weekly notes for timetable
    console.log("\n📝 Weekly Notes:");
    let notesCount = 0;
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday

    // Get some timetable slots
    const { data: slots } = await supabase
        .from("timetable_slots")
        .select("id")
        .limit(10);

    const sampleNotes = [
        "Ôn tập chương 3",
        "Kiểm tra 15 phút",
        "Bài tập về nhà: Trang 45-50",
        "Chuẩn bị kiểm tra giữa kỳ",
        "Thảo luận nhóm",
        "Nghỉ - GV đi họp",
    ];

    for (const slot of (slots || []).slice(0, 5)) {
        const { error } = await supabase.from("timetable_weekly_notes").insert({
            slot_id: slot.id,
            week_start_date: weekStart.toISOString().split("T")[0],
            note: sampleNotes[Math.floor(Math.random() * sampleNotes.length)],
        });
        if (!error) notesCount++;
    }
    console.log(`  ✅ Created ${notesCount} weekly notes`);

    // 10. Create rooms
    console.log("\n🏠 Rooms:");
    const roomTypes = [
        {
            name: "Phòng học thường",
            type: "regular",
            rooms: ["P101", "P102", "P103", "P104", "P105"],
        },
        { name: "Phòng lab", type: "lab", rooms: ["Lab 1", "Lab 2"] },
        { name: "Phòng linh hoạt", type: "flexible", rooms: ["P201", "P202"] },
    ];

    let roomCount = 0;
    for (const roomType of roomTypes) {
        for (const roomName of roomType.rooms) {
            const { data: existing } = await supabase
                .from("rooms")
                .select("id")
                .eq("name", roomName)
                .maybeSingle();

            if (!existing) {
                const { error } = await supabase.from("rooms").insert({
                    name: roomName,
                    room_type: roomType.type,
                    capacity: roomType.type === "lab" ? 20 : 30,
                    is_active: true,
                });
                if (!error) roomCount++;
            }
        }
    }
    console.log(`  ✅ Created ${roomCount} rooms`);

    // Summary
    console.log("\n" + "=".repeat(50));
    console.log("📊 SUMMARY:");
    console.log(`  • Subjects: ${SUBJECTS.length}`);
    console.log(`  • Classes: ${CLASS_NAMES.length}`);
    console.log(`  • Students: ${studentNum - 1}`);
    console.log(`  • Timetable Slots: ${slotCount}`);
    console.log(`  • Grades: ${gradeCount}`);
    console.log(`  • Attendance: ${attendanceCount}`);
    console.log(`  • Weekly Notes: ${notesCount}`);
    console.log(`  • Rooms: ${roomCount}`);
    console.log("\n✨ Done!");
}

main().catch(console.error);
