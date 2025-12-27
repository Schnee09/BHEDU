/**
 * scripts/sync-education-center.ts
 * Sync database to match education center model
 * - Ensure all classes have a subject_id
 * - Ensure grades.subject_id matches class.subject_id
 * 
 * Run with: npx tsx scripts/sync-education-center.ts
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

async function main() {
  console.log("🔄 Syncing Education Center Model\n");

  // 1. Get subjects
  const { data: subjects } = await supabase.from('subjects').select('id, code, name');
  console.log(`📚 Subjects: ${subjects?.length || 0}`);

  if (!subjects || subjects.length === 0) {
    console.log("No subjects found. Creating default subjects...");
    const defaultSubjects = [
      { code: "toan", name: "Toán học" },
      { code: "van", name: "Ngữ văn" },
      { code: "anh", name: "Tiếng Anh" },
      { code: "ly", name: "Vật lý" },
      { code: "hoa", name: "Hóa học" },
    ];
    for (const s of defaultSubjects) {
      const { error } = await supabase.from('subjects').insert(s);
      if (!error) console.log(`  ✅ Created: ${s.name}`);
    }
    return main(); // Re-run after creating subjects
  }

  // Build subject map
  const subjectMap: Record<string, string> = {};
  subjects.forEach(s => { subjectMap[s.code] = s.id; subjectMap[s.name.toLowerCase()] = s.id; });

  // 2. Fix classes without subject_id
  console.log("\n📋 Checking classes...");
  const { data: classes } = await supabase.from('classes').select('id, name, subject_id');
  let fixedClasses = 0;

  for (const cls of classes || []) {
    if (!cls.subject_id) {
      // Try to infer subject from class name
      let subjectId: string | null = null;
      const nameLower = cls.name.toLowerCase();
      
      if (nameLower.includes('toán') || nameLower.includes('toan')) {
        subjectId = subjectMap['toan'];
      } else if (nameLower.includes('anh') || nameLower.includes('english') || nameLower.includes('ielts')) {
        subjectId = subjectMap['anh'];
      } else if (nameLower.includes('văn') || nameLower.includes('van')) {
        subjectId = subjectMap['van'];
      } else if (nameLower.includes('lý') || nameLower.includes('ly')) {
        subjectId = subjectMap['ly'];
      } else if (nameLower.includes('hóa') || nameLower.includes('hoa')) {
        subjectId = subjectMap['hoa'];
      }

      if (subjectId) {
        const { error } = await supabase.from('classes').update({ subject_id: subjectId }).eq('id', cls.id);
        if (!error) {
          console.log(`  ✅ Fixed: ${cls.name}`);
          fixedClasses++;
        }
      } else {
        console.log(`  ⚠️ Cannot infer subject for: ${cls.name}`);
      }
    }
  }
  console.log(`Fixed ${fixedClasses} classes`);

  // 3. Sync grades.subject_id with class.subject_id
  console.log("\n📊 Syncing grades...");
  const { data: grades } = await supabase.from('grades').select('id, class_id, subject_id');
  const { data: classesWithSubject } = await supabase.from('classes').select('id, subject_id');
  
  // Build class->subject map
  const classSubjectMap: Record<string, string> = {};
  classesWithSubject?.forEach(c => { if (c.subject_id) classSubjectMap[c.id] = c.subject_id; });

  let syncedGrades = 0;
  for (const grade of grades || []) {
    const expectedSubjectId = classSubjectMap[grade.class_id];
    if (expectedSubjectId && grade.subject_id !== expectedSubjectId) {
      const { error } = await supabase.from('grades')
        .update({ subject_id: expectedSubjectId })
        .eq('id', grade.id);
      if (!error) syncedGrades++;
    }
  }
  console.log(`Synced ${syncedGrades} grades`);

  // 4. Summary
  console.log("\n📊 Final counts:");
  const tables = ['subjects', 'classes', 'profiles', 'enrollments', 'grades', 'attendance'];
  for (const table of tables) {
    const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
    console.log(`  ${table}: ${count || 0}`);
  }

  console.log("\n✨ Sync complete!");
}

main().catch(console.error);
