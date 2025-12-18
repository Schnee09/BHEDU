#!/usr/bin/env node

/**
 * Comprehensive Database Seeder
 * Seeds ALL tables with realistic test data for the BH-EDU system
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// Vietnamese names for realistic data
const vietnameseFirstNames = ['An', 'Bình', 'Châu', 'Dương', 'Hà', 'Hương', 'Khang', 'Linh', 'Minh', 'Nam', 'Ngọc', 'Phương', 'Quang', 'Thanh', 'Thảo', 'Trung', 'Tú', 'Việt', 'Yến'];
const vietnameseLastNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương'];

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateVietnamesePhone() {
  const prefixes = ['090', '091', '093', '094', '096', '097', '098', '086', '083', '084', '085'];
  return randomFrom(prefixes) + randomBetween(1000000, 9999999).toString();
}

function generateDate(daysAgo, daysRange = 30) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo + randomBetween(0, daysRange));
  return date.toISOString().split('T')[0];
}

async function seedDatabase() {
  console.log('\n🌱 Comprehensive Database Seeder\n');
  console.log('='.repeat(70) + '\n');

  try {
    // ===== Step 1: Get existing core data =====
    console.log('📅 Step 1: Getting existing core data...');
    
    const { data: academicYears } = await supabase
      .from('academic_years')
      .select('*')
      .order('start_date', { ascending: false });
    
    const currentYear = academicYears?.find(y => y.is_current) || academicYears?.[0];
    console.log(`   ✅ Academic Year: ${currentYear?.name}`);

    const { data: profiles } = await supabase
      .from('profiles')
      .select('*');
    
    const students = profiles?.filter(p => p.role === 'student') || [];
    const teachers = profiles?.filter(p => p.role === 'teacher') || [];
    const admins = profiles?.filter(p => p.role === 'admin') || [];
    console.log(`   ✅ Profiles: ${students.length} students, ${teachers.length} teachers, ${admins.length} admins`);

    const { data: classes } = await supabase
      .from('classes')
      .select('*');
    console.log(`   ✅ Classes: ${classes?.length || 0}`);

    // ===== Step 2: Seed Subjects =====
    console.log('\n📚 Step 2: Seeding subjects...');
    
    const { data: existingSubjects } = await supabase
      .from('subjects')
      .select('id')
      .limit(1);
    
    let subjects = [];
    if (!existingSubjects?.length) {
      const subjectData = [
        { name: 'Mathematics', code: 'MATH', description: 'Algebra, Geometry, Calculus' },
        { name: 'Physics', code: 'PHYS', description: 'Mechanics, Thermodynamics, Electromagnetism' },
        { name: 'Chemistry', code: 'CHEM', description: 'Organic, Inorganic, Physical Chemistry' },
        { name: 'Biology', code: 'BIO', description: 'Botany, Zoology, Human Biology' },
        { name: 'English', code: 'ENG', description: 'Grammar, Literature, Writing' },
        { name: 'Vietnamese Literature', code: 'VNL', description: 'Vietnamese Language and Literature' },
        { name: 'History', code: 'HIST', description: 'World History, Vietnamese History' },
        { name: 'Geography', code: 'GEO', description: 'Physical and Human Geography' },
        { name: 'Computer Science', code: 'CS', description: 'Programming, Computer Systems' },
        { name: 'Physical Education', code: 'PE', description: 'Sports and Health' },
        { name: 'Art', code: 'ART', description: 'Visual Arts, Drawing, Painting' },
        { name: 'Music', code: 'MUS', description: 'Music Theory, Performance' }
      ];
      
      const { data: newSubjects, error } = await supabase
        .from('subjects')
        .insert(subjectData)
        .select();
      
      if (error) {
        console.log(`   ⚠️  Error: ${error.message}`);
      } else {
        subjects = newSubjects;
        console.log(`   ✅ Created ${subjects.length} subjects`);
      }
    } else {
      const { data } = await supabase.from('subjects').select('*');
      subjects = data || [];
      console.log(`   ⏭️  Subjects already exist (${subjects.length})`);
    }

    // ===== Step 3: Seed Courses =====
    console.log('\n📖 Step 3: Seeding courses...');
    
    const { data: existingCourses } = await supabase
      .from('courses')
      .select('id');
    
    let courses = [];
    if ((existingCourses?.length || 0) < 5 && subjects.length > 0 && teachers.length > 0) {
      const courseData = subjects.slice(0, 8).map((subject, idx) => ({
        name: `${subject.name} - ${currentYear?.name || '2024-2025'}`,
        description: `${subject.description} course for the current academic year`,
        subject_id: subject.id,
        teacher_id: teachers[idx % teachers.length]?.id,
        academic_year_id: currentYear?.id
      }));
      
      const { data: newCourses, error } = await supabase
        .from('courses')
        .insert(courseData)
        .select();
      
      if (error) {
        console.log(`   ⚠️  Error: ${error.message}`);
      } else {
        courses = newCourses;
        console.log(`   ✅ Created ${courses.length} courses`);
      }
    } else {
      const { data } = await supabase.from('courses').select('*');
      courses = data || [];
      console.log(`   ⏭️  Courses already exist (${courses.length})`);
    }

    // ===== Step 4: Seed Lessons =====
    console.log('\n📋 Step 4: Seeding lessons...');
    
    const { data: existingLessons } = await supabase
      .from('lessons')
      .select('id');
    
    if ((existingLessons?.length || 0) < 10 && courses.length > 0) {
      const lessonData = [];
      for (const course of courses.slice(0, 5)) {
        for (let i = 1; i <= 5; i++) {
          lessonData.push({
            course_id: course.id,
            title: `${course.name.split(' - ')[0]} - Lesson ${i}`,
            content: `Lesson content for week ${i}. Topics covered include theoretical concepts and practical exercises.`,
            lesson_order: i
          });
        }
      }
      
      const { data: newLessons, error } = await supabase
        .from('lessons')
        .insert(lessonData)
        .select();
      
      if (error) {
        console.log(`   ⚠️  Error: ${error.message}`);
      } else {
        console.log(`   ✅ Created ${newLessons?.length || 0} lessons`);
      }
    } else {
      console.log(`   ⏭️  Lessons already exist (${existingLessons?.length})`);
    }

    // ===== Step 5: Seed Guardians =====
    console.log('\n👨‍👩‍👧 Step 5: Seeding guardians...');
    
    const { data: existingGuardians } = await supabase
      .from('guardians')
      .select('id')
      .limit(1);
    
    if (!existingGuardians?.length && students.length > 0) {
      const guardianData = [];
      const relationships = ['father', 'mother', 'guardian', 'grandparent'];
      
      for (const student of students) {
        // Add 1-2 guardians per student
        const numGuardians = randomBetween(1, 2);
        for (let i = 0; i < numGuardians; i++) {
          const lastName = randomFrom(vietnameseLastNames);
          const firstName = randomFrom(vietnameseFirstNames);
          guardianData.push({
            student_id: student.id,
            name: `${lastName} ${firstName}`,
            relationship: relationships[i] || 'guardian',
            phone: generateVietnamesePhone(),
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/[đĐ]/g, 'd')}@gmail.com`,
            address: student.address || 'Ho Chi Minh City, Vietnam',
            is_primary_contact: i === 0,
            is_emergency_contact: true,
            occupation: randomFrom(['Business Owner', 'Teacher', 'Doctor', 'Engineer', 'Accountant', 'Civil Servant', 'Self-employed']),
            workplace: randomFrom(['Local Company', 'Government Office', 'Hospital', 'School', 'Private Business']),
            work_phone: generateVietnamesePhone()
          });
        }
      }
      
      const { data: newGuardians, error } = await supabase
        .from('guardians')
        .insert(guardianData)
        .select();
      
      if (error) {
        console.log(`   ⚠️  Error: ${error.message}`);
      } else {
        console.log(`   ✅ Created ${newGuardians?.length || 0} guardians for ${students.length} students`);
      }
    } else {
      console.log(`   ⏭️  Guardians already exist`);
    }

    // ===== Step 6: Seed Attendance Reports =====
    console.log('\n📊 Step 6: Seeding attendance reports...');
    
    const { data: existingReports } = await supabase
      .from('attendance_reports')
      .select('id')
      .limit(1);
    
    if (!existingReports?.length && classes?.length > 0) {
      const reportData = [];
      const reportTypes = ['daily', 'weekly', 'monthly', 'semester'];
      
      // Create reports for the last 4 weeks
      for (let week = 0; week < 4; week++) {
        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - (week + 1) * 7);
        const dateTo = new Date(dateFrom);
        dateTo.setDate(dateTo.getDate() + 6);
        
        for (const cls of classes.slice(0, 5)) {
          reportData.push({
            report_type: 'weekly',
            class_id: cls.id,
            date_from: dateFrom.toISOString().split('T')[0],
            date_to: dateTo.toISOString().split('T')[0],
            total_days: 5,
            present_count: randomBetween(80, 95),
            absent_count: randomBetween(2, 10),
            late_count: randomBetween(3, 8),
            excused_count: randomBetween(1, 5),
            attendance_rate: randomBetween(85, 98),
            report_data: JSON.stringify({ generated: 'auto', period: `Week ${week + 1}` }),
            generated_by: admins[0]?.id || teachers[0]?.id
          });
        }
      }
      
      const { data: newReports, error } = await supabase
        .from('attendance_reports')
        .insert(reportData)
        .select();
      
      if (error) {
        console.log(`   ⚠️  Error: ${error.message}`);
      } else {
        console.log(`   ✅ Created ${newReports?.length || 0} attendance reports`);
      }
    } else {
      console.log(`   ⏭️  Attendance reports already exist`);
    }

    // ===== Step 7: Seed Notifications =====
    console.log('\n🔔 Step 7: Seeding notifications...');
    
    const { data: existingNotifications } = await supabase
      .from('notifications')
      .select('id')
      .limit(1);
    
    if (!existingNotifications?.length && profiles?.length > 0) {
      const notificationData = [];
      const notificationTypes = ['info', 'warning', 'success'];
      const messages = [
        { title: 'Assignment Due', message: 'You have an assignment due tomorrow. Please submit before the deadline.' },
        { title: 'Grade Posted', message: 'Your grade for the recent assignment has been posted. Check your grades page.' },
        { title: 'Attendance Alert', message: 'You were marked absent yesterday. Please contact your teacher if this is incorrect.' },
        { title: 'Fee Reminder', message: 'Your tuition fee payment is due this week. Please make the payment.' },
        { title: 'Schedule Change', message: 'Your class schedule has been updated. Please check the new timetable.' },
        { title: 'Event Announcement', message: 'School event coming up next week. Check the calendar for details.' },
        { title: 'System Maintenance', message: 'The system will undergo maintenance this weekend. Some features may be unavailable.' },
        { title: 'Welcome Message', message: 'Welcome to BH-EDU! Explore the platform and reach out if you need help.' }
      ];
      
      // Add notifications for each user
      for (const profile of profiles.slice(0, 15)) {
        const numNotifs = randomBetween(2, 5);
        for (let i = 0; i < numNotifs; i++) {
          const msg = randomFrom(messages);
          notificationData.push({
            user_id: profile.id,
            title: msg.title,
            message: msg.message,
            type: randomFrom(notificationTypes),
            read: Math.random() > 0.5
          });
        }
      }
      
      const { data: newNotifications, error } = await supabase
        .from('notifications')
        .insert(notificationData)
        .select();
      
      if (error) {
        console.log(`   ⚠️  Error: ${error.message}`);
      } else {
        console.log(`   ✅ Created ${newNotifications?.length || 0} notifications`);
      }
    } else {
      console.log(`   ⏭️  Notifications already exist`);
    }

    // ===== Step 8: Seed School Settings =====
    console.log('\n⚙️  Step 8: Seeding school settings...');
    
    const { data: existingSettings } = await supabase
      .from('school_settings')
      .select('id')
      .limit(1);
    
    if (!existingSettings?.length) {
      const settingsData = [
        { key: 'school_name', value: 'Bui Hoang Education', description: 'Official name of the school' },
        { key: 'school_address', value: '123 Education Street, District 1, Ho Chi Minh City, Vietnam', description: 'School physical address' },
        { key: 'school_phone', value: '+84 28 1234 5678', description: 'Main contact phone number' },
        { key: 'school_email', value: 'contact@bhedu.example.com', description: 'Official school email' },
        { key: 'school_website', value: 'https://bhedu.example.com', description: 'School website URL' },
        { key: 'timezone', value: 'Asia/Ho_Chi_Minh', description: 'School timezone' },
        { key: 'academic_year_start_month', value: '9', description: 'Month when academic year starts (1-12)' },
        { key: 'grading_system', value: 'percentage', description: 'Grading system type (percentage, letter, gpa)' },
        { key: 'attendance_check_in_start', value: '07:00', description: 'Earliest check-in time' },
        { key: 'attendance_check_in_end', value: '08:00', description: 'Latest check-in time (after = late)' },
        { key: 'attendance_late_threshold', value: '15', description: 'Minutes after bell to be marked late' },
        { key: 'class_duration_minutes', value: '45', description: 'Standard class duration in minutes' },
        { key: 'max_students_per_class', value: '40', description: 'Maximum students allowed per class' },
        { key: 'currency', value: 'VND', description: 'Currency for financial transactions' },
        { key: 'date_format', value: 'DD/MM/YYYY', description: 'Date format for display' },
        { key: 'logo_url', value: '/images/logo.png', description: 'School logo URL' },
        { key: 'primary_color', value: '#1a73e8', description: 'Primary brand color' },
        { key: 'secondary_color', value: '#34a853', description: 'Secondary brand color' }
      ];
      
      const { data: newSettings, error } = await supabase
        .from('school_settings')
        .insert(settingsData)
        .select();
      
      if (error) {
        console.log(`   ⚠️  Error: ${error.message}`);
      } else {
        console.log(`   ✅ Created ${newSettings?.length || 0} school settings`);
      }
    } else {
      console.log(`   ⏭️  School settings already exist`);
    }

    // ===== Step 9: Seed QR Codes =====
    console.log('\n📱 Step 9: Seeding QR codes...');
    
    const { data: existingQRCodes } = await supabase
      .from('qr_codes')
      .select('id')
      .limit(1);
    
    if (!existingQRCodes?.length && classes?.length > 0) {
      const qrData = [];
      
      for (const cls of classes.slice(0, 10)) {
        // Create valid QR codes for each class
        const validUntil = new Date();
        validUntil.setHours(validUntil.getHours() + 24); // Valid for 24 hours
        
        qrData.push({
          class_id: cls.id,
          token: `QR-${cls.id.substring(0, 8)}-${Date.now()}-${randomBetween(1000, 9999)}`,
          valid_until: validUntil.toISOString()
        });
      }
      
      const { data: newQRCodes, error } = await supabase
        .from('qr_codes')
        .insert(qrData)
        .select();
      
      if (error) {
        console.log(`   ⚠️  Error: ${error.message}`);
      } else {
        console.log(`   ✅ Created ${newQRCodes?.length || 0} QR codes`);
      }
    } else {
      console.log(`   ⏭️  QR codes already exist`);
    }

    // ===== Step 10: Seed Payment Schedules =====
    console.log('\n📅 Step 10: Seeding payment schedules...');
    
    const { data: existingSchedules } = await supabase
      .from('payment_schedules')
      .select('id')
      .limit(1);
    
    if (!existingSchedules?.length && currentYear) {
      const scheduleData = [
        {
          name: 'Semester 1 Payment Plan',
          academic_year_id: currentYear.id,
          description: 'Payment schedule for Semester 1 tuition and fees - 3 installments',
          schedule_type: 'installment',
          is_active: true
        },
        {
          name: 'Semester 2 Payment Plan',
          academic_year_id: currentYear.id,
          description: 'Payment schedule for Semester 2 tuition and fees - 3 installments',
          schedule_type: 'installment',
          is_active: true
        },
        {
          name: 'Full Year Payment Plan',
          academic_year_id: currentYear.id,
          description: 'Discounted full year payment plan - 4 installments',
          schedule_type: 'installment',
          is_active: true
        },
        {
          name: 'Milestone-Based Plan',
          academic_year_id: currentYear.id,
          description: 'Payment based on academic milestones',
          schedule_type: 'milestone',
          is_active: true
        }
      ];
      
      const { data: newSchedules, error } = await supabase
        .from('payment_schedules')
        .insert(scheduleData)
        .select();
      
      if (error) {
        console.log(`   ⚠️  Error: ${error.message}`);
      } else {
        console.log(`   ✅ Created ${newSchedules?.length || 0} payment schedules`);
        
        // Create installments for each schedule
        if (newSchedules?.length > 0) {
          const installmentData = [];
          const installmentCounts = [3, 3, 4, 2]; // Number of installments per schedule
          
          newSchedules.forEach((schedule, idx) => {
            const count = installmentCounts[idx] || 3;
            const percentagePerInstallment = Math.floor(100 / count);
            const startDate = new Date('2024-09-01');
            
            for (let i = 0; i < count; i++) {
              const dueDate = new Date(startDate);
              dueDate.setMonth(dueDate.getMonth() + (i * 2)); // Every 2 months
              
              installmentData.push({
                schedule_id: schedule.id,
                installment_number: i + 1,
                due_date: dueDate.toISOString().split('T')[0],
                percentage: i === count - 1 ? (100 - percentagePerInstallment * (count - 1)) : percentagePerInstallment,
                description: `Installment ${i + 1} of ${count}`
              });
            }
          });
          
          const { data: newInstallments, error: instError } = await supabase
            .from('payment_schedule_installments')
            .insert(installmentData)
            .select();
          
          if (instError) {
            console.log(`   ⚠️  Installments Error: ${instError.message}`);
          } else {
            console.log(`   ✅ Created ${newInstallments?.length || 0} payment installments`);
          }
        }
      }
    } else {
      console.log(`   ⏭️  Payment schedules already exist`);
    }

    // ===== Step 11: Seed more financial data =====
    console.log('\n💰 Step 11: Extending financial data...');
    
    // Create more invoices for students without them
    const { data: studentAccounts } = await supabase
      .from('student_accounts')
      .select('*, profiles!inner(id, full_name, grade_level)');
    
    const { data: existingInvoices } = await supabase
      .from('invoices')
      .select('student_account_id');
    
    const existingAccountIds = new Set(existingInvoices?.map(i => i.student_account_id) || []);
    const accountsWithoutInvoices = studentAccounts?.filter(a => !existingAccountIds.has(a.id)) || [];
    
    if (accountsWithoutInvoices.length > 0) {
      const { data: feeTypes } = await supabase.from('fee_types').select('*');
      
      let invoiceCount = existingInvoices?.length || 0;
      for (const account of accountsWithoutInvoices) {
        invoiceCount++;
        const invoiceNumber = `INV-2024-${invoiceCount.toString().padStart(4, '0')}`;
        const totalAmount = randomBetween(5000000, 7000000);
        
        const { data: invoice, error } = await supabase
          .from('invoices')
          .insert({
            invoice_number: invoiceNumber,
            student_id: account.profiles.id,
            student_account_id: account.id,
            academic_year_id: currentYear?.id,
            issue_date: generateDate(30),
            due_date: generateDate(-15, 30),
            total_amount: totalAmount,
            paid_amount: 0,
            status: 'pending',
            notes: 'Auto-generated invoice'
          })
          .select()
          .single();
        
        if (!error && invoice && feeTypes?.length > 0) {
          // Add invoice items
          const items = feeTypes.slice(0, randomBetween(2, 4)).map(ft => ({
            invoice_id: invoice.id,
            fee_type_id: ft.id,
            description: ft.name,
            quantity: 1,
            unit_price: randomBetween(500000, 2000000),
            total_price: randomBetween(500000, 2000000)
          }));
          
          await supabase.from('invoice_items').insert(items);
        }
      }
      console.log(`   ✅ Created ${accountsWithoutInvoices.length} additional invoices`);
    } else {
      console.log(`   ⏭️  All student accounts have invoices`);
    }

    // ===== Step 12: Create more payments =====
    console.log('\n💳 Step 12: Creating additional payments...');
    
    const { data: pendingInvoices } = await supabase
      .from('invoices')
      .select('*, student_accounts!inner(id, student_id)')
      .eq('status', 'pending')
      .limit(5);
    
    const { data: paymentMethods } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('is_active', true);
    
    if (pendingInvoices?.length > 0 && paymentMethods?.length > 0) {
      let paymentsCreated = 0;
      
      for (const invoice of pendingInvoices.slice(0, 3)) {
        const paymentAmount = Math.floor(invoice.total_amount * (randomBetween(30, 60) / 100));
        const paymentMethod = randomFrom(paymentMethods);
        
        const { data: payment, error } = await supabase
          .from('payments')
          .insert({
            student_id: invoice.student_accounts.student_id,
            invoice_id: invoice.id,
            payment_method_id: paymentMethod.id,
            amount: paymentAmount,
            reference_number: `REF-${Date.now()}-${randomBetween(1000, 9999)}`,
            payment_date: generateDate(randomBetween(1, 14)),
            status: 'received',
            notes: `Payment via ${paymentMethod.name}`
          })
          .select()
          .single();
        
        if (!error && payment) {
          paymentsCreated++;
          
          // Create allocation
          await supabase.from('payment_allocations').insert({
            payment_id: payment.id,
            invoice_id: invoice.id,
            amount: paymentAmount
          });
          
          // Update invoice
          await supabase
            .from('invoices')
            .update({
              paid_amount: paymentAmount,
              status: paymentAmount >= invoice.total_amount ? 'paid' : 'partial'
            })
            .eq('id', invoice.id);
        }
      }
      console.log(`   ✅ Created ${paymentsCreated} additional payments`);
    } else {
      console.log(`   ⏭️  No pending invoices to process or no payment methods`);
    }

    // ===== Final Summary =====
    console.log('\n' + '='.repeat(70));
    console.log('\n✨ Database seeding complete!\n');
    console.log('Run `node scripts/check-database.js` to verify all data.\n');

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

seedDatabase();
