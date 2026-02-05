import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fix() {
    const email = "superadmin@bhedu.vn";
    console.log(`Fixing ${email}...`);

    // 1. Get Auth User
    const { data: users } = await supabase.auth.admin.listUsers();
    const user = users.users.find((u) => u.email === email);

    if (!user) {
        console.error(
            "❌ Auth User NOT FOUND. Please run seed first to create auth.",
        );
        return;
    }
    console.log(`✅ Auth User: ${user.id}`);

    // 2. Check Profile by ID
    const { data: pById } = await supabase.from("profiles").select("*").eq(
        "user_id",
        user.id,
    ).maybeSingle();

    if (pById) {
        console.log("✅ Profile already exists by ID. Updating...");
        await supabase.from("profiles").update({
            email: email,
            role: "super_admin",
            full_name: "Siêu Quản Trị",
        }).eq("id", pById.id);
    } else {
        // 3. Check Profile by Email (Mismatched ID case)
        const { data: pByEmail } = await supabase.from("profiles").select("*")
            .eq("email", email).maybeSingle();

        if (pByEmail) {
            console.warn(
                `⚠️ Profile found by email but WRONG user_id (${pByEmail.user_id}). Relinking...`,
            );
            await supabase.from("profiles").update({ user_id: user.id }).eq(
                "id",
                pByEmail.id,
            );
        } else {
            console.log("⚠️ No profile found. Creating new...");
            const { error } = await supabase.from("profiles").insert({
                user_id: user.id,
                email: email,
                role: "super_admin",
                full_name: "Siêu Quản Trị",
                status: "active",
            });
            if (error) console.error("Insert error:", error);
        }
    }
    console.log("✅ Fix complete.");
}

fix();
