import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as fs from "fs";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runAudit() {
    console.log("🚀 Starting Comprehensive Schema Audit...");
    const auditResult: any = {
        tables: {},
        enums: {},
        constraints: [],
        errors: [],
    };

    // 1. Try to get all tables and columns via exec_sql
    try {
        const { data: tables, error: tablesError } = await supabase.rpc(
            "exec_sql",
            {
                sql: `
        SELECT 
          table_name, 
          column_name, 
          data_type, 
          is_nullable,
          column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        ORDER BY table_name, ordinal_position;
      `,
            },
        );

        if (tablesError) {
            console.log(
                "⚠️  exec_sql RPC failed, falling back to brute force discovery.",
            );
            auditResult.errors.push(`exec_sql failed: ${tablesError.message}`);

            // Fallback: list of known tables to check
            const knownTables = [
                "profiles",
                "student_profiles",
                "teacher_profiles",
                "classes",
                "subjects",
                "courses",
                "enrollments",
                "attendance",
                "grades",
                "timetable_slots",
                "semesters",
                "academic_years",
                "weekly_notes",
                "notifications",
                "payments",
                "invoices",
                "audit_logs",
                "settings",
            ];

            for (const table of knownTables) {
                process.stdout.write(`Checking ${table}... `);
                const { data, error } = await supabase.from(table).select("*")
                    .limit(1);
                if (error) {
                    console.log(`❌ (${error.message})`);
                    auditResult.tables[table] = { error: error.message };
                } else {
                    const cols = data && data.length > 0
                        ? Object.keys(data[0])
                        : [];
                    console.log(`✅ (${cols.length} columns discovered)`);
                    auditResult.tables[table] = { columns: cols };
                }
            }
        } else {
            console.log("✅ Successfully retrieved columns via exec_sql.");
            tables.forEach((row: any) => {
                if (!auditResult.tables[row.table_name]) {
                    auditResult.tables[row.table_name] = { columns: [] };
                }
                auditResult.tables[row.table_name].columns.push({
                    name: row.column_name,
                    type: row.data_type,
                    nullable: row.is_nullable === "YES",
                    default: row.column_default,
                });
            });
        }
    } catch (e: any) {
        console.log("❌ Fatal error during column discovery:", e.message);
    }

    // 2. Try to get Foreign Keys
    try {
        const { data: fks, error: fkError } = await supabase.rpc("exec_sql", {
            sql: `
        SELECT
            tc.constraint_name, 
            tc.table_name, 
            kcu.column_name, 
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name 
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY';
      `,
        });

        if (!fkError && fks) {
            console.log("✅ Successfully retrieved foreign keys.");
            auditResult.constraints = fks;
        }
    } catch (e: any) {
        console.log("⚠️  Could not retrieve foreign keys.");
    }

    // 3. Save result
    fs.writeFileSync(
        "comprehensive_schema_audit.json",
        JSON.stringify(auditResult, null, 2),
    );
    console.log(
        "\n✨ Audit complete! Results saved to comprehensive_schema_audit.json",
    );
}

runAudit();
