/**
 * Seed Vietnamese Grading Scale
 * This script creates the standard Vietnamese grading scale used in Vietnamese education
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

const VIETNAMESE_GRADING_SCALE = {
  name: 'Vietnamese Education Scale',
  description: 'Standard grading scale used in Vietnamese schools (Ministry of Education standards)',
  scale: [
    { letter: 'XS', min: 9.5, max: 10.0, gpa: 4.0 }, // Xuất sắc (Excellent)
    { letter: 'G', min: 8.5, max: 9.4, gpa: 3.7 },   // Giỏi (Good)
    { letter: 'K', min: 7.0, max: 8.4, gpa: 3.0 },   // Khá (Fair)
    { letter: 'TB', min: 5.0, max: 6.9, gpa: 2.0 },  // Trung bình (Average)
    { letter: 'Y', min: 0.0, max: 4.9, gpa: 1.0 },   // Yếu (Weak)
  ],
  is_default: true
};

async function seedVietnameseGradingScale() {
  try {
    console.log('🌏 Seeding Vietnamese grading scale...');

    // Check if Vietnamese scale already exists
    const { data: existingScale, error: checkError } = await supabase
      .from('grading_scales')
      .select('id, name')
      .eq('name', VIETNAMESE_GRADING_SCALE.name)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingScale) {
      console.log('✅ Vietnamese grading scale already exists, updating...');
      const { error: updateError } = await supabase
        .from('grading_scales')
        .update({
          description: VIETNAMESE_GRADING_SCALE.description,
          scale: VIETNAMESE_GRADING_SCALE.scale,
          is_default: VIETNAMESE_GRADING_SCALE.is_default,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingScale.id);

      if (updateError) throw updateError;
      console.log('✅ Vietnamese grading scale updated successfully!');
    } else {
      // If setting as default, unset other defaults first
      if (VIETNAMESE_GRADING_SCALE.is_default) {
        await supabase
          .from('grading_scales')
          .update({ is_default: false })
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Exclude non-existent
      }

      const { error: insertError } = await supabase
        .from('grading_scales')
        .insert([VIETNAMESE_GRADING_SCALE]);

      if (insertError) throw insertError;
      console.log('✅ Vietnamese grading scale created successfully!');
    }

    console.log('🎓 Vietnamese grading scale details:');
    console.log('   - Xuất sắc (XS): 9.5 - 10.0 (GPA: 4.0)');
    console.log('   - Giỏi (G): 8.5 - 9.4 (GPA: 3.7)');
    console.log('   - Khá (K): 7.0 - 8.4 (GPA: 3.0)');
    console.log('   - Trung bình (TB): 5.0 - 6.9 (GPA: 2.0)');
    console.log('   - Yếu (Y): 0.0 - 4.9 (GPA: 1.0)');

  } catch (error) {
    console.error('❌ Error seeding Vietnamese grading scale:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedVietnameseGradingScale();