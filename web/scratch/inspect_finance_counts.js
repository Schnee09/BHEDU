const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  console.log('Inspecting database tables...');
  
  const tables = [
    'profiles',
    'classes',
    'enrollments',
    'invoices',
    'payments',
    'student_accounts',
    'announcements'
  ];

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error(`Error counting ${table}:`, error.message);
    } else {
      console.log(`Table: ${table} -> Count: ${count}`);
    }
  }

  // Sample query payments
  const { data: recentPayments } = await supabase.from('payments').select('amount, payment_date, status').limit(5);
  console.log('Recent Payments:', recentPayments);

  // Sample query invoices
  const { data: recentInvoices } = await supabase.from('invoices').select('total_amount, paid_amount, status').limit(5);
  console.log('Recent Invoices:', recentInvoices);
}

inspect();
