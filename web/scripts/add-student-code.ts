/**
 * Add Missing student_code Column
 * 
 * This script adds the missing student_code column to the profiles table
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
})

async function addStudentCodeColumn() {
  console.log('\n🔧 Adding student_code column to profiles table...\n')
  
  const sql = `
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS student_code VARCHAR(50) UNIQUE;
    CREATE INDEX IF NOT EXISTS idx_profiles_student_code ON profiles(student_code);
    CREATE INDEX IF NOT EXISTS idx_profiles_grade_level ON profiles(grade_level);
    CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
    CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);
  `
  
  try {
    // Execute the SQL
    const { error } = await supabase.rpc('exec', { sql })
    
    if (error) {
      console.log('⚠️  RPC method not available. Please run this SQL manually in Supabase SQL Editor:')
      console.log('\n' + sql + '\n')
      console.log('URL: https://supabase.com/dashboard/project/mwncwhkdimnjovxzhtjm/sql')
    } else {
      console.log('✅ Successfully added student_code column and indexes!')
    }
  } catch (err) {
    console.log('⚠️  Could not execute automatically. Please run this SQL manually in Supabase SQL Editor:')
    console.log('\n' + sql + '\n')
    console.log('URL: https://supabase.com/dashboard/project/mwncwhkdimnjovxzhtjm/sql')
  }
}

addStudentCodeColumn()
