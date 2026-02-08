import * as dotenv from "dotenv";
import * as fs from "fs";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function fetchSchema() {
    console.log("📡 Fetching OpenAPI schema from:", supabaseUrl);
    try {
        const response = await fetch(
            `${supabaseUrl}/rest/v1/?apikey=${supabaseServiceKey}`,
        );
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        fs.writeFileSync(
            "supabase_openapi_schema.json",
            JSON.stringify(data, null, 2),
        );
        console.log("✅ Schema saved to supabase_openapi_schema.json");
    } catch (e: any) {
        console.error("❌ Failed to fetch schema:", e.message);
    }
}

fetchSchema();
