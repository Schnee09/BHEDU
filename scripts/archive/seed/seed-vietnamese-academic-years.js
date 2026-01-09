/**
 * Seed Vietnamese Academic Years
 * This script creates academic years following Vietnamese education system
 * Academic years run from September to June with two semesters
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

// Generate academic years for the next 5 years
function generateVietnameseAcademicYears() {
  const currentYear = new Date().getFullYear();
  const years = [];

  for (let i = -1; i < 4; i++) { // Previous year, current, and next 3 years
    const startYear = currentYear + i;
    const endYear = startYear + 1;

    years.push({
      name: `${startYear}-${endYear}`,
      start_date: `${startYear}-09-01`, // September 1st
      end_date: `${endYear}-06-30`,     // June 30th
      is_current: startYear === currentYear
    });
  }

  return years;
}

async function seedVietnameseAcademicYears() {
  try {
    console.log('📅 Seeding Vietnamese academic years...');

    const academicYears = generateVietnameseAcademicYears();

    for (const year of academicYears) {
      // Check if academic year already exists
      const { data: existingYear, error: checkError } = await supabase
        .from('academic_years')
        .select('id, name')
        .eq('name', year.name)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingYear) {
        console.log(`✅ Academic year ${year.name} already exists, updating...`);
        const { error: updateError } = await supabase
          .from('academic_years')
          .update({
            start_date: year.start_date,
            end_date: year.end_date,
            is_current: year.is_current,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingYear.id);

        if (updateError) throw updateError;
      } else {
        // If setting as current, unset other current years
        if (year.is_current) {
          await supabase
            .from('academic_years')
            .update({ is_current: false })
            .eq('is_current', true);
        }

        const { error: insertError } = await supabase
          .from('academic_years')
          .insert([year]);

        if (insertError) throw insertError;
        console.log(`✅ Academic year ${year.name} created successfully!`);
      }
    }

    console.log('\n🎓 Vietnamese Academic Year Structure:');
    console.log('   - Academic Year: September 1st - June 30th');
    console.log('   - Học kỳ I (HK1): September - December');
    console.log('   - Học kỳ II (HK2): January - June');
    console.log('   - Summer Break: July - August');

    // Show created years
    const { data: allYears, error: fetchError } = await supabase
      .from('academic_years')
      .select('name, start_date, end_date, is_current')
      .order('start_date', { ascending: false });

    if (fetchError) throw fetchError;

    console.log('\n📋 Current Academic Years:');
    allYears.forEach(year => {
      const status = year.is_current ? ' (CURRENT)' : '';
      console.log(`   - ${year.name}: ${year.start_date} to ${year.end_date}${status}`);
    });

  } catch (error) {
    console.error('❌ Error seeding Vietnamese academic years:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedVietnameseAcademicYears();