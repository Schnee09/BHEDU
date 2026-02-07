import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDuplicates() {
    console.log("🔍 Checking for profile duplicates/anomalies...");

    interface Profile {
        id: string;
        user_id: string | null;
        email: string | null;
        full_name: string | null;
    }

    // 1. Find profiles where sub-query finds a user with same ID
    const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, email, full_name");

    if (error) {
        console.error("Error fetching profiles:", error);
        return;
    }

    const profiles: Profile[] = data as any;

    const userIdMap = new Map<string, Profile[]>();
    const idMap = new Map<string, Profile[]>();
    const emailMap = new Map<string, Profile[]>();

    profiles.forEach((p) => {
        if (p.user_id) {
            if (!userIdMap.has(p.user_id)) userIdMap.set(p.user_id, []);
            userIdMap.get(p.user_id)!.push(p);
        }
        if (p.id) {
            if (!idMap.has(p.id)) idMap.set(p.id, []);
            idMap.get(p.id)!.push(p);
        }
        if (p.email) {
            if (!emailMap.has(p.email)) emailMap.set(p.email, []);
            emailMap.get(p.email)!.push(p);
        }
    });

    console.log(`Total profiles: ${profiles.length}`);

    console.log("\n--- Duplicate user_id ---");
    for (const [uid, entries] of userIdMap.entries()) {
        if (entries.length > 1) {
            console.log(`User ID: ${uid}`);
            entries.forEach((e) =>
                console.log(
                    `  - Profile ID: ${e.id}, Email: ${e.email}, Name: ${e.full_name}`,
                )
            );
        }
    }

    console.log("\n--- Duplicate email ---");
    for (const [email, entries] of emailMap.entries()) {
        if (entries.length > 1) {
            console.log(`Email: ${email}`);
            entries.forEach((e) =>
                console.log(
                    `  - Profile ID: ${e.id}, User ID: ${e.user_id}, Name: ${e.full_name}`,
                )
            );
        }
    }

    console.log("\n--- Crossed ID/User_ID ---");
    // Check if any profile.id is someone else's profile.user_id
    profiles.forEach((p) => {
        const others = userIdMap.get(p.id);
        if (others && others.some((o) => o.id !== p.id)) {
            console.log(
                `Profile ID ${p.id} (${p.full_name}) is also used as user_id in other profiles:`,
            );
            others.forEach((o) =>
                console.log(`  - Other Profile ID: ${o.id}, Email: ${o.email}`)
            );
        }
    });

    console.log("\n✅ Diagnostics complete.");
}

checkDuplicates();
