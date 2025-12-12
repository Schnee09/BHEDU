#!/usr/bin/env node

/**
 * Complete Database Seed Script
 * Seeds ALL tables with test data for the 4-role system
 * 
 * Run: node scripts/seed-complete.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../web/.env.local') });

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Helpers
const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const uuid = () => crypto.randomUUID();

// Vietnamese names
const firstNames = ['An', 'Bình', 'Châu', 'Dương', 'Hà', 'Hương', 'Khang', 'Linh', 'Minh', 'Nam', 'Ngọc', 'Phương', 'Quang', 'Thanh', 'Thảo', 'Trung', 'Tú', 'Việt', 'Yến', 'Anh', 'Bảo', 'Chi', 'Đức', 'Gia', 'Hải', 'Hoàng', 'Khánh', 'Lan', 'Long', 'Mai'];
const lastNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương'];

function genName() {
  return `${random(lastNames)} ${random(firstNames)}`;
}

function genPhone() {
  const prefixes = ['090', '091', '093', '094', '096', '097', '098'];
  return random(prefixes) + randomInt(1000000, 9999999);
}

function genDate(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

async function seed() {
  console.log('\n🌱 COMPLETE DATABASE SEEDER\n');
  console.log('='.repeat(60) + '\n');

  const stats = {};

  try {
    // ========== 1. ACADEMIC YEARS ==========
    console.log('📅 1. Academic Years...');
    const academicYears = [
      { name: '2024-2025', start_date: '2024-09-01', end_date: '2025-06-30', is_current: true },
      { name: '2023-2024', start_date: '2023-09-01', end_date: '2024-06-30', is_current: false },
    ];
    
    for (const year of academicYears) {
      await supabase.from('academic_years').upsert(year, { onConflict: 'name' });
    }
    const { data: years } = await supabase.from('academic_years').select('*');
    const currentYear = years.find(y => y.is_current);
    stats.academic_years = years.length;
    console.log(`   ✅ ${years.length} academic years`);

    // ========== 2. GRADING SCALES ==========
    console.log('📊 2. Grading Scales...');
    const gradingScales = [
      {
        name: 'Vietnamese 10-Point Scale',
        description: 'Standard Vietnamese grading (0-10)',
        scale: JSON.stringify([
          { min: 9, max: 10, grade: 'A+', gpa: 4.0 },
          { min: 8, max: 8.9, grade: 'A', gpa: 3.7 },
          { min: 7, max: 7.9, grade: 'B', gpa: 3.0 },
          { min: 6, max: 6.9, grade: 'C', gpa: 2.0 },
          { min: 5, max: 5.9, grade: 'D', gpa: 1.0 },
          { min: 0, max: 4.9, grade: 'F', gpa: 0.0 }
        ]),
        is_default: true
      }
    ];
    
    for (const scale of gradingScales) {
      const { data: existing } = await supabase.from('grading_scales').select('id').eq('name', scale.name).maybeSingle();
      if (!existing) {
        await supabase.from('grading_scales').insert(scale);
      }
    }
    const { data: scales } = await supabase.from('grading_scales').select('*');
    stats.grading_scales = scales?.length || 0;
    console.log(`   ✅ ${stats.grading_scales} grading scales`);

    // ========== 3. SUBJECTS ==========
    console.log('📚 3. Subjects...');
    const subjects = [
      { name: 'Mathematics', code: 'MATH', description: 'Algebra, Geometry, Calculus' },
      { name: 'Physics', code: 'PHYS', description: 'Mechanics, Thermodynamics' },
      { name: 'Chemistry', code: 'CHEM', description: 'Organic and Inorganic Chemistry' },
      { name: 'Biology', code: 'BIO', description: 'Life Sciences' },
      { name: 'English', code: 'ENG', description: 'English Language and Literature' },
      { name: 'Vietnamese', code: 'VIE', description: 'Vietnamese Language and Literature' },
      { name: 'History', code: 'HIST', description: 'Vietnamese and World History' },
      { name: 'Geography', code: 'GEO', description: 'Physical and Human Geography' },
      { name: 'Computer Science', code: 'CS', description: 'Programming and IT' },
      { name: 'Physical Education', code: 'PE', description: 'Sports and Health' },
    ];
    
    for (const subj of subjects) {
      const { data: existing } = await supabase.from('subjects').select('id').eq('code', subj.code).maybeSingle();
      if (!existing) {
        await supabase.from('subjects').insert(subj);
      }
    }
    const { data: subjectList } = await supabase.from('subjects').select('*');
    stats.subjects = subjectList?.length || 0;
    console.log(`   ✅ ${stats.subjects} subjects`);

    // ========== 4. FEE TYPES ==========
    console.log('💰 4. Fee Types...');
    const feeTypes = [
      { name: 'Tuition Fee', description: 'Monthly tuition', amount: 2000000, is_active: true, academic_year_id: currentYear?.id },
      { name: 'Registration Fee', description: 'One-time registration', amount: 500000, is_active: true, academic_year_id: currentYear?.id },
      { name: 'Book Fee', description: 'Textbooks and materials', amount: 800000, is_active: true, academic_year_id: currentYear?.id },
      { name: 'Uniform Fee', description: 'School uniform', amount: 600000, is_active: true, academic_year_id: currentYear?.id },
      { name: 'Lunch Fee', description: 'Monthly lunch program', amount: 1000000, is_active: true, academic_year_id: currentYear?.id },
    ];
    
    for (const fee of feeTypes) {
      const { data: existing } = await supabase.from('fee_types').select('id').eq('name', fee.name).maybeSingle();
      if (!existing) {
        await supabase.from('fee_types').insert(fee);
      }
    }
    const { data: feeList } = await supabase.from('fee_types').select('*');
    stats.fee_types = feeList?.length || 0;
    console.log(`   ✅ ${stats.fee_types} fee types`);

    // ========== 5. PAYMENT METHODS ==========
    console.log('💳 5. Payment Methods...');
    const paymentMethods = [
      { name: 'Cash', type: 'cash', description: 'Cash payment at office', is_active: true },
      { name: 'Bank Transfer', type: 'bank', description: 'Bank transfer to school account', is_active: true },
      { name: 'Momo', type: 'ewallet', description: 'Momo e-wallet', is_active: true },
      { name: 'ZaloPay', type: 'ewallet', description: 'ZaloPay e-wallet', is_active: true },
      { name: 'Credit Card', type: 'card', description: 'Visa/Mastercard', is_active: true },
    ];
    
    for (const pm of paymentMethods) {
      const { data: existing } = await supabase.from('payment_methods').select('id').eq('name', pm.name).maybeSingle();
      if (!existing) {
        await supabase.from('payment_methods').insert(pm);
      }
    }
    const { data: pmList } = await supabase.from('payment_methods').select('*');
    stats.payment_methods = pmList?.length || 0;
    console.log(`   ✅ ${stats.payment_methods} payment methods`);

    // ========== 6. GET TEST USERS ==========
    console.log('👥 6. Getting test users...');
    const { data: profiles } = await supabase.from('profiles').select('*');
    const teachers = profiles?.filter(p => p.role === 'teacher') || [];
    const students = profiles?.filter(p => p.role === 'student') || [];
    const staff = profiles?.filter(p => p.role === 'staff') || [];
    const admins = profiles?.filter(p => p.role === 'admin') || [];
    
    console.log(`   ✅ ${admins.length} admins, ${staff.length} staff, ${teachers.length} teachers, ${students.length} students`);

    // ========== 7. CREATE ADDITIONAL STUDENTS ==========
    console.log('👨‍🎓 7. Creating additional students...');
    const targetStudents = 30;
    let newStudentIds = [];
    
    if (students.length < targetStudents) {
      const needed = targetStudents - students.length;
      
      for (let i = 0; i < needed; i++) {
        const name = genName();
        const email = `student${students.length + i + 1}@test.com`;
        
        // Create auth user
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email,
          password: 'test123',
          email_confirm: true,
          user_metadata: { full_name: name }
        });
        
        if (!authError && authUser?.user) {
          // Create profile
          const { data: profile } = await supabase.from('profiles').insert({
            user_id: authUser.user.id,
            email,
            full_name: name,
            role: 'student',
            phone: genPhone(),
            date_of_birth: `${2005 + randomInt(0, 5)}-${String(randomInt(1, 12)).padStart(2, '0')}-${String(randomInt(1, 28)).padStart(2, '0')}`
          }).select().single();
          
          if (profile) newStudentIds.push(profile.id);
        }
      }
      console.log(`   ✅ Created ${newStudentIds.length} new students`);
    } else {
      console.log(`   ⏭️ Already have ${students.length} students`);
    }
    
    // Refresh students list
    const { data: allStudents } = await supabase.from('profiles').select('*').eq('role', 'student');
    stats.students = allStudents?.length || 0;

    // ========== 8. CREATE ADDITIONAL TEACHERS ==========
    console.log('👨‍🏫 8. Creating additional teachers...');
    const targetTeachers = 5;
    let newTeacherIds = [];
    
    if (teachers.length < targetTeachers) {
      const needed = targetTeachers - teachers.length;
      
      for (let i = 0; i < needed; i++) {
        const name = genName();
        const email = `teacher${teachers.length + i + 1}@test.com`;
        
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email,
          password: 'test123',
          email_confirm: true,
          user_metadata: { full_name: name }
        });
        
        if (!authError && authUser?.user) {
          const { data: profile } = await supabase.from('profiles').insert({
            user_id: authUser.user.id,
            email,
            full_name: name,
            role: 'teacher',
            phone: genPhone()
          }).select().single();
          
          if (profile) newTeacherIds.push(profile.id);
        }
      }
      console.log(`   ✅ Created ${newTeacherIds.length} new teachers`);
    } else {
      console.log(`   ⏭️ Already have ${teachers.length} teachers`);
    }
    
    // Refresh teachers list
    const { data: allTeachers } = await supabase.from('profiles').select('*').eq('role', 'teacher');
    stats.teachers = allTeachers?.length || 0;

    // ========== 9. CLASSES ==========
    console.log('🏫 9. Classes...');
    const classNames = ['10A', '10B', '11A', '11B', '12A', '12B', '10C', '11C', '12C'];
    
    for (const className of classNames) {
      const { data: existing } = await supabase.from('classes').select('id').eq('name', className).maybeSingle();
      if (!existing && allTeachers?.length > 0) {
        await supabase.from('classes').insert({
          name: className,
          teacher_id: random(allTeachers).id,
          academic_year_id: currentYear?.id
        });
      }
    }
    const { data: classes } = await supabase.from('classes').select('*');
    stats.classes = classes?.length || 0;
    console.log(`   ✅ ${stats.classes} classes`);

    // ========== 10. ENROLLMENTS ==========
    console.log('📝 10. Enrollments...');
    let enrollmentCount = 0;
    
    if (classes?.length > 0 && allStudents?.length > 0) {
      // Assign each student to 1-2 classes
      for (const student of allStudents) {
        const numClasses = randomInt(1, 2);
        const shuffledClasses = [...classes].sort(() => Math.random() - 0.5);
        
        for (let i = 0; i < Math.min(numClasses, shuffledClasses.length); i++) {
          const classItem = shuffledClasses[i];
          const { data: existing } = await supabase.from('enrollments')
            .select('id')
            .eq('student_id', student.id)
            .eq('class_id', classItem.id)
            .maybeSingle();
          
          if (!existing) {
            await supabase.from('enrollments').insert({
              student_id: student.id,
              class_id: classItem.id,
              enrollment_date: genDate(randomInt(30, 90)),
              status: 'active'
            });
            enrollmentCount++;
          }
        }
      }
    }
    const { data: enrollments } = await supabase.from('enrollments').select('*');
    stats.enrollments = enrollments?.length || 0;
    console.log(`   ✅ ${stats.enrollments} enrollments (${enrollmentCount} new)`);

    // ========== 11. COURSES ==========
    console.log('📖 11. Courses...');
    let courseCount = 0;
    
    if (subjectList?.length > 0 && allTeachers?.length > 0 && currentYear) {
      for (const subj of subjectList) {
        const { data: existing } = await supabase.from('courses')
          .select('id')
          .eq('subject_id', subj.id)
          .eq('academic_year_id', currentYear.id)
          .maybeSingle();
        
        if (!existing) {
          await supabase.from('courses').insert({
            name: `${subj.name} ${currentYear.name}`,
            description: subj.description,
            subject_id: subj.id,
            teacher_id: random(allTeachers).id,
            academic_year_id: currentYear.id
          });
          courseCount++;
        }
      }
    }
    const { data: courses } = await supabase.from('courses').select('*');
    stats.courses = courses?.length || 0;
    console.log(`   ✅ ${stats.courses} courses (${courseCount} new)`);

    // ========== 12. ASSIGNMENT CATEGORIES ==========
    console.log('📂 12. Assignment Categories...');
    const categoryTypes = [
      { name: 'Homework', weight: 20 },
      { name: 'Quiz', weight: 20 },
      { name: 'Midterm', weight: 25 },
      { name: 'Final Exam', weight: 35 }
    ];
    
    let catCount = 0;
    if (classes?.length > 0) {
      for (const classItem of classes) {
        for (const cat of categoryTypes) {
          const { data: existing } = await supabase.from('assignment_categories')
            .select('id')
            .eq('class_id', classItem.id)
            .eq('name', cat.name)
            .maybeSingle();
          
          if (!existing) {
            await supabase.from('assignment_categories').insert({
              name: cat.name,
              weight: cat.weight,
              class_id: classItem.id
            });
            catCount++;
          }
        }
      }
    }
    const { data: categories } = await supabase.from('assignment_categories').select('*');
    stats.assignment_categories = categories?.length || 0;
    console.log(`   ✅ ${stats.assignment_categories} categories (${catCount} new)`);

    // ========== 13. ASSIGNMENTS ==========
    console.log('📋 13. Assignments...');
    let assignCount = 0;
    
    if (categories?.length > 0 && classes?.length > 0) {
      const assignmentTitles = ['Assignment 1', 'Assignment 2', 'Quiz 1', 'Quiz 2', 'Midterm Exam', 'Project', 'Final Exam'];
      
      for (const classItem of classes) {
        const classCategories = categories.filter(c => c.class_id === classItem.id);
        
        for (const cat of classCategories) {
          const numAssignments = cat.name === 'Homework' ? 3 : (cat.name === 'Quiz' ? 2 : 1);
          
          for (let i = 0; i < numAssignments; i++) {
            const title = `${cat.name} ${i + 1}`;
            const { data: existing } = await supabase.from('assignments')
              .select('id')
              .eq('class_id', classItem.id)
              .eq('title', title)
              .maybeSingle();
            
            if (!existing) {
              await supabase.from('assignments').insert({
                class_id: classItem.id,
                category_id: cat.id,
                title,
                description: `${title} for ${classItem.name}`,
                due_date: genDate(-randomInt(1, 60)),
                max_points: cat.name === 'Final Exam' ? 100 : (cat.name === 'Midterm' ? 50 : 10)
              });
              assignCount++;
            }
          }
        }
      }
    }
    const { data: assignments } = await supabase.from('assignments').select('*');
    stats.assignments = assignments?.length || 0;
    console.log(`   ✅ ${stats.assignments} assignments (${assignCount} new)`);

    // ========== 14. ATTENDANCE ==========
    console.log('📅 14. Attendance Records...');
    let attendCount = 0;
    const attendanceStatuses = ['present', 'present', 'present', 'present', 'absent', 'late', 'excused'];
    
    // Check existing attendance count
    const { count: existingAttendance } = await supabase.from('attendance').select('*', { count: 'exact', head: true });
    
    if (existingAttendance < 100 && enrollments?.length > 0) {
      // Batch insert attendance - last 10 days only
      const attendanceBatch = [];
      
      for (let dayOffset = 0; dayOffset < 10; dayOffset++) {
        const date = new Date();
        date.setDate(date.getDate() - dayOffset);
        if (date.getDay() === 0 || date.getDay() === 6) continue;
        
        const dateStr = date.toISOString().split('T')[0];
        
        // Sample 30% of enrollments
        const sampledEnrollments = enrollments.filter(() => Math.random() > 0.7).slice(0, 20);
        
        for (const enrollment of sampledEnrollments) {
          const status = random(attendanceStatuses);
          attendanceBatch.push({
            student_id: enrollment.student_id,
            class_id: enrollment.class_id,
            date: dateStr,
            status,
            check_in_time: status !== 'absent' ? `${String(randomInt(7, 8)).padStart(2, '0')}:${String(randomInt(0, 59)).padStart(2, '0')}:00` : null,
            notes: status === 'excused' ? 'Medical leave' : null
          });
        }
      }
      
      if (attendanceBatch.length > 0) {
        const { error } = await supabase.from('attendance').upsert(attendanceBatch, { 
          onConflict: 'student_id,class_id,date',
          ignoreDuplicates: true 
        });
        if (!error) attendCount = attendanceBatch.length;
      }
    }
    const { data: attendance } = await supabase.from('attendance').select('id', { count: 'exact', head: true });
    const { count: attTotal } = await supabase.from('attendance').select('*', { count: 'exact', head: true });
    stats.attendance = attTotal || 0;
    console.log(`   ✅ ${stats.attendance} attendance records (${attendCount} new)`);

    // ========== 15. GRADES ==========
    console.log('📊 15. Grades...');
    let gradeCount = 0;
    
    // Check existing grades
    const { count: existingGrades } = await supabase.from('grades').select('*', { count: 'exact', head: true });
    
    if (existingGrades < 200 && assignments?.length > 0 && enrollments?.length > 0) {
      const gradesBatch = [];
      
      // Sample 30 assignments
      const sampledAssignments = assignments.sort(() => Math.random() - 0.5).slice(0, 30);
      
      for (const assignment of sampledAssignments) {
        const classEnrollments = enrollments.filter(e => e.class_id === assignment.class_id).slice(0, 10);
        
        for (const enrollment of classEnrollments) {
          const score = randomInt(Math.floor(assignment.max_points * 0.4), assignment.max_points);
          gradesBatch.push({
            assignment_id: assignment.id,
            student_id: enrollment.student_id,
            score,
            graded_at: genDate(randomInt(1, 30)),
            graded_by: allTeachers?.length > 0 ? random(allTeachers).id : null
          });
        }
      }
      
      if (gradesBatch.length > 0) {
        const { error } = await supabase.from('grades').upsert(gradesBatch, {
          onConflict: 'assignment_id,student_id',
          ignoreDuplicates: true
        });
        if (!error) gradeCount = gradesBatch.length;
      }
    }
    const { count: gradeTotal } = await supabase.from('grades').select('*', { count: 'exact', head: true });
    stats.grades = gradeTotal || 0;
    console.log(`   ✅ ${stats.grades} grades (${gradeCount} new)`);

    // ========== 16. STUDENT ACCOUNTS (FINANCE) ==========
    console.log('💳 16. Student Accounts...');
    let accountCount = 0;
    
    // Check existing accounts count
    const { count: existingAccountCount } = await supabase.from('student_accounts').select('*', { count: 'exact', head: true });
    
    if (existingAccountCount < 10 && allStudents?.length > 0) {
      // Get existing accounts to avoid duplicates
      const { data: existingAccounts } = await supabase.from('student_accounts').select('student_id');
      const existingIds = new Set(existingAccounts?.map(a => a.student_id) || []);
      
      const accountsBatch = [];
      for (const student of allStudents) {
        if (!existingIds.has(student.id)) {
          accountsBatch.push({
            student_id: student.id,
            balance: 0,
            status: 'active'
          });
        }
      }
      
      if (accountsBatch.length > 0) {
        const { error } = await supabase.from('student_accounts').insert(accountsBatch);
        if (!error) accountCount = accountsBatch.length;
      }
    }
    const { data: accounts } = await supabase.from('student_accounts').select('*');
    stats.student_accounts = accounts?.length || 0;
    console.log(`   ✅ ${stats.student_accounts} student accounts (${accountCount} new)`);

    // ========== 17. INVOICES ==========
    console.log('📄 17. Invoices...');
    let invoiceCount = 0;
    
    // Check existing invoices
    const { count: existingInvoiceCount } = await supabase.from('invoices').select('*', { count: 'exact', head: true });
    
    if (existingInvoiceCount < 20 && accounts?.length > 0 && feeList?.length > 0) {
      // Sample only 10 accounts to create invoices for
      const sampledAccounts = accounts.sort(() => Math.random() - 0.5).slice(0, 10);
      
      for (const account of sampledAccounts) {
        const selectedFees = feeList.slice(0, randomInt(2, 4));
        const totalAmount = selectedFees.reduce((sum, f) => sum + f.amount, 0);
        const isPaid = Math.random() > 0.6;
        
        const { data: invoice, error } = await supabase.from('invoices').insert({
          student_account_id: account.id,
          invoice_number: `INV-${Date.now()}-${randomInt(1000, 9999)}`,
          issue_date: genDate(randomInt(30, 90)),
          due_date: genDate(randomInt(-30, 30)),
          total_amount: totalAmount,
          paid_amount: isPaid ? totalAmount : (Math.random() > 0.5 ? Math.floor(totalAmount * 0.5) : 0),
          status: isPaid ? 'paid' : (Math.random() > 0.5 ? 'partial' : 'pending'),
          notes: 'Auto-generated invoice'
        }).select().single();
        
        if (!error && invoice) {
          invoiceCount++;
          
          // Batch insert invoice items
          const invoiceItems = selectedFees.map(fee => ({
            invoice_id: invoice.id,
            fee_type_id: fee.id,
            description: fee.name,
            quantity: 1,
            unit_price: fee.amount,
            total_price: fee.amount
          }));
          await supabase.from('invoice_items').insert(invoiceItems);
        }
      }
    }
    const { data: invoices } = await supabase.from('invoices').select('*');
    stats.invoices = invoices?.length || 0;
    console.log(`   ✅ ${stats.invoices} invoices (${invoiceCount} new)`);

    // ========== 18. PAYMENTS ==========
    console.log('💵 18. Payments...');
    let paymentCount = 0;
    
    if (invoices?.length > 0 && pmList?.length > 0 && accounts?.length > 0) {
      const paidInvoices = invoices.filter(i => (i.status === 'paid' || i.status === 'partial') && i.paid_amount > 0);
      
      // Check existing payments
      const { data: existingPayments } = await supabase.from('payments').select('invoice_id');
      const paidInvoiceIds = new Set(existingPayments?.map(p => p.invoice_id) || []);
      
      const newPaidInvoices = paidInvoices.filter(i => !paidInvoiceIds.has(i.id)).slice(0, 10);
      
      for (const invoice of newPaidInvoices) {
        const account = accounts.find(a => a.id === invoice.student_account_id);
        if (!account) continue;
        
        const { data: payment, error } = await supabase.from('payments').insert({
          student_id: account.student_id,
          invoice_id: invoice.id,
          payment_method_id: random(pmList).id,
          amount: invoice.paid_amount,
          reference_number: `PAY-${Date.now()}-${randomInt(1000, 9999)}`,
          payment_date: genDate(randomInt(1, 60)),
          status: 'received',
          notes: 'Auto-generated payment'
        }).select().single();
        
        if (!error && payment) {
          paymentCount++;
          await supabase.from('payment_allocations').insert({
            payment_id: payment.id,
            invoice_id: invoice.id,
            amount: invoice.paid_amount
          });
        }
      }
    }
    const { count: paymentTotal } = await supabase.from('payments').select('*', { count: 'exact', head: true });
    stats.payments = paymentTotal || 0;
    console.log(`   ✅ ${stats.payments} payments (${paymentCount} new)`);

    // ========== SUMMARY ==========
    console.log('\n' + '='.repeat(60));
    console.log('\n✨ DATABASE SEEDING COMPLETE!\n');
    console.log('📊 Final Stats:');
    console.log('-'.repeat(40));
    Object.entries(stats).forEach(([table, count]) => {
      console.log(`   ${table.padEnd(25)} ${count}`);
    });
    console.log('-'.repeat(40));
    console.log(`\n   TOTAL RECORDS: ${Object.values(stats).reduce((a, b) => a + b, 0)}`);
    console.log('\n🔐 Test Accounts (password: test123):');
    console.log('   admin@test.com, staff@test.com, teacher@test.com, student@test.com');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

seed();
