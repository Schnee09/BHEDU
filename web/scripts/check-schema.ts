import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  console.log("🔍 Inspecting profiles table columns...");

  // Use PostgREST's ability to return schema information
  // or just try to select one by one to see which one fails (brute force since we can't run SQL)

  const columns = [
    "id",
    "user_id",
    "full_name",
    "first_name",
    "last_name",
    "role",
    "email",
    "phone",
    "address",
    "date_of_birth",
    "personal_email",
  ];

  for (const col of columns) {
    const { error } = await supabase
      .from("profiles")
      .select(col)
      .limit(1);

    if (error) {
      console.log(`❌ Column "${col}" error: ${error.message} (${error.code})`);
    } else {
      console.log(`✅ Column "${col}" exists.`);
    }
  }

  console.log("\n✅ Schema check complete.");
}

checkSchema();
