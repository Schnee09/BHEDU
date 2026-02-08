/**
 * Diagnostic script to check grade data and constraint
 * Run with: npx ts-node scripts/check-grades.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log("=== Grade Diagnostic Script ===\n");

    // 1. Check if the unique constraint exists
    console.log("1. Checking for unique constraint...");
    const { data: constraints, error: constraintError } = await supabase
        .from("pg_constraint")
        .select("*")
        .then(() => ({ data: null, error: null })); // Can't query pg_constraint directly

    // Instead, try to find duplicate rows
    console.log("\n2. Looking for duplicate grade entries...");
    const { data: grades, error } = await supabase
        .from("grades")
        .select(
            "id, student_id, class_id, subject_id, component_type, semester, score, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(20);

    if (error) {
        console.error("Error fetching grades:", error);
        return;
    }

    console.log("\nRecent grades:");
    console.table(
        grades?.map((g) => ({
            id: g.id.slice(0, 8),
            student: g.student_id?.slice(0, 8),
            class: g.class_id?.slice(0, 8),
            subject: g.subject_id?.slice(0, 8),
            component: g.component_type,
            semester: g.semester,
            score: g.score,
            created: g.created_at?.slice(0, 16),
        })),
    );

    // 3. Group by constraint columns to find duplicates
    console.log(
        "\n3. Checking for potential duplicates on constraint columns...",
    );
    const studentId = "fb7d1b1a-7f21-496f-92c7-cb7b127b7d27";
    const { data: studentGrades, error: sgError } = await supabase
        .from("grades")
        .select("*")
        .eq("student_id", studentId);

    if (sgError) {
        console.error("Error:", sgError);
        return;
    }

    console.log(`\nAll grades for student ${studentId.slice(0, 8)}...:`);
    console.table(
        studentGrades?.map((g) => ({
            id: g.id.slice(0, 8),
            class: g.class_id?.slice(0, 8),
            subject: g.subject_id?.slice(0, 8),
            component: g.component_type,
            semester: g.semester,
            score: g.score,
        })),
    );

    // 4. Check for NULL values in constraint columns
    console.log("\n4. Checking for NULL values in constraint columns...");
    const { count: nullCount } = await supabase
        .from("grades")
        .select("*", { count: "exact", head: true })
        .or("class_id.is.null,subject_id.is.null,component_type.is.null,semester.is.null");

    console.log(`Grades with NULL values in constraint columns: ${nullCount}`);

    // 5. Check distinct semesters
    console.log("\n5. Distinct semesters in grades table...");
    const { data: allGrades } = await supabase
        .from("grades")
        .select("semester");

    const semesters = [...new Set(allGrades?.map((g) => g.semester))];
    console.log("Semesters found:", semesters);
}

main().catch(console.error);
