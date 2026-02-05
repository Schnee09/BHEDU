import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspect() {
    console.log("Inspecting 'subjects' table schema...");

    // Fetch one record
    const { data, error } = await supabase.from("subjects").select("*").limit(
        1,
    );

    if (error) {
        console.error("Error fetching subjects:", error);
        return;
    }

    if (data && data.length > 0) {
        console.log("Found record:", data[0]);
        console.log("Column names:", Object.keys(data[0]));

        const hasIsActive = Object.keys(data[0]).includes("is_active");
        console.log("Has 'is_active' column?", hasIsActive);
    } else {
        console.log(
            "No records found in 'subjects' table. Cannot infer schema from data.",
        );
        // Try to insert a dummy record to fail and see error, or just assume empty
        // Or check pg specific logical
    }
}

inspect();
