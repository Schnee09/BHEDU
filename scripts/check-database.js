#!/usr/bin/env node

/**
 * Check Current Database Data Counts
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function checkData() {
  console.log('\n📊 Current Database State\n');
  console.log('='.repeat(50));

  const tables = [
    // Core
    'profiles',
    'classes',
    'enrollments',
    'academic_years',
    'subjects',
    'courses',
    'lessons',
    // Attendance
    'attendance',
    'attendance_reports',
    // Grades
    'assignment_categories',
    'assignments',
    'grades',
    'grading_scales',
    // People
    'guardians',
    // Financial
    'student_accounts',
    'fee_types',
    'fee_assignments',
    'invoices',
    'invoice_items',
    'payment_methods',
    'payments',
    'payment_allocations',
    'payment_schedules',
    'payment_schedule_installments',
    // Other
    'notifications',
    'qr_codes',
    'school_settings',
    'audit_logs',
    'import_logs',
    'import_errors'
  ];

  const results = [];
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        results.push({ table, count: 'ERROR', note: error.message });
      } else {
        results.push({ table, count: count || 0 });
      }
    } catch (e) {
      results.push({ table, count: 'N/A', note: 'Table may not exist' });
    }
  }

  // Group by category
  const groups = {
    'Core': ['profiles', 'classes', 'enrollments', 'academic_years', 'subjects', 'courses', 'lessons'],
    'Attendance': ['attendance', 'attendance_reports'],
    'Grades': ['assignment_categories', 'assignments', 'grades', 'grading_scales'],
    'People': ['guardians'],
    'Financial': ['student_accounts', 'fee_types', 'fee_assignments', 'invoices', 'invoice_items', 'payment_methods', 'payments', 'payment_allocations', 'payment_schedules', 'payment_schedule_installments'],
    'Other': ['notifications', 'qr_codes', 'school_settings', 'audit_logs', 'import_logs', 'import_errors']
  };

  for (const [group, tableNames] of Object.entries(groups)) {
    console.log(`\n📁 ${group}:`);
    for (const t of tableNames) {
      const r = results.find(x => x.table === t);
      const icon = r.count === 0 ? '⚪' : r.count === 'ERROR' ? '❌' : '✅';
      const countStr = typeof r.count === 'number' ? r.count.toString().padStart(4) : r.count.padStart(4);
      console.log(`   ${icon} ${t.padEnd(30)} ${countStr}${r.note ? ` (${r.note})` : ''}`);
    }
  }

  // Summary
  const total = results.filter(r => typeof r.count === 'number').reduce((sum, r) => sum + r.count, 0);
  const empty = results.filter(r => r.count === 0).length;
  console.log('\n' + '='.repeat(50));
  console.log(`📈 Total records: ${total}`);
  console.log(`⚪ Empty tables: ${empty}`);
  console.log('');
}

checkData().catch(console.error);
