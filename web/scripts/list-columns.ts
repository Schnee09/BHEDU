import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listColumns() {
    console.log("🔍 Listing ALL columns in profiles table...");

    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .limit(1);

    if (error) {
        console.error("Error fetching profile:", error);
        return;
    }

    if (data && data.length > 0) {
        const columns = Object.keys(data[0]);
        console.log("Columns found:");
        columns.sort().forEach((col) => console.log(`- ${col}`));
    } else {
        console.log("No data found in profiles table.");
    }

    console.log("\n✅ List columns complete.");
}

listColumns();
