/**
 * Seed Vietnamese Subjects with Classification
 * This script creates standard Vietnamese school subjects with proper classification
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Vietnamese subjects with proper classification
const VIETNAMESE_SUBJECTS = [
  // Core subjects (Môn học cơ bản) - Required for all students
  { name: 'Toán học', code: 'MATH', subject_type: 'core', description: 'Mathematics' },
  { name: 'Ngữ văn', code: 'LIT', subject_type: 'core', description: 'Vietnamese Literature' },
  { name: 'Tiếng Anh', code: 'ENG', subject_type: 'core', description: 'English Language' },
  { name: 'Vật lý', code: 'PHY', subject_type: 'core', description: 'Physics' },
  { name: 'Hóa học', code: 'CHEM', subject_type: 'core', description: 'Chemistry' },
  { name: 'Sinh học', code: 'BIO', subject_type: 'core', description: 'Biology' },
  { name: 'Lịch sử', code: 'HIST', subject_type: 'core', description: 'History' },
  { name: 'Địa lý', code: 'GEO', subject_type: 'core', description: 'Geography' },
  { name: 'Giáo dục công dân', code: 'CIV', subject_type: 'core', description: 'Civic Education' },
  { name: 'Thể dục', code: 'PE', subject_type: 'core', description: 'Physical Education' },

  // Elective subjects (Môn học tự chọn) - Optional subjects
  { name: 'Tin học', code: 'IT', subject_type: 'elective', description: 'Information Technology' },
  { name: 'Công nghệ', code: 'TECH', subject_type: 'elective', description: 'Technology' },
  { name: 'Mỹ thuật', code: 'ART', subject_type: 'elective', description: 'Fine Arts' },
  { name: 'Âm nhạc', code: 'MUSIC', subject_type: 'elective', description: 'Music' },
  { name: 'Tiếng Pháp', code: 'FRE', subject_type: 'elective', description: 'French Language' },
  { name: 'Tiếng Trung', code: 'CHN', subject_type: 'elective', description: 'Chinese Language' },
  { name: 'Tiếng Nhật', code: 'JPN', subject_type: 'elective', description: 'Japanese Language' },
  { name: 'Khoa học tự nhiên', code: 'NATSCI', subject_type: 'elective', description: 'Natural Sciences' },

  // Specialized subjects (Môn học chuyên sâu) - For specific programs
  { name: 'Toán nâng cao', code: 'MATH_ADV', subject_type: 'specialized', description: 'Advanced Mathematics' },
  { name: 'Vật lý nâng cao', code: 'PHY_ADV', subject_type: 'specialized', description: 'Advanced Physics' },
  { name: 'Hóa học nâng cao', code: 'CHEM_ADV', subject_type: 'specialized', description: 'Advanced Chemistry' },
  { name: 'Sinh học nâng cao', code: 'BIO_ADV', subject_type: 'specialized', description: 'Advanced Biology' },
  { name: 'Lịch sử nâng cao', code: 'HIST_ADV', subject_type: 'specialized', description: 'Advanced History' },
  { name: 'Ngữ văn nâng cao', code: 'LIT_ADV', subject_type: 'specialized', description: 'Advanced Literature' },
  { name: 'Tiếng Anh nâng cao', code: 'ENG_ADV', subject_type: 'specialized', description: 'Advanced English' },
];

async function seedVietnameseSubjects() {
  try {
    console.log('📚 Seeding Vietnamese subjects with classification...');

    // First, try to add the subject_type column if it doesn't exist
    try {
      await supabase.from('subjects').select('subject_type').limit(1);
    } catch (error) {
      // Column doesn't exist, we'll handle this in the update/insert logic
      console.log('⚠️  subject_type column not found, will use default classification');
    }

    for (const subject of VIETNAMESE_SUBJECTS) {
      // Check if subject already exists
      const { data: existingSubject, error: checkError } = await supabase
        .from('subjects')
        .select('id, name, code')
        .eq('code', subject.code)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingSubject) {
        console.log(`✅ Subject ${subject.name} (${subject.code}) already exists, updating...`);
        const updateData = {
          name: subject.name,
          description: subject.description,
          updated_at: new Date().toISOString()
        };

        // Only add subject_type if the column exists
        try {
          await supabase.from('subjects').select('subject_type').limit(1);
          updateData.subject_type = subject.subject_type;
        } catch (error) {
          // Column doesn't exist yet
        }

        const { error: updateError } = await supabase
          .from('subjects')
          .update(updateData)
          .eq('id', existingSubject.id);

        if (updateError) throw updateError;
      } else {
        const insertData = { ...subject };

        // Only include subject_type if the column exists
        try {
          await supabase.from('subjects').select('subject_type').limit(1);
        } catch (error) {
          // Column doesn't exist, remove it from insert data
          delete insertData.subject_type;
        }

        const { error: insertError } = await supabase
          .from('subjects')
          .insert([insertData]);

        if (insertError) throw insertError;
        console.log(`✅ Subject ${subject.name} (${subject.code}) created successfully!`);
      }
    }

    console.log('\n📖 Vietnamese Subject Classification:');
    console.log('   - Core (Cơ bản): Required subjects for all students');
    console.log('   - Elective (Tự chọn): Optional subjects students can choose');
    console.log('   - Specialized (Chuyên sâu): Advanced subjects for specific programs');

    // Show summary
    const { data: allSubjects, error: fetchError } = await supabase
      .from('subjects')
      .select('name, code, subject_type')
      .order('subject_type', { ascending: true });

    if (fetchError) throw fetchError;

    const coreCount = allSubjects.filter(s => s.subject_type === 'core').length;
    const electiveCount = allSubjects.filter(s => s.subject_type === 'elective').length;
    const specializedCount = allSubjects.filter(s => s.subject_type === 'specialized').length;

    console.log('\n📊 Subject Summary:');
    console.log(`   - Core subjects: ${coreCount}`);
    console.log(`   - Elective subjects: ${electiveCount}`);
    console.log(`   - Specialized subjects: ${specializedCount}`);
    console.log(`   - Total subjects: ${allSubjects.length}`);

  } catch (error) {
    console.error('❌ Error seeding Vietnamese subjects:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedVietnameseSubjects();