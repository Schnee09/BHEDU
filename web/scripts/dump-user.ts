import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function dumpTargetUser() {
    const targetEmail = "hs20260001@student.bhedu.vn";
    console.log(`🔍 Dumping data for ${targetEmail}...`);

    const { data: { users }, error: authError } = await supabase.auth.admin
        .listUsers();
    if (authError) {
        console.error("Auth list error:", authError);
        return;
    }

    const user = users.find((u) => u.email === targetEmail);
    if (!user) {
        console.error("User not found in auth.users");
        return;
    }

    console.log("\n--- Auth User ---");
    console.log(JSON.stringify(user, null, 2));

    console.log("\n--- Profiles Table (matching user_id) ---");
    const { data: p1 } = await supabase.from("profiles").select("*").eq(
        "user_id",
        user.id,
    );
    console.log(JSON.stringify(p1, null, 2));

    console.log("\n--- Profiles Table (matching id) ---");
    const { data: p2 } = await supabase.from("profiles").select("*").eq(
        "id",
        user.id,
    );
    console.log(JSON.stringify(p2, null, 2));

    console.log("\n--- Student Profiles Table ---");
    const profileIds = [
        ...new Set([
            ...(p1 || []).map((r) => r.id),
            ...(p2 || []).map((r) => r.id),
        ]),
    ];
    if (profileIds.length > 0) {
        const { data: sp } = await supabase.from("student_profiles").select("*")
            .in("profile_id", profileIds);
        console.log(JSON.stringify(sp, null, 2));
    }
}

dumpTargetUser();
