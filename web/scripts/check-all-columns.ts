import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deepSchemaScan() {
    console.log("🔍 Starting Deep Schema Scan...");

    // 1. Get all table names
    const { data: tablesData, error: tablesError } = await supabase
        .from("pg_tables")
        .select("tablename")
        .eq("schemaname", "public");

    let tableNames: string[] = [];
    if (tablesError) {
        console.log("⚠️ Could not query pg_tables, using fallback list...");
        tableNames = [
            "profiles",
            "classes",
            "attendance",
            "attendance_reports",
            "courses",
            "enrollments",
            "guardians",
            "student_accounts",
            "invoices",
            "payments",
            "import_logs",
            "notifications",
            "grades",
            "student_profiles",
            "teacher_profiles",
            "user_invitations",
            "parent_student_links",
            "teacher_subjects",
            "teacher_workload",
            "student_conducts",
            "weekly_notes",
        ];
    } else {
        tableNames = tablesData.map((t) => t.tablename);
    }

    const fullSchema: Record<string, string[]> = {};

    for (const table of tableNames) {
        // Skip views
        if (table.startsWith("v_")) continue;

        console.log(`Scanning ${table}...`);
        const { data, error } = await supabase
            .from(table)
            .select("*")
            .limit(1);

        if (error) {
            // Try selecting just one row without * if it fails due to large blob or something
            fullSchema[table] = [
                "(Error fetching columns: " + error.message + ")",
            ];
            continue;
        }

        if (data && data.length > 0) {
            fullSchema[table] = Object.keys(data[0]);
        } else {
            fullSchema[table] = ["(Empty Table)"];
        }
    }

    fs.writeFileSync(
        "exhaustive_schema.json",
        JSON.stringify(fullSchema, null, 2),
    );
    console.log("\n✅ Exhaustive schema saved to exhaustive_schema.json");
}

deepSchemaScan();
