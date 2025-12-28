#!/usr/bin/env node

/**
 * Seed Financial Data
 * Creates sample financial data for testing the finance system
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function seedFinancialData() {
  console.log('\n💰 Seeding Financial Data\n');
  console.log('='.repeat(70) + '\n');
  
  try {
    // 1. Get current academic year
    console.log('📅 Step 1: Getting current academic year...');
    const { data: currentYear, error: yearError } = await supabase
      .from('academic_years')
      .select('id, name')
      .eq('is_current', true)
      .single();
    
    if (yearError || !currentYear) {
      console.log('❌ No current academic year found');
      return;
    }
    console.log(`✅ Found: ${currentYear.name} (${currentYear.id})`);
    
    // 2. Get all students
    console.log('\n👨‍🎓 Step 2: Getting students...');
    const { data: students, error: studentsError } = await supabase
      .from('profiles')
      .select('id, full_name, student_code')
      .eq('role', 'student');
    
    if (studentsError) {
      console.log('❌ Error getting students:', studentsError.message);
      return;
    }
    console.log(`✅ Found ${students.length} students`);
    
    // 3. Get classes
    console.log('\n🏫 Step 3: Getting classes...');
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select('id, name');
    
    if (classesError) {
      console.log('❌ Error getting classes:', classesError.message);
      return;
    }
    console.log(`✅ Found ${classes.length} classes`);
    
    // 4. Get fee types (or create them if they don't exist)
    console.log('\n💵 Step 4: Getting/creating fee types...');
    
    // First check if fee types exist
    let { data: feeTypes, error: feeTypesError } = await supabase
      .from('fee_types')
      .select('id, name, code, category, description')
      .eq('is_active', true);
    
    if (feeTypesError) {
      console.log('❌ Error getting fee types:', feeTypesError.message);
      return;
    }
    
    // If no fee types exist, create them
    if (!feeTypes || feeTypes.length === 0) {
      console.log('   Creating default fee types...');
      const defaultFeeTypes = [
        { name: 'Tuition Fee', code: 'TUITION', category: 'tuition', description: 'Regular tuition fees' },
        { name: 'Lab Fee', code: 'LAB', category: 'facility', description: 'Science laboratory usage fee' },
        { name: 'Activity Fee', code: 'ACTIVITY', category: 'activity', description: 'Extracurricular activities fee' },
        { name: 'Exam Fee', code: 'EXAM', category: 'exam', description: 'Examination and assessment fee' }
      ];
      
      const { data: createdFees, error: createError } = await supabase
        .from('fee_types')
        .insert(defaultFeeTypes)
        .select();
      
      if (createError) {
        console.log('❌ Error creating fee types:', createError.message);
        return;
      }
      feeTypes = createdFees;
    }
    
    console.log(`✅ Found ${feeTypes.length} fee types`);
    
    // Create a mapping of fee type categories for easy lookup
    const feeTypeMap = {};
    feeTypes.forEach(ft => {
      feeTypeMap[ft.category] = ft;
    });
    
    // 5. Create student accounts
    console.log('\n💳 Step 5: Creating student accounts...');
    const studentAccounts = [];
    
    for (const student of students) {
      // Check if account already exists
      const { data: existing } = await supabase
        .from('student_accounts')
        .select('id')
        .eq('student_id', student.id)
        .eq('academic_year_id', currentYear.id)
        .single();
      
      if (existing) {
        console.log(`   ⏭️  ${student.full_name} - account already exists`);
        studentAccounts.push(existing);
        continue;
      }
      
      const { data: account, error } = await supabase
        .from('student_accounts')
        .insert({
          student_id: student.id,
          academic_year_id: currentYear.id,
          balance: 0,
          total_fees: 0,
          total_paid: 0,
          status: 'active'
        })
        .select()
        .single();
      
      if (error) {
        console.log(`   ❌ ${student.full_name} - ${error.message}`);
      } else {
        console.log(`   ✅ ${student.full_name} - account created`);
        studentAccounts.push(account);
      }
    }
    
    // 6. Assign fees to grade levels (universal fees)
    console.log('\n📋 Step 6: Creating universal fee assignments...');
    
    // Map category names to amounts by grade
    const feeAmountsByGrade = {
      10: { 
        tuition: 5000000,  // Tuition Fee
        facility: 300000,  // Lab Fee (facility category)
        activity: 150000,  // Activity Fee
        exam: 100000       // Exam Fee
      },
      11: { 
        tuition: 5500000,
        facility: 300000,
        activity: 150000,
        exam: 100000
      },
      12: { 
        tuition: 6000000,
        facility: 300000,
        activity: 150000,
        exam: 100000
      }
    };
    
    let assignmentsCreated = 0;
    
    // Create universal fee assignments (not tied to specific classes)
    for (const gradeLevel of [10, 11, 12]) {
      for (const [feeKey, amount] of Object.entries(feeAmountsByGrade[gradeLevel])) {
        const feeType = feeTypeMap[feeKey];
        if (!feeType) {
          console.log(`   ⚠️  Fee type "${feeKey}" not found in database`);
          continue;
        }
        
        // Check if assignment exists
        const { data: existing } = await supabase
          .from('fee_assignments')
          .select('id')
          .eq('academic_year_id', currentYear.id)
          .eq('fee_type_id', feeType.id)
          .is('class_id', null)
          .single();
        
        if (existing) continue;
        
        const { error } = await supabase
          .from('fee_assignments')
          .insert({
            academic_year_id: currentYear.id,
            fee_type_id: feeType.id,
            class_id: null, // Universal for all classes
            amount: amount,
            description: `Grade ${gradeLevel} standard fee`,
            is_active: true
          });
        
        if (!error) {
          assignmentsCreated++;
          console.log(`   ✅ ${feeType.name} - Grade ${gradeLevel}: ${amount.toLocaleString()} VND`);
        } else {
          console.log(`   ❌ ${feeType.name} - ${error.message}`);
        }
      }
    }
    
    console.log(`✅ Created ${assignmentsCreated} fee assignments`);
    
    // 7. Generate sample invoices for first 5 students
    console.log('\n🧾 Step 7: Generating sample invoices...');
    
    const sampleStudents = students.slice(0, 5);
    let invoicesCreated = 0;
    
    for (const student of sampleStudents) {
      // Get student's grade level from profile
      const { data: studentProfile } = await supabase
        .from('profiles')
        .select('grade_level')
        .eq('id', student.id)
        .single();
      
      if (!studentProfile || !studentProfile.grade_level) {
        console.log(`   ⏭️  ${student.full_name} - no grade level`);
        continue;
      }
      
      const studentGrade = studentProfile.grade_level;
      
      // Get student's account
      const { data: account } = await supabase
        .from('student_accounts')
        .select('id')
        .eq('student_id', student.id)
        .eq('academic_year_id', currentYear.id)
        .single();
      
      if (!account) continue;
      
      // Check if invoice exists
      const { data: existingInvoice } = await supabase
        .from('invoices')
        .select('id')
        .eq('student_account_id', account.id)
        .eq('academic_year_id', currentYear.id)
        .limit(1)
        .single();
      
      if (existingInvoice) {
        console.log(`   ⏭️  ${student.full_name} - invoice already exists`);
        continue;
      }
      
      // Create invoice
      const invoiceNumber = `INV-${currentYear.name.split('-')[0]}-${String(invoicesCreated + 1).padStart(4, '0')}`;
      
      // Calculate total from applicable fees for this grade
      let totalAmount = 0;
      const gradeFees = feeAmountsByGrade[studentGrade] || {};
      const invoiceItems = [];
      
      for (const [feeKey, amount] of Object.entries(gradeFees)) {
        const feeType = feeTypeMap[feeKey];
        if (feeType) {
          totalAmount += amount;
          invoiceItems.push({
            fee_type_id: feeType.id,
            description: feeType.name,
            amount: amount,
            quantity: 1
          });
        }
      }
      
      if (totalAmount === 0) {
        console.log(`   ⏭️  ${student.full_name} - no fees for grade ${studentGrade}`);
        continue;
      }
      
      const { data: invoice, error: invError } = await supabase
        .from('invoices')
        .insert({
          student_id: student.id,
          student_account_id: account.id,
          academic_year_id: currentYear.id,
          invoice_number: invoiceNumber,
          issue_date: new Date().toISOString().split('T')[0],
          due_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
          total_amount: totalAmount,
          paid_amount: 0,
          status: 'pending',
          notes: 'Semester 1 fees'
        })
        .select()
        .single();
      
      if (invError) {
        console.log(`   ❌ ${student.full_name} - ${invError.message}`);
        continue;
      }
      
      // Create invoice items
      for (const item of invoiceItems) {
        await supabase
          .from('invoice_items')
          .insert({
            invoice_id: invoice.id,
            fee_type_id: item.fee_type_id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.amount,
            total_price: item.amount * item.quantity
          });
      }
      
      // Update student account totals
      await supabase
        .from('student_accounts')
        .update({
          total_fees: totalAmount,
          balance: totalAmount
        })
        .eq('id', account.id);
      
      console.log(`   ✅ ${student.full_name} (Grade ${studentGrade}) - Invoice ${invoiceNumber} (${totalAmount.toLocaleString()} VND)`);
      invoicesCreated++;
    }
    
    // 8. Create sample payment for first student
    console.log('\n💳 Step 8: Creating sample payment...');
    
    if (sampleStudents.length > 0) {
      const firstStudent = sampleStudents[0];
      
      // Get their invoice
      const { data: studentAccount } = await supabase
        .from('student_accounts')
        .select('id')
        .eq('student_id', firstStudent.id)
        .eq('academic_year_id', currentYear.id)
        .single();
      
      if (studentAccount) {
        const { data: invoice } = await supabase
          .from('invoices')
          .select('id, invoice_number, total_amount')
          .eq('student_account_id', studentAccount.id)
          .single();
        
        if (invoice) {
          // Check if payment exists for this student
          const { data: existingPayment } = await supabase
            .from('payments')
            .select('id')
            .eq('student_id', firstStudent.id)
            .limit(1)
            .single();
          
          if (!existingPayment) {
            const paymentAmount = Math.floor(invoice.total_amount / 2); // Pay 50%
            
            // Get or create Cash payment method
            let { data: cashMethod } = await supabase
              .from('payment_methods')
              .select('id')
              .eq('name', 'Cash')
              .single();
            
            // Create default payment methods if none exist
            if (!cashMethod) {
              console.log('   📝 Creating default payment methods...');
              const defaultMethods = [
                { name: 'Cash', type: 'cash', description: 'Cash payment', is_active: true },
                { name: 'Bank Transfer', type: 'bank_transfer', description: 'Bank transfer payment', is_active: true },
                { name: 'Credit Card', type: 'credit_card', description: 'Credit card payment', is_active: true },
                { name: 'Digital Wallet', type: 'digital_wallet', description: 'Digital wallet (MoMo, ZaloPay, etc.)', is_active: true },
                { name: 'Cheque', type: 'cheque', description: 'Cheque payment', is_active: true }
              ];
              
              const { error: methodError } = await supabase
                .from('payment_methods')
                .insert(defaultMethods);
              
              if (methodError) {
                console.log(`   ⚠️  Could not create payment methods: ${methodError.message}`);
              } else {
                // Re-fetch Cash method
                const { data: newCashMethod } = await supabase
                  .from('payment_methods')
                  .select('id')
                  .eq('name', 'Cash')
                  .single();
                cashMethod = newCashMethod;
              }
            }
            
            if (cashMethod) {
              const { data: payment, error: payError } = await supabase
                .from('payments')
                .insert({
                  student_id: firstStudent.id,
                  invoice_id: invoice.id,
                  payment_method_id: cashMethod.id,
                  payment_date: new Date().toISOString().split('T')[0],
                  amount: paymentAmount,
                  status: 'received',
                  notes: 'Partial payment - Semester 1'
                })
                .select()
                .single();
              
              if (!payError && payment) {
                // Create payment allocation
                await supabase
                  .from('payment_allocations')
                  .insert({
                    payment_id: payment.id,
                    invoice_id: invoice.id,
                    amount: paymentAmount
                  });
                
                // Update invoice paid_amount
                await supabase
                  .from('invoices')
                  .update({
                    paid_amount: paymentAmount,
                    status: 'partial'
                  })
                  .eq('id', invoice.id);
                
                // Update student account balance
                await supabase
                  .from('student_accounts')
                  .update({
                    total_paid: paymentAmount,
                    balance: invoice.total_amount - paymentAmount
                  })
                  .eq('id', studentAccount.id);
                
                console.log(`✅ ${firstStudent.full_name} - Payment received (${paymentAmount.toLocaleString()} VND)`);
              } else if (payError) {
                console.log(`   ⚠️  Payment error: ${payError.message}`);
              }
            } else {
              console.log('   ⚠️  Skipping payment - no payment method available');
            }
          } else {
            console.log(`   ⏭️  ${firstStudent.full_name} - payment already exists`);
          }
        }
      }
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('\n✨ Financial data seeding complete!\n');
    console.log('📊 Summary:');
    console.log(`   • Student accounts: ${studentAccounts.length}`);
    console.log(`   • Fee assignments: ${assignmentsCreated}`);
    console.log(`   • Invoices created: ${invoicesCreated}`);
    console.log('   • Sample payment: 1');
    console.log('\n🎯 Next: Visit the finance dashboard to view and manage data\n');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
  }
}

seedFinancialData();
