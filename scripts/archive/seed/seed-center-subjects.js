/**
 * Seed core subjects for the center using Vietnamese codes
 * Subjects: Toán (TOAN), Lý (LY), Hóa (HOA), Văn (VAN), Anh (ANH), KHTN (KHTN)
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const CENTER_SUBJECTS = [
  { name: 'Toán học', code: 'TOAN', description: 'Môn Toán' },
  { name: 'Vật lý', code: 'LY', description: 'Môn Vật lý' },
  { name: 'Hóa học', code: 'HOA', description: 'Môn Hóa học' },
  { name: 'Ngữ văn', code: 'VAN', description: 'Môn Ngữ văn' },
  { name: 'Tiếng Anh', code: 'ANH', description: 'Môn Tiếng Anh' },
  { name: 'Khoa học tự nhiên', code: 'KHTN', description: 'Môn Khoa học tự nhiên' },
];

async function seedCenterSubjects() {
  try {
    console.log('📚 Seeding center subjects (Vietnamese codes)...');

    // Upsert by unique code so the script is idempotent
    const { data, error } = await supabase
      .from('subjects')
      .upsert(CENTER_SUBJECTS, { onConflict: 'code' })
      .select('id, name, code');

    if (error) throw error;

    console.log('✅ Subjects upserted:');
    (data || []).forEach((s) => {
      console.log(`   - ${s.name} (${s.code})`);
    });

    // Final list
    const { data: all, error: listErr } = await supabase
      .from('subjects')
      .select('name, code')
      .in('code', CENTER_SUBJECTS.map(s => s.code))
      .order('name');

    if (listErr) throw listErr;

    console.log('\n📊 Summary (center subjects):');
    all.forEach(s => console.log(`   - ${s.name} (${s.code})`));
    console.log(`   Total: ${all.length}`);

    console.log('\nℹ️ Note: For Vietnamese Grade Entry to save, each class needs a matching row in grade_categories with the same subject code (e.g., TOAN, LY, HOA, VAN, ANH, KHTN).');
    console.log('   If categories are missing, the UI can load students but saving will return 404: "Subject category not found for this class".');
  } catch (err) {
    console.error('❌ Error seeding center subjects:', err);
    process.exit(1);
  }
}

seedCenterSubjects();
