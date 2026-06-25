const fs = require('fs');
const path = require('path');

const schemaMetaPath = path.resolve(__dirname, '../live_schema_meta.json');
const outputPath = path.resolve(__dirname, '../../docs/database/live_schema_audit.md');

function run() {
  console.log('Reading schema meta...');
  if (!fs.existsSync(schemaMetaPath)) {
    console.error('Metadata not found at:', schemaMetaPath);
    process.exit(1);
  }

  const meta = JSON.parse(fs.readFileSync(schemaMetaPath, 'utf8'));
  const tables = Object.keys(meta).sort();

  let md = `# Live Database Schema Audit & Optimization Report\n\n`;
  md += `> **Generated on:** ${new Date().toISOString().split('T')[0]}  \n`;
  md += `> **Scope:** Full Live Supabase Database schema analysis (58 tables/views processed).  \n\n`;
  
  md += `## 📊 Overview\n\n`;
  md += `The Supabase database consists of **${tables.length}** tables and views. We have analyzed columns, relationships, and structural design.\n\n`;
  
  md += `### Table Classifications\n\n`;
  
  const classifications = {
    'Core Profiles & Auth': ['profiles', 'student_profiles', 'teacher_profiles', 'tutors', 'guardians', 'parent_student_links', 'user_permissions', 'permission_definitions', 'user_invitations', 'role_permissions', 'role_permission_overrides'],
    'Academics & Classes': ['academic_years', 'semesters', 'courses', 'classes', 'subjects', 'subjects_new', 'enrollments', 'attendance', 'grades', 'timetable_slots', 'weekly_notes', 'calendar_events', 'teacher_subjects', 'evaluation_types', 'student_conducts', 'student_notes', 'student_documents'],
    'Finance System': ['tuition_config', 'fee_types', 'fee_assignments', 'invoices', 'invoice_items', 'payments', 'payment_allocations', 'payment_schedules', 'payment_schedule_installments', 'student_accounts', 'payment_methods'],
    'System & Auditing': ['settings', 'school_settings', 'audit_logs', 'permission_audit_logs', 'notifications', 'qr_codes', 'import_logs', 'import_errors'],
    'Database Views': ['v_active_classes', 'v_active_profiles', 'v_active_students', 'v_teacher_subjects', 'all_teachers', 'class_statistics', 'student_performance_summary', 'attendance_reports', 'teacher_workload']
  };

  for (const [category, tableList] of Object.entries(classifications)) {
    md += `#### ${category}\n`;
    const found = tableList.filter(t => tables.includes(t));
    found.forEach(t => {
      const colCount = Object.keys(meta[t]?.columns || {}).length;
      md += `- \`${t}\` (${colCount} columns)\n`;
    });
    md += `\n`;
  }

  md += `## 🔍 Core Relationship & Query Optimization Analysis\n\n`;
  md += `### 1. Owner Dashboard & Class-Subject Relationships\n`;
  md += `- **Issue:** Previously, queries in \`DashboardRepository.ts\` joined \`subject:subjects\` directly from the \`classes\` table. However, the \`classes\` table schema shows it does not have a \`subject_id\` column. Instead, it has a \`course_id\` pointing to the \`courses\` table, which then points to the \`subjects\` table.\n`;
  md += `- **Fix Applied:** Changed class queries to select \`course:courses(name)\` instead of \`subject:subjects(name)\` and mapped the name from the course.\n\n`;

  md += `### 2. Student Dashboard & Assignment-Subject Relationships\n`;
  md += `- **Issue:** The assignments query in \`DashboardRepository.ts\` attempted to select \`subject:subjects(name, code)\` directly from \`assignments\`. Our live schema audit reveals that the \`assignments\` table only contains a \`class_id\` and \`category_id\`, with no direct \`subject_id\` relationship.\n`;
  md += `- **Fix Applied:** Changed the assignments select structure to go through the nested relationship: \`class:classes(course:courses(subject:subjects(name, code)))\` and updated mapping variables accordingly.\n\n`;

  md += `### 3. Recommended Performance Indexes\n`;
  md += `Based on foreign keys and search query patterns, the following indexes are highly recommended (and should be executed directly in the Supabase SQL Editor if not already present):\n\n`;
  md += `\`\`\`sql\n`;
  md += `-- Optimization for classes -> courses -> subjects joins\n`;
  md += `CREATE INDEX IF NOT EXISTS idx_classes_course_id ON public.classes(course_id);\n`;
  md += `CREATE INDEX IF NOT EXISTS idx_courses_subject_id ON public.courses(subject_id);\n\n`;
  md += `-- Optimization for student/teacher profile queries\n`;
  md += `CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);\n`;
  md += `CREATE INDEX IF NOT EXISTS idx_profiles_student_code ON public.profiles(student_code) WHERE student_code IS NOT NULL;\n`;
  md += `CREATE INDEX IF NOT EXISTS idx_profiles_teacher_code ON public.profiles(teacher_code) WHERE teacher_code IS NOT NULL;\n\n`;
  md += `-- Optimization for timetable, grades, and enrollments\n`;
  md += `CREATE INDEX IF NOT EXISTS idx_enrollments_student_class ON public.enrollments(student_id, class_id);\n`;
  md += `CREATE INDEX IF NOT EXISTS idx_grades_student_id ON public.grades(student_id);\n`;
  md += `CREATE INDEX IF NOT EXISTS idx_timetable_slots_class_id ON public.timetable_slots(class_id);\n`;
  md += `\`\`\`\n\n`;

  md += `## 📋 Detailed Table Schema Registry\n\n`;
  md += `Below is the schema specification of all tables in the database, compiled directly from the live OpenAPI reflection:\n\n`;

  for (const t of tables) {
    const info = meta[t];
    const columns = Object.entries(info.columns);
    md += `### 📁 Table: \`${t}\`\n`;
    if (info.description) md += `*Description:* ${info.description.replace(/\n/g, ' ')}\n\n`;
    md += `| Column | Type | Format | Key Type / Notes | Nullable |\n`;
    md += `|---|---|---|---|---|\n`;
    
    for (const [colName, colProp] of columns) {
      let notes = colProp.description ? colProp.description.replace(/\n/g, ' ') : '';
      let isNullable = colProp.isNullable ? 'Yes' : 'No';
      if (colName === 'id') {
        notes = 'Primary Key';
      }
      md += `| \`${colName}\` | \`${colProp.type}\` | \`${colProp.format}\` | ${notes} | ${isNullable} |\n`;
    }
    md += `\n---\n\n`;
  }

  fs.writeFileSync(outputPath, md);
  console.log('Báo cáo đã được lưu vào:', outputPath);
}

run();
