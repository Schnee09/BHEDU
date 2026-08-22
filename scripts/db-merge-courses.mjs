// db-migrate-sql.mjs
// Chạy raw SQL qua Supabase Management API (không cần exec_sql RPC)
// Usage: node scripts/db-migrate-sql.mjs <supabase_access_token>
// Lấy access token từ: https://supabase.com/dashboard/account/tokens

import { createClient } from '@supabase/supabase-js';

const PROJECT_REF = 'mwncwhkdimnjovxzhtjm';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13bmN3aGtkaW1uam92eHpodGptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQzODUzMCwiZXhwIjoyMDc2MDE0NTMwfQ.XRfRqGTIvIyGeg6iw8dWDBEh552tBrSI0RetYQkqsjU';
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;

const ACCESS_TOKEN = process.argv[2]; // pass as CLI arg

const sb = createClient(SUPABASE_URL, SERVICE_KEY);

const ok  = (m) => console.log(`✅ ${m}`);
const inf = (m) => console.log(`ℹ️  ${m}`);
const er  = (m) => console.log(`❌ ${m}`);

async function runSQL(sql) {
    if (!ACCESS_TOKEN) {
        throw new Error('Access token required. Run: node scripts/db-migrate-sql.mjs <your_access_token>');
    }
    const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sql }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(data));
    return data;
}

async function main() {
    console.log('\n🔄 BH-EDU: Execute Schema Migration\n');

    if (!ACCESS_TOKEN) {
        console.log('═══════════════════════════════════════════════════');
        console.log('ACCESS TOKEN REQUIRED');
        console.log('');
        console.log('1. Đi tới: https://supabase.com/dashboard/account/tokens');
        console.log('2. Tạo Access Token mới');
        console.log('3. Chạy: node scripts/db-migrate-sql.mjs <your_access_token>');
        console.log('');
        console.log('HOẶC chạy SQL sau trực tiếp trên Supabase SQL Editor:');
        console.log('https://supabase.com/dashboard/project/mwncwhkdimnjovxzhtjm/sql/new');
        console.log('');
        console.log('─── SQL CẦN CHẠY ───────────────────────────────────');
        printMigrationSQL();
        console.log('────────────────────────────────────────────────────');
        return;
    }

    // STEP 1: Add subject_id column
    console.log('Step 1: Thêm cột subject_id...');
    try {
        await runSQL('ALTER TABLE classes ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL;');
        await runSQL('CREATE INDEX IF NOT EXISTS idx_classes_subject_id ON classes(subject_id);');
        ok('Đã thêm cột subject_id + index');
    } catch (e) { er(`Step 1 failed: ${e.message}`); return; }

    // STEP 2: Migrate data via JS client
    console.log('\nStep 2: Migrate dữ liệu...');
    const { data: courses } = await sb.from('courses').select('id, code, name');
    const { data: subjects } = await sb.from('subjects').select('id, code, name');
    const { data: classesWithCourse } = await sb.from('classes').select('id, name, course_id').not('course_id', 'is', null);

    let migrated = 0;
    for (const cls of (classesWithCourse || [])) {
        const course = courses?.find(c => c.id === cls.course_id);
        if (!course) continue;
        const subject = (subjects || []).find(s =>
            s.name.toLowerCase().trim() === course.name.toLowerCase().trim() ||
            s.code === course.code.replace('C-', '')
        );
        if (!subject) { er(`No match for course ${course.code}`); continue; }

        const { error } = await sb.from('classes').update({ subject_id: subject.id }).eq('id', cls.id);
        if (error) { er(`Update "${cls.name}": ${error.message}`); }
        else { ok(`"${cls.name}" → [${subject.code}] ${subject.name}`); migrated++; }
    }
    ok(`Migrated ${migrated} classes`);

    // STEP 3: Drop course_id + courses table
    console.log('\nStep 3: Xóa cột course_id và bảng courses...');
    try {
        await runSQL('ALTER TABLE classes DROP CONSTRAINT IF EXISTS classes_course_id_fkey;');
        await runSQL('ALTER TABLE classes DROP COLUMN IF EXISTS course_id;');
        ok('Đã xóa cột course_id');
        await runSQL('DROP TABLE IF EXISTS courses CASCADE;');
        ok('Đã xóa bảng courses');
    } catch (e) { er(`Step 3 failed: ${e.message}`); return; }

    // STEP 4: Verify
    const result = await runSQL('SELECT COUNT(*) as total, COUNT(subject_id) as with_subject FROM classes;');
    ok(`Kết quả: ${JSON.stringify(result)}`);
    console.log('\n✅ MIGRATION HOÀN TẤT!\n');
}

function printMigrationSQL() {
    console.log(`
-- Step 1: Add subject_id column
ALTER TABLE classes
  ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_classes_subject_id ON classes(subject_id);

-- Step 2: Migrate data (map course → subject by code)
UPDATE classes c
SET subject_id = s.id
FROM courses cr
JOIN subjects s ON (
  s.code = REPLACE(cr.code, 'C-', '')
  OR LOWER(s.name) = LOWER(cr.name)
)
WHERE c.course_id = cr.id;

-- Step 3: Drop old FK and column
ALTER TABLE classes DROP CONSTRAINT IF EXISTS classes_course_id_fkey;
ALTER TABLE classes DROP COLUMN IF EXISTS course_id;

-- Step 4: Drop courses table
DROP TABLE IF EXISTS courses CASCADE;

-- Step 5: Verify
SELECT id, name, subject_id FROM classes ORDER BY name LIMIT 20;
`);
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
