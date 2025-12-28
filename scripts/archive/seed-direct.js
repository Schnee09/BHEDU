require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    db: {
      schema: 'public',
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function seedFinancial() {
  console.log('💰 Seeding Financial Data (Direct SQL)\n');
  console.log('='.repeat(60) + '\n');
  
  // 1. Get current academic year
  console.log('📅 Step 1: Getting current academic year...');
  const { data: currentYear } = await supabase
    .from('academic_years')
    .select('*')
    .eq('is_current', true)
    .single();
  
  console.log(`✅ Found: ${currentYear.name} (${currentYear.id})\n`);
  
  // 2. Get students with grade levels
  console.log('👨‍🎓 Step 2: Getting students...');
  const { data: students } = await supabase
    .from('profiles')
    .select('id, full_name, student_code, grade_level')
    .eq('role', 'student')
    .not('grade_level', 'is', null);
  
  console.log(`✅ Found ${students.length} students\n`);
  
  // 3. Create student accounts using RPC or direct SQL
  console.log('💳 Step 3: Creating student accounts...');
  
  for (const student of students) {
    // Use raw SQL to insert
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        INSERT INTO public.student_accounts (student_id, academic_year_id, balance, total_fees, total_paid, status)
        VALUES ('${student.id}', '${currentYear.id}', 0, 0, 0, 'active')
        ON CONFLICT (student_id, academic_year_id) DO NOTHING
        RETURNING id;
      `
    });
    
    if (error) {
      // Try alternative method: use .from() with schema override
      const { error: insertError } = await supabase
        .schema('public')
        .from('student_accounts')
        .upsert({
          student_id: student.id,
          academic_year_id: currentYear.id,
          balance: 0,
          total_fees: 0,
          total_paid: 0,
          status: 'active'
        }, {
          onConflict: 'student_id,academic_year_id'
        });
      
      if (insertError) {
        console.log(`   ❌ ${student.full_name} - ${insertError.message}`);
      } else {
        console.log(`   ✅ ${student.full_name} - account created`);
      }
    } else {
      console.log(`   ✅ ${student.full_name} - account created`);
    }
  }
  
  console.log('\n✨ Seeding complete!');
}

seedFinancial();
