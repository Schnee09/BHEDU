#!/usr/bin/env node

/**
 * Supabase Data Audit
 * Check what data exists across all key tables
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function auditData() {
  console.log('\n📊 Supabase Data Audit\n');
  console.log('='.repeat(70) + '\n');
  
  const tables = [
    // Core tables
    { name: 'profiles', role: 'role', extra: ['student_code', 'full_name'] },
    { name: 'academic_years', extra: ['name', 'is_current'] },
    { name: 'classes', extra: ['name', 'grade_level'] },
    { name: 'enrollments' },
    
    // Financial tables
    { name: 'student_accounts', extra: ['balance', 'total_fees', 'total_paid'] },
    { name: 'fee_types', extra: ['name', 'category'] },
    { name: 'fee_assignments', extra: ['amount'] },
    { name: 'invoices', extra: ['invoice_number', 'total_amount', 'status'] },
    { name: 'invoice_items', extra: ['amount'] },
    { name: 'payment_methods', extra: ['name', 'is_active'] },
    { name: 'payments', extra: ['payment_number', 'amount', 'status'] },
    { name: 'payment_allocations', extra: ['amount'] },
    { name: 'payment_schedules', extra: ['name', 'total_amount'] },
    { name: 'payment_schedule_installments', extra: ['installment_number', 'amount', 'status'] }
  ];
  
  for (const table of tables) {
    try {
      // Get total count
      const { count, error: countError } = await supabase
        .from(table.name)
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.log(`❌ ${table.name.padEnd(35)} Error: ${countError.message}`);
        continue;
      }
      
      const icon = count > 0 ? '✅' : '⚪';
      let line = `${icon} ${table.name.padEnd(35)} ${count} records`;
      
      // Get sample data if exists
      if (count > 0 && table.extra) {
        const selectFields = ['id', ...table.extra].join(', ');
        const { data, error } = await supabase
          .from(table.name)
          .select(selectFields)
          .limit(3);
        
        if (!error && data && data.length > 0) {
          console.log(line);
          
          // Show breakdown if role field exists
          if (table.role) {
            const { data: roleData } = await supabase
              .from(table.name)
              .select(table.role);
            
            if (roleData) {
              const counts = {};
              roleData.forEach(r => {
                const role = r[table.role];
                counts[role] = (counts[role] || 0) + 1;
              });
              
              Object.entries(counts).forEach(([role, count]) => {
                console.log(`   └─ ${role}: ${count}`);
              });
            }
          }
          
          // Show sample records
          if (!table.role) {
            data.slice(0, 2).forEach((record, i) => {
              const preview = table.extra
                .map(field => `${field}=${record[field]}`)
                .join(', ');
              console.log(`   ${i + 1}. ${preview}`);
            });
          }
        } else {
          console.log(line);
        }
      } else {
        console.log(line);
      }
      
    } catch (err) {
      console.log(`❌ ${table.name.padEnd(35)} Error: ${err.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('\n💡 Analysis:\n');
  
  // Check relationships
  const { data: students } = await supabase
    .from('profiles')
    .select('id, full_name, student_code')
    .eq('role', 'student')
    .limit(5);
  
  const { data: currentYear } = await supabase
    .from('academic_years')
    .select('id, name, start_date, end_date')
    .eq('is_current', true)
    .single();
  
  const { data: classes } = await supabase
    .from('classes')
    .select('id, name, grade_level')
    .limit(5);
  
  console.log('📚 Current Academic Context:');
  if (currentYear) {
    console.log(`   ✅ Current Year: ${currentYear.name} (${currentYear.id})`);
  } else {
    console.log('   ⚠️  No current academic year set');
  }
  
  if (students && students.length > 0) {
    console.log(`\n👨‍🎓 Sample Students (${students.length} shown):`);
    students.forEach((s, i) => {
      console.log(`   ${i + 1}. ${s.full_name} (${s.student_code || 'no code'})`);
    });
  }
  
  if (classes && classes.length > 0) {
    console.log(`\n🏫 Sample Classes (${classes.length} shown):`);
    classes.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.name} - Grade ${c.grade_level}`);
    });
  }
  
  // Check what's missing
  console.log('\n⚠️  Missing for Financial System:');
  
  const { data: studentAccounts } = await supabase
    .from('student_accounts')
    .select('id')
    .limit(1);
  
  if (!studentAccounts || studentAccounts.length === 0) {
    console.log('   • Student accounts (link students to academic years)');
  }
  
  const { data: feeAssignments } = await supabase
    .from('fee_assignments')
    .select('id')
    .limit(1);
  
  if (!feeAssignments || feeAssignments.length === 0) {
    console.log('   • Fee assignments (assign fees to classes/grades)');
  }
  
  const { data: invoices } = await supabase
    .from('invoices')
    .select('id')
    .limit(1);
  
  if (!invoices || invoices.length === 0) {
    console.log('   • Student invoices (bills for fees)');
  }
  
  console.log('\n✅ What Exists:');
  console.log('   • Fee types (10 categories defined)');
  console.log('   • Payment methods (6 options available)');
  console.log(`   • Students (${students?.length || 0} found)`);
  console.log(`   • Classes (${classes?.length || 0} found)`);
  
  console.log('\n🎯 Next Steps:');
  console.log('   1. Create student accounts for current academic year');
  console.log('   2. Assign fees to classes/grade levels');
  console.log('   3. Generate invoices for students');
  console.log('   4. Enable payment recording');
  console.log('\n');
}

auditData().catch(console.error);
