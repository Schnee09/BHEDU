/**
 * Import Data from JSON Export
 * 
 * This script imports the complete database export you provided
 * Run with: npx tsx scripts/import-json-data.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Your complete data export
const DATA = {
  profiles: [
    // Add your 33 profiles here from the JSON you shared
  ],
  classes: [
    // Add your 6 classes here
  ],
  enrollments: [
    // Add enrollments
  ],
  attendance: [
    // Add 1,782 attendance records
  ],
  // ... etc
};

async function importData() {
  console.log('🚀 Starting data import...\n');

  try {
    // 1. Import Profiles
    console.log('📊 Importing profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .upsert(DATA.profiles, { onConflict: 'id' });

    if (profilesError) {
      console.error('❌ Error importing profiles:', profilesError);
    } else {
      console.log(`✅ Imported ${DATA.profiles.length} profiles`);
    }

    // 2. Import Classes
    console.log('📊 Importing classes...');
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .upsert(DATA.classes, { onConflict: 'id' });

    if (classesError) {
      console.error('❌ Error importing classes:', classesError);
    } else {
      console.log(`✅ Imported ${DATA.classes.length} classes`);
    }

    // 3. Import Enrollments
    console.log('📊 Importing enrollments...');
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .upsert(DATA.enrollments, { onConflict: 'id' });

    if (enrollmentsError) {
      console.error('❌ Error importing enrollments:', enrollmentsError);
    } else {
      console.log(`✅ Imported ${DATA.enrollments.length} enrollments`);
    }

    // 4. Import Attendance
    console.log('📊 Importing attendance...');
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance')
      .upsert(DATA.attendance, { onConflict: 'id' });

    if (attendanceError) {
      console.error('❌ Error importing attendance:', attendanceError);
    } else {
      console.log(`✅ Imported ${DATA.attendance.length} attendance records`);
    }

    console.log('\n✅ Import complete!');
    console.log('\n📊 Summary:');
    console.log(`   - Profiles: ${DATA.profiles.length}`);
    console.log(`   - Classes: ${DATA.classes.length}`);
    console.log(`   - Enrollments: ${DATA.enrollments.length}`);
    console.log(`   - Attendance: ${DATA.attendance.length}`);
    console.log('\n🎉 Your data is now in Supabase!');

  } catch (error) {
    console.error('❌ Import failed:', error);
  }
}

importData();
