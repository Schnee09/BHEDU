import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listAllTables() {
    console.log("🔍 Listing ALL tables in the database (public schema)...");

    // Since we can't run arbitrary SQL via the standard client easily,
    // we can use the 'rpc' method if a helper exists, or
    // try to fetch from information_schema.tables which sometimes works via PostgREST

    const { data, error } = await supabase
        .from("pg_tables") // This might fail if RLS/view doesn't exist
        .select("tablename")
        .eq("schemaname", "public");

    if (error) {
        console.log("❌ Could not query pg_tables directly:", error.message);

        // Fallback: Use PostgREST's root endpoint which returns the OpenAPI spec
        // which contains all reachable tables.
        console.log("Attempting fallback via fetch...");
        try {
            const resp = await fetch(`${supabaseUrl}/rest/v1/`, {
                headers: {
                    "apikey": supabaseServiceKey,
                    "Authorization": `Bearer ${supabaseServiceKey}`,
                },
            });
            const spec = await resp.json();
            const tables = Object.keys(
                spec.definitions || spec.components?.schemas || {},
            );
            console.log("✅ Tables found in API spec:");
            tables.sort().forEach((t) => console.log(`- ${t}`));
        } catch (e) {
            console.log("❌ Fallback also failed.");
        }
    } else {
        console.log("✅ Tables found:");
        data.forEach((t) => console.log(`- ${t.tablename}`));
    }
}

listAllTables();
