#!/usr/bin/env node

/**
 * Fix Payment Schedule Installments
 * Ensures all payment schedules have proper installment records
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function fixPaymentInstallments() {
  console.log('\n🔧 Fixing Payment Schedule Installments\n');
  console.log('='.repeat(70) + '\n');

  try {
    // Get all payment schedules
    const { data: schedules, error: schedError } = await supabase
      .from('payment_schedules')
      .select('*')
      .order('created_at', { ascending: true });

    if (schedError) {
      console.error('❌ Error fetching schedules:', schedError.message);
      return;
    }

    console.log(`📋 Found ${schedules?.length || 0} payment schedules\n`);

    // Get existing installments
    const { data: existingInstallments } = await supabase
      .from('payment_schedule_installments')
      .select('schedule_id');

    const scheduleIdsWithInstallments = new Set(
      existingInstallments?.map(i => i.schedule_id) || []
    );

    let totalCreated = 0;

    // Create installments for schedules that don't have them
    for (const schedule of schedules || []) {
      if (scheduleIdsWithInstallments.has(schedule.id)) {
        console.log(`✅ Schedule ${schedule.id.substring(0, 8)}... already has installments`);
        continue;
      }

      console.log(`\n📝 Creating installments for schedule ${schedule.id.substring(0, 8)}...`);
      console.log(`   Duration: ${schedule.duration_months} months`);
      console.log(`   Total Amount: ${schedule.total_amount}`);

      const installmentData = [];
      const count = schedule.duration_months;
      const percentagePerInstallment = Math.floor(100 / count);
      const startDate = new Date(schedule.created_at);

      for (let i = 0; i < count; i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + i); // Monthly
        
        // Last installment gets remainder to ensure 100% total
        const percentage = i === count - 1 
          ? (100 - percentagePerInstallment * (count - 1)) 
          : percentagePerInstallment;

        installmentData.push({
          schedule_id: schedule.id,
          installment_number: i + 1,
          due_date: dueDate.toISOString().split('T')[0],
          percentage: percentage,
          amount: Math.round((schedule.total_amount * percentage) / 100 * 100) / 100,
          description: `Installment ${i + 1} of ${count}`,
          status: 'pending'
        });
      }

      const { data: newInstallments, error: instError } = await supabase
        .from('payment_schedule_installments')
        .insert(installmentData)
        .select();

      if (instError) {
        console.log(`   ❌ Error: ${instError.message}`);
      } else {
        const created = newInstallments?.length || 0;
        totalCreated += created;
        console.log(`   ✅ Created ${created} installments`);
        
        // Print summary
        installmentData.forEach((inst, idx) => {
          console.log(`      - Installment ${inst.installment_number}: ${inst.percentage}% (${inst.amount.toFixed(2)} VND) due on ${inst.due_date}`);
        });
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log(`\n✨ Payment installments fix complete!`);
    console.log(`   Total installments created: ${totalCreated}\n`);

  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

// Run the fixer
fixPaymentInstallments().then(() => {
  console.log('👍 Done!\n');
  process.exit(0);
}).catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
