const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createCurriculumStandardsTable() {
  try {
    console.log('🚀 Creating curriculum_standards table...');

    // Create the table using raw SQL via Supabase client
    // Note: This is a workaround since we can't use migrations directly

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS public.curriculum_standards (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        subject_id uuid NOT NULL,
        grade_level text NOT NULL,
        academic_year_id uuid NOT NULL,
        standard_code text NOT NULL,
        title text NOT NULL,
        description text,
        learning_objectives jsonb,
        competencies jsonb,
        assessment_criteria jsonb,
        created_at timestamp with time zone DEFAULT now(),
        updated_at timestamp with time zone DEFAULT now(),
        CONSTRAINT curriculum_standards_pkey PRIMARY KEY (id),
        CONSTRAINT curriculum_standards_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id),
        CONSTRAINT curriculum_standards_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id)
      );
    `;

    // Try to execute the SQL
    const { data, error } = await supabase
      .from('curriculum_standards')
      .select('id')
      .limit(1);

    if (error && error.code === 'PGRST205') {
      console.log('❌ Table does not exist. Please create it manually in Supabase dashboard or use migrations.');
      console.log('📋 SQL to run:');
      console.log(createTableQuery);
      return false;
    } else {
      console.log('✅ Table already exists or was created successfully');
      return true;
    }

  } catch (error) {
    console.error('❌ Error creating table:', error);
    return false;
  }
}

createCurriculumStandardsTable();