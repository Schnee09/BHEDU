const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const missingSubjects = [
  {
    name: 'Ngữ văn',
    code: 'LIT',
    description: 'Môn Ngữ văn (Literature)'
  },
  {
    name: 'Vật lý',
    code: 'PHY',
    description: 'Môn Vật lý (Physics)'
  },
  {
    name: 'Giáo dục công dân',
    code: 'CIVIC',
    description: 'Môn Giáo dục công dân (Civic Education)'
  },
  {
    name: 'Tin học',
    code: 'IT',
    description: 'Môn Tin học (Informatics)'
  },
  {
    name: 'Công nghệ',
    code: 'TECH',
    description: 'Môn Công nghệ (Technology)'
  },
  {
    name: 'Giáo dục quốc phòng',
    code: 'DEF',
    description: 'Môn Giáo dục quốc phòng (National Defense Education)'
  }
];

async function seedMissingSubjects() {
  try {
    console.log('📚 Seeding missing subjects...');

    for (const subject of missingSubjects) {
      // Check if subject exists
      const { data: existing } = await supabase
        .from('subjects')
        .select('id')
        .eq('code', subject.code)
        .single();

      if (existing) {
        console.log(`ℹ️  Subject ${subject.code} already exists.`);
      } else {
        const { error } = await supabase
          .from('subjects')
          .insert(subject);

        if (error) {
          console.error(`❌ Error creating subject ${subject.code}:`, error);
        } else {
          console.log(`✅ Created subject: ${subject.name} (${subject.code})`);
        }
      }
    }

    console.log('🎉 Missing subjects seeding completed!');

  } catch (error) {
    console.error('❌ Error seeding subjects:', error);
  }
}

seedMissingSubjects();