// backend/seed_users.js
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // must be service role, not anon
);

const users = [
  {
    email: "admin@demo.com",
    password: "Admin123!",
    full_name: "Admin User",
    role: "admin",
  },
  {
    email: "teacher@demo.com",
    password: "Teacher123!",
    full_name: "Teacher A",
    role: "teacher",
  },
  {
    email: "student@demo.com",
    password: "Student123!",
    full_name: "Student A",
    role: "student",
  },
];

for (const u of users) {
  const { data, error } = await supabase.auth.admin.createUser({
    email: u.email,
    password: u.password,
    email_confirm: true,
  });

  if (error) {
    console.error(`❌ ${u.email}:`, error.message);
  } else {
    console.log(`✅ Created ${u.role}: ${u.email}`);
  }
}

console.log("\nAll users processed. Now run: supabase db seed\n");
