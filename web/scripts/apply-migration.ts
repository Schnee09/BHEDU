import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeMigration(filePath: string) {
    console.log(`🚀 Applying migration: ${path.basename(filePath)}`);
    const sql = fs.readFileSync(filePath, "utf8");

    // Note: Executing raw SQL via Supabase REST requires an 'exec_sql' RPC or similar.
    // We'll try a direct fetch to the SQL endpoint if available, or use the RPC.

    try {
        const { data, error } = await supabase.rpc("exec_sql", { sql });

        if (error) {
            // If exec_sql fails, we'll try to split the SQL by statements (naive) and run independently if possible
            // or report failure if the function is missing.
            if (error.message.includes("Could not find the function")) {
                console.error(
                    "❌ Error: 'public.exec_sql' function not found in Supabase. Please create it manually or use Supabase Dashboard SQL Editor.",
                );
                console.log("\n--- SQL CONTENT START ---");
                console.log(sql);
                console.log("--- SQL CONTENT END ---");
                process.exit(1);
            }
            throw error;
        }

        console.log("✅ Migration applied successfully!");
    } catch (e: any) {
        console.error("❌ Migration failed:", e.message);
        process.exit(1);
    }
}

const migrationFile =
    "e:/TTGDBH/BH-EDU/supabase/migrations/20260207103000_golden_schema_overhaul.sql";
executeMigration(migrationFile);
