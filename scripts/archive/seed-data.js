/**
 * Database Seeding Script
 * Run this to populate your database with sample data for testing
 * 
 * Usage: node scripts/seed-data.js
 */

require('dotenv').config({ path: './web/.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Your existing data IDs from the database
const EXISTING_IDS = {
  students: [
    '265249a2-4d4d-4016-96be-0c8ec043c972', // Test Student
    '8f5e3a01-c7e8-46d8-b276-714cbe97aefa', // Alice Williams
    'dfad5967-7b3c-418b-8468-a691b2ed92c8', // Bob Davis
    '869fe268-a9ae-4680-8fd4-1ed1c84a6bc6', // Charlie Miller
    'baa2a8fa-c211-4603-88cf-0a094da0dfad', // Diana Garcia
    '6b65c73b-e8b6-47fa-bc61-64a4adfa2ef6', // Ethan Martinez
    '5f4f0b1f-e1b4-4d53-9daa-352c262fbb1d', // Fiona Rodriguez
    '1afc26f0-7b7c-4134-b20f-91fa81830916', // George Wilson
    'de102907-4380-4223-b346-c0376d08f044'  // Hannah Anderson
  ],
  teachers: [
    '3b52b8fb-4a37-4f03-b9ef-04ebc22e6c95', // John Smith
    '0c16d651-53f1-4f70-b2ce-83ed47afe4e8', // Emily Johnson
    'b7c4d0fa-3a0e-47d9-b76b-bd4b30adabb8'  // Michael Brown
  ],
  academicYear: 'eae41e94-af67-4111-95b8-60d802b56153' // 2024-2025
};

async function seedData() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // 1. Create Classes
    console.log('📚 Creating classes...');
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .insert([
        {
          name: 'Mathematics 101',
          teacher_id: EXISTING_IDS.teachers[0]
        },
        {
          name: 'English Literature',
          teacher_id: EXISTING_IDS.teachers[1]
        },
        {
          name: 'Science Laboratory',
          teacher_id: EXISTING_IDS.teachers[2]
        },
        {
          name: 'History & Social Studies',
          teacher_id: EXISTING_IDS.teachers[0]
        },
        {
          name: 'Physical Education',
          teacher_id: EXISTING_IDS.teachers[1]
        }
      ])
      .select();

    if (classesError) throw classesError;
    console.log(`✅ Created ${classes.length} classes`);

    // 2. Create Enrollments
    console.log('\n👥 Creating enrollments...');
    const enrollments = [];
    
    // Enroll all students in first 3 classes
    for (let i = 0; i < 3; i++) {
      for (const studentId of EXISTING_IDS.students) {
        enrollments.push({
          student_id: studentId,
          class_id: classes[i].id,
          enrollment_date: '2024-09-01',
          status: 'active'
        });
      }
    }

    // Enroll first 5 students in remaining classes
    for (let i = 3; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        enrollments.push({
          student_id: EXISTING_IDS.students[j],
          class_id: classes[i].id,
          enrollment_date: '2024-09-01',
          status: 'active'
        });
      }
    }

    const { data: enrollmentsData, error: enrollmentsError } = await supabase
      .from('enrollments')
      .insert(enrollments)
      .select();

    if (enrollmentsError) throw enrollmentsError;
    console.log(`✅ Created ${enrollmentsData.length} enrollments`);

    // 3. Create Assignment Categories
    console.log('\n📂 Creating assignment categories...');
    const categories = [];
    for (const classItem of classes) {
      categories.push(
        {
          name: 'Homework',
          weight: 30,
          class_id: classItem.id
        },
        {
          name: 'Quizzes',
          weight: 20,
          class_id: classItem.id
        },
        {
          name: 'Midterm Exam',
          weight: 25,
          class_id: classItem.id
        },
        {
          name: 'Final Exam',
          weight: 25,
          class_id: classItem.id
        }
      );
    }

    const { data: categoriesData, error: categoriesError } = await supabase
      .from('assignment_categories')
      .insert(categories)
      .select();

    if (categoriesError) throw categoriesError;
    console.log(`✅ Created ${categoriesData.length} assignment categories`);

    // 4. Create Assignments
    console.log('\n📝 Creating assignments...');
    const assignments = [];
    
    for (let i = 0; i < classes.length; i++) {
      const classItem = classes[i];
      const classCategories = categoriesData.filter(c => c.class_id === classItem.id);
      
      // Homework assignments
      const homeworkCat = classCategories.find(c => c.name === 'Homework');
      for (let j = 1; j <= 5; j++) {
        assignments.push({
          class_id: classItem.id,
          category_id: homeworkCat.id,
          title: `Homework Assignment ${j}`,
          description: `Complete exercises ${j * 10} to ${j * 10 + 9}`,
          due_date: `2024-${9 + Math.floor(j / 2)}-${(j * 7) % 28 + 1}`,
          max_points: 100
        });
      }

      // Quiz assignments
      const quizCat = classCategories.find(c => c.name === 'Quizzes');
      for (let j = 1; j <= 3; j++) {
        assignments.push({
          class_id: classItem.id,
          category_id: quizCat.id,
          title: `Quiz ${j}`,
          description: `Chapter ${j} quiz`,
          due_date: `2024-${9 + j}-15`,
          max_points: 50
        });
      }

      // Exams
      const midtermCat = classCategories.find(c => c.name === 'Midterm Exam');
      assignments.push({
        class_id: classItem.id,
        category_id: midtermCat.id,
        title: 'Midterm Examination',
        description: 'Comprehensive midterm covering chapters 1-5',
        due_date: '2024-11-15',
        max_points: 100
      });

      const finalCat = classCategories.find(c => c.name === 'Final Exam');
      assignments.push({
        class_id: classItem.id,
        category_id: finalCat.id,
        title: 'Final Examination',
        description: 'Comprehensive final covering all chapters',
        due_date: '2025-05-30',
        max_points: 100
      });
    }

    const { data: assignmentsData, error: assignmentsError } = await supabase
      .from('assignments')
      .insert(assignments)
      .select();

    if (assignmentsError) throw assignmentsError;
    console.log(`✅ Created ${assignmentsData.length} assignments`);

    // 5. Create Grades
    console.log('\n📊 Creating grades...');
    const grades = [];
    
    for (const assignment of assignmentsData) {
      // Get students enrolled in this class
      const classEnrollments = enrollmentsData.filter(e => e.class_id === assignment.class_id);
      
      // Get the teacher for this class
      const classInfo = classes.find(c => c.id === assignment.class_id);
      const teacherId = classInfo.teacher_id;
      
      for (const enrollment of classEnrollments) {
        // Random score between 60-100
        const score = Math.floor(Math.random() * 40) + 60;
        
        grades.push({
          assignment_id: assignment.id,
          student_id: enrollment.student_id,
          score: score,
          feedback: score >= 90 ? 'Excellent work!' : score >= 80 ? 'Good job!' : score >= 70 ? 'Satisfactory' : 'Needs improvement',
          graded_at: new Date().toISOString(),
          graded_by: teacherId // Use actual teacher ID
        });
      }
    }

    const { data: gradesData, error: gradesError } = await supabase
      .from('grades')
      .insert(grades)
      .select();

    if (gradesError) throw gradesError;
    console.log(`✅ Created ${gradesData.length} grades`);

    // 6. Create Attendance Records
    console.log('\n📅 Creating attendance records...');
    const attendance = [];
    const statuses = ['present', 'present', 'present', 'present', 'late', 'absent', 'excused'];
    
    // Create attendance for the past 30 days
    const today = new Date();
    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      const date = new Date(today);
      date.setDate(date.getDate() - dayOffset);
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      const dateStr = date.toISOString().split('T')[0];
      
      for (const enrollment of enrollmentsData) {
        // Random status (weighted towards present)
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        // Get the teacher for this class
        const classInfo = classes.find(c => c.id === enrollment.class_id);
        const teacherId = classInfo.teacher_id;
        
        attendance.push({
          student_id: enrollment.student_id,
          class_id: enrollment.class_id,
          date: dateStr,
          status: status,
          check_in_time: status === 'present' ? '08:00:00' : status === 'late' ? '08:15:00' : null,
          check_out_time: status === 'present' || status === 'late' ? '15:00:00' : null,
          notes: status === 'absent' ? 'Absent without notice' : status === 'excused' ? 'Medical appointment' : null,
          marked_by: teacherId // Use actual teacher ID
        });
      }
    }

    const { data: attendanceData, error: attendanceError } = await supabase
      .from('attendance')
      .insert(attendance)
      .select();

    if (attendanceError) throw attendanceError;
    console.log(`✅ Created ${attendanceData.length} attendance records`);

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('🎉 SEEDING COMPLETE!');
    console.log('='.repeat(50));
    console.log(`📚 Classes: ${classes.length}`);
    console.log(`👥 Enrollments: ${enrollmentsData.length}`);
    console.log(`📂 Categories: ${categoriesData.length}`);
    console.log(`📝 Assignments: ${assignmentsData.length}`);
    console.log(`📊 Grades: ${gradesData.length}`);
    console.log(`📅 Attendance: ${attendanceData.length}`);
    console.log('='.repeat(50));
    console.log('\n✨ Sample IDs for testing:');
    console.log(`Student ID: ${EXISTING_IDS.students[0]}`);
    console.log(`Class ID: ${classes[0].id}`);
    console.log(`Attendance ID: ${attendanceData[0].id}`);
    console.log(`Assignment ID: ${assignmentsData[0].id}`);
    console.log('\n🎯 Test your pages at:');
    console.log(`- /dashboard/students/${EXISTING_IDS.students[0]}`);
    console.log(`- /dashboard/admin/classes/${classes[0].id}`);
    console.log(`- /dashboard/admin/attendance/${attendanceData[0].id}`);
    console.log(`- /dashboard/admin/assignments/${assignmentsData[0].id}`);

  } catch (error) {
    console.error('\n❌ ERROR during seeding:', error);
    console.error(error.message);
    if (error.details) console.error('Details:', error.details);
    if (error.hint) console.error('Hint:', error.hint);
    process.exit(1);
  }
}

seedData();
