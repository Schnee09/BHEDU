/**
 * Nuke Auth Script - BH-EDU
 *
 * Programmatically deletes all Supabase Auth users except for the superadmin.
 * Use with caution!
 *
 * Run with: npx tsx scripts/nuke-auth.ts
 */

import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing Supabase URL or Service Role Key in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});

const PROTECTED_EMAILS = ["superadmin@bhedu.vn"];

async function nuke() {
    console.log("🧨 BH-EDU Auth Nuke Starting...");

    let deletedCount = 0;
    let page = 1;

    while (true) {
        console.log(`\n📄 Fetching users (Page ${page})...`);
        const { data, error } = await supabase.auth.admin.listUsers({
            page,
            perPage: 50,
        });

        if (error) {
            console.error("Failed to list users:", error);
            break;
        }

        const users = data.users;
        if (!users || users.length === 0) {
            console.log("✨ No more users to process.");
            break;
        }

        console.log(`🔍 Found ${users.length} users on this page.`);

        for (const user of users) {
            if (user.email && PROTECTED_EMAILS.includes(user.email)) {
                console.log(`  🛡️  Skipping protected user: ${user.email}`);
                continue;
            }

            const { error: delError } = await supabase.auth.admin.deleteUser(
                user.id,
            );

            if (delError) {
                console.error(
                    `  ❌ Failed to delete ${user.email}: ${delError.message}`,
                );
            } else {
                console.log(`  🗑️  Deleted: ${user.email}`);
                deletedCount++;
            }
        }

        // Since we are deleting, the "next" page 1 will have new users.
        // If we increment page, we might skip users if we are deleting in-place.
        // So we stay on page 1 until no more users are left, or we hit only protected ones.

        const remainingUnprotected = users.filter((u) =>
            !PROTECTED_EMAILS.includes(u.email || "")
        );
        if (remainingUnprotected.length === 0) {
            console.log("✅ All unprotected users on this page processed.");
            // If there are ONLY protected users left on page 1, we might need to increment or stop.
            // But usually, since we deleted the rest, page 1 will now contain users from older page 2.
            // If only protected ones are left, we must break to avoid infinite loop.
            break;
        }
    }

    console.log(`\n🏁 Nuke Complete! Total users deleted: ${deletedCount}`);
}

nuke().catch(console.error);
