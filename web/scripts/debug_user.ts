import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debug() {
    const email = "superadmin@bhedu.vn";
    console.log(`Searching for ${email}...`);

    // 1. Check Auth User
    const { data: users, error: uErr } = await supabase.auth.admin.listUsers();
    const user = users.users.find((u) => u.email === email);

    if (!user) {
        console.error("❌ Auth User NOT FOUND");
        return;
    }
    console.log(`✅ Auth User Found: ${user.id}`);
    console.log(`   Metadata:`, user.user_metadata);

    // 2. Check Profile
    const { data: profile, error: pErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

    if (pErr) console.error("❌ Profile Query Error:", pErr);

    if (!profile) {
        console.error("❌ Profile NOT FOUND for this user_id");
        // Check if profile exists by email?
        const { data: pByEmail } = await supabase.from("profiles").select("*")
            .eq("email", email).maybeSingle();
        if (pByEmail) {
            console.warn(
                `⚠️ BUT a profile exists with this email, linked to user_id: ${pByEmail.user_id}`,
            );
            console.warn(
                `   MISMATCH! Auth ID: ${user.id} vs Profile user_id: ${pByEmail.user_id}`,
            );
        }
    } else {
        console.log("✅ Profile Found:", profile);
    }
}

debug();
