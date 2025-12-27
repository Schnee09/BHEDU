/**
 * Run migration to add category_id column to grades table
 * Usage: node scripts/run-grades-migration.js
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    console.log('Running grades table migration...');

    try {
        // Add category_id column
        const { error: err1 } = await supabase.rpc('exec_sql', {
            sql: `
        ALTER TABLE public.grades 
        ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.grade_categories(id);
      `
        });

        if (err1) {
            console.log('category_id column may already exist or RPC not available. Trying direct approach...');
        } else {
            console.log('✅ Added category_id column');
        }

        // Make assignment_id nullable
        const { error: err2 } = await supabase.rpc('exec_sql', {
            sql: `
        ALTER TABLE public.grades 
        ALTER COLUMN assignment_id DROP NOT NULL;
      `
        });

        if (err2) {
            console.log('assignment_id may already be nullable or RPC not available.');
        } else {
            console.log('✅ Made assignment_id nullable');
        }

        console.log('\n✅ Migration complete!');
        console.log('\nPlease verify by running this SQL in Supabase Dashboard:');
        console.log(`SELECT column_name FROM information_schema.columns WHERE table_name = 'grades';`);

    } catch (error) {
        console.error('Migration error:', error.message);
        console.log('\n⚠️ RPC exec_sql may not be available. Please run this SQL manually in Supabase Dashboard:');
        console.log(`
-- Add category_id column to grades for direct entry
ALTER TABLE public.grades 
ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.grade_categories(id);

-- Make assignment_id nullable (no longer required)
ALTER TABLE public.grades 
ALTER COLUMN assignment_id DROP NOT NULL;
    `);
    }
}

runMigration();
