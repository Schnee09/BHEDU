import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function main() {
    console.log("Testing Supabase connectivity...");
    console.log("URL:", url);
    console.log("Key length:", key?.length);

    if (!url || !key) {
        console.error("Missing URL or Key");
        return;
    }

    const supabase = createClient(url, key);

    try {
        console.log("Querying profiles...");
        const { data, error } = await supabase.from("profiles").select("id")
            .limit(1);

        if (error) {
            console.error("Supabase query error:", error);
        } else {
            console.log("Successfully connected! Data:", data);
        }
    } catch (err) {
        console.error("Catch error:", err);
    }
}

main();
