/**
 * Quick script to check enrollment and timetable for student bulktest in class 7B
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkStudentSchedule() {
    console.log("🔍 Checking student bulktest enrollment and schedule...\n");

    // 1. Find student bulktest
    const { data: student } = await supabase
        .from("profiles")
        .select("id, full_name, email, role")
        .or(`email.eq.bulktest@example.com,full_name.ilike.%bulktest%`)
        .single();

    if (!student) {
        console.log("❌ Student bulktest not found");
        return;
    }

    console.log("✅ Found student:", student);

    // 2. Find class 7B
    const { data: class7B } = await supabase
        .from("classes")
        .select("id, name, teacher_id")
        .eq("name", "7B")
        .single();

    if (!class7B) {
        console.log("❌ Class 7B not found");
        console.log("\n📝 Available classes:");
        const { data: allClasses } = await supabase
            .from("classes")
            .select("id, name")
            .order("name");
        console.table(allClasses);
        return;
    }

    console.log("✅ Found class 7B:", class7B);

    // 3. Check enrollment
    const { data: enrollments } = await supabase
        .from("enrollments")
        .select("*")
        .eq("student_id", student.id)
        .eq("class_id", class7B.id);

    if (!enrollments || enrollments.length === 0) {
        console.log("❌ Student is NOT enrolled in class 7B");
        console.log("\n📝 Student current enrollments:");
        const { data: currentEnrollments } = await supabase
            .from("enrollments")
            .select("*, classes(name)")
            .eq("student_id", student.id);
        console.table(currentEnrollments);
    } else {
        console.log("✅ Enrollment found:", enrollments[0]);
    }

    // 4. Check timetable slots for class 7B
    const { data: slots } = await supabase
        .from("timetable_slots")
        .select(`
      id, day_of_week, start_time, end_time, room,
      subjects(name),
      profiles!timetable_slots_teacher_id_fkey(full_name)
    `)
        .eq("class_id", class7B.id)
        .order("day_of_week")
        .order("start_time");

    if (!slots || slots.length === 0) {
        console.log("❌ Class 7B has NO timetable slots");
    } else {
        console.log(`✅ Class 7B has ${slots.length} timetable slots:`);
        console.table(slots.map((s) => ({
            day: [
                "Mon",
                "Tue",
                "Wed",
                "Thu",
                "Fri",
                "Sat",
                "Sun",
            ][s.day_of_week],
            time: `${s.start_time}-${s.end_time}`,
            subject: (s.subjects as any)?.name,
            teacher: (s.profiles as any)?.full_name,
            room: s.room,
        })));
    }

    console.log("\n=== SUMMARY ===");
    console.log(`Student: ${student.full_name} (${student.email})`);
    console.log(`Class: ${class7B.name}`);
    console.log(
        `Enrolled: ${
            enrollments && enrollments.length > 0 ? "YES ✅" : "NO ❌"
        }`,
    );
    console.log(`TKB Slots: ${slots?.length || 0}`);
}

checkStudentSchedule().catch(console.error);
