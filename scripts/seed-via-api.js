require('dotenv').config({ path: '.env.local' });

async function seedViaRestAPI() {
  console.log('💰 Seeding via REST API\n');
  
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  // Get current year
  const yearResponse = await fetch(`${SUPABASE_URL}/rest/v1/academic_years?is_current=eq.true`, {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`
    }
  });
  const [currentYear] = await yearResponse.json();
  console.log(`✅ Year: ${currentYear.name}`);
  
  // Get students
  const studentsResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles?role=eq.student&select=id,full_name,grade_level`, {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`
    }
  });
  const students = await studentsResponse.json();
  console.log(`✅ Students: ${students.length}\n`);
  
  // Create student accounts
  console.log('💳 Creating student accounts...');
  
  for (const student of students.slice(0, 5)) {  // First 5 only
    if (!student.grade_level) {
      console.log(`   ⏭️  ${student.full_name} - no grade level`);
      continue;
    }
    
    const accountData = {
      student_id: student.id,
      academic_year_id: currentYear.id,
      balance: 0,
      total_fees: 0,
      total_paid: 0,
      status: 'active'
    };
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/student_accounts`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(accountData)
    });
    
    if (response.ok) {
      console.log(`   ✅ ${student.full_name} - account created`);
    } else {
      const error = await response.text();
      console.log(`   ❌ ${student.full_name} - ${error}`);
    }
  }
  
  console.log('\n✨ Done!');
}

seedViaRestAPI();
