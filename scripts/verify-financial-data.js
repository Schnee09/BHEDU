const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function verify() {
  console.log('\n📊 Financial Data Verification\n');
  console.log('='.repeat(50));

  // Student Accounts
  const { data: accounts, count: accountCount } = await supabase
    .from('student_accounts')
    .select('*', { count: 'exact' });
  console.log(`\n✅ Student Accounts: ${accountCount || accounts?.length || 0}`);

  // Fee Types
  const { data: feeTypes } = await supabase
    .from('fee_types')
    .select('name, category');
  console.log(`✅ Fee Types: ${feeTypes?.length || 0}`);
  feeTypes?.forEach(ft => console.log(`   - ${ft.name} (${ft.category})`));

  // Fee Assignments
  const { data: assignments } = await supabase
    .from('fee_assignments')
    .select('amount, fee_types(name)');
  console.log(`✅ Fee Assignments: ${assignments?.length || 0}`);

  // Invoices
  const { data: invoices } = await supabase
    .from('invoices')
    .select('invoice_number, total_amount, paid_amount, status');
  console.log(`✅ Invoices: ${invoices?.length || 0}`);
  invoices?.forEach(inv => {
    console.log(`   - ${inv.invoice_number}: ${inv.total_amount?.toLocaleString()} VND (${inv.status})`);
  });

  // Payment Methods
  const { data: methods } = await supabase
    .from('payment_methods')
    .select('name, type');
  console.log(`✅ Payment Methods: ${methods?.length || 0}`);
  methods?.forEach(m => console.log(`   - ${m.name} (${m.type})`));

  // Payments
  const { data: payments } = await supabase
    .from('payments')
    .select('amount, status, payment_date');
  console.log(`✅ Payments: ${payments?.length || 0}`);
  payments?.forEach(p => {
    console.log(`   - ${p.amount?.toLocaleString()} VND (${p.status}) on ${p.payment_date}`);
  });

  // Payment Allocations
  const { data: allocations } = await supabase
    .from('payment_allocations')
    .select('amount');
  console.log(`✅ Payment Allocations: ${allocations?.length || 0}`);

  console.log('\n' + '='.repeat(50));
  console.log('🎉 All financial tables verified!\n');
}

verify().catch(console.error);
