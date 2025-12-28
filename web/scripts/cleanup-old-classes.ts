/**
 * scripts/cleanup-old-classes.ts
 * Remove old generic class names (10A, 10B, etc.) and keep education center format
 * 
 * Run with: npx tsx scripts/cleanup-old-classes.ts
 */

import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, "..", ".env.local") });
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Old class patterns to remove (like 10A, 10B, 11A, 12C)
const OLD_CLASS_PATTERN = /^\d{2}[A-C]$/;

async function main() {
  console.log("🧹 Cleanup Old Classes\n");

  // Get all classes
  const { data: allClasses, error } = await supabase
    .from("classes")
    .select("id, name");

  if (error) {
    console.error("Error fetching classes:", error.message);
    return;
  }

  // Find old format classes
  const oldClasses = (allClasses || []).filter(c => OLD_CLASS_PATTERN.test(c.name));
  console.log(`Found ${oldClasses.length} old-format classes to remove:\n`);

  for (const cls of oldClasses) {
    console.log(`  Deleting: ${cls.name}`);
    
    // Delete related records first (in order due to foreign keys)
    const { error: gErr } = await supabase.from("grades").delete().eq("class_id", cls.id);
    if (gErr) console.log(`    ⚠️ grades: ${gErr.message}`);
    
    const { error: aErr } = await supabase.from("attendance").delete().eq("class_id", cls.id);
    if (aErr) console.log(`    ⚠️ attendance: ${aErr.message}`);
    
    const { error: eErr } = await supabase.from("enrollments").delete().eq("class_id", cls.id);
    if (eErr) console.log(`    ⚠️ enrollments: ${eErr.message}`);
    
    const { error: cErr } = await supabase.from("classes").delete().eq("id", cls.id);
    if (cErr) {
      console.log(`    ❌ ${cErr.message}`);
    } else {
      console.log(`    ✅ Deleted`);
    }
  }

  // Show remaining classes
  const { data: remaining } = await supabase.from("classes").select("name").order("name");
  console.log(`\n📋 Remaining classes (${remaining?.length || 0}):`);
  remaining?.forEach(c => console.log(`  • ${c.name}`));
  
  console.log("\n✨ Done!");
}

main().catch(console.error);
