// db-audit-cleanup.mjs
// Script kiểm tra và dọn dẹp dữ liệu thừa trong Supabase
// Chạy: node scripts/db-audit-cleanup.mjs

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mwncwhkdimnjovxzhtjm.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13bmN3aGtkaW1uam92eHpodGptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQzODUzMCwiZXhwIjoyMDc2MDE0NTMwfQ.XRfRqGTIvIyGeg6iw8dWDBEh552tBrSI0RetYQkqsjU';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const hr = (label) => console.log(`\n${'─'.repeat(60)}\n  ${label}\n${'─'.repeat(60)}`);
const ok = (msg) => console.log(`  ✅ ${msg}`);
const warn = (msg) => console.log(`  ⚠️  ${msg}`);
const info = (msg) => console.log(`  ℹ️  ${msg}`);

async function runSQL(sql) {
    const { data, error } = await supabase.rpc('exec_sql', { query: sql }).single();
    if (error) throw error;
    return data;
}

// ─────────────────────────────────────────────────────────
// PHASE 1: AUDIT — chỉ đọc, không thay đổi gì
// ─────────────────────────────────────────────────────────

async function auditCourses() {
    hr('1. AUDIT: courses (seed tiếng Anh)');

    const STALE_CODES = ['TOAN-6', 'VAN-6', 'ANH-6', 'TOAN-7', 'VAN-7', 'ANH-7'];

    const { data: courses, error } = await supabase
        .from('courses')
        .select('id, code, name, name_vi')
        .in('code', STALE_CODES);

    if (error) { console.error('  ❌ Lỗi:', error.message); return []; }

    if (!courses || courses.length === 0) {
        ok('Không tìm thấy courses seed tiếng Anh — đã sạch.');
        return [];
    }

    warn(`Tìm thấy ${courses.length} courses seed thừa:`);
    const toDelete = [];

    for (const c of courses) {
        // Kiểm tra có lớp học nào đang dùng không
        const { count } = await supabase
            .from('classes')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', c.id);

        const used = (count ?? 0) > 0;
        console.log(`     ${used ? '🔒' : '🗑️ '} [${c.code}] "${c.name}" — ${used ? `${count} lớp đang dùng (BỎ QUA)` : 'Không có lớp → CÓ THỂ XÓA'}`);
        if (!used) toDelete.push(c.id);
    }

    return toDelete;
}

async function auditSubjects() {
    hr('2. AUDIT: subjects (codes tiếng Anh trùng lặp)');

    const ENGLISH_CODES = ['MATH', 'LIT', 'ENG', 'PHY', 'CHEM', 'OTHER'];

    const { data: subjects, error } = await supabase
        .from('subjects')
        .select('id, code, name')
        .in('code', ENGLISH_CODES);

    if (error) { console.error('  ❌ Lỗi:', error.message); return []; }

    if (!subjects || subjects.length === 0) {
        ok('Không tìm thấy subjects tiếng Anh trùng lặp — đã sạch.');
        return [];
    }

    warn(`Tìm thấy ${subjects.length} subjects có code tiếng Anh:`);
    const toDelete = [];

    for (const s of subjects) {
        const { count: courseCount } = await supabase
            .from('courses').select('*', { count: 'exact', head: true }).eq('subject_id', s.id);
        const { count: teacherCount } = await supabase
            .from('teacher_subjects').select('*', { count: 'exact', head: true }).eq('subject_id', s.id);

        const used = (courseCount ?? 0) > 0 || (teacherCount ?? 0) > 0;
        console.log(`     ${used ? '🔒' : '🗑️ '} [${s.code}] "${s.name}" — courses: ${courseCount ?? 0}, teachers: ${teacherCount ?? 0} → ${used ? 'BỎ QUA' : 'CÓ THỂ XÓA'}`);
        if (!used) toDelete.push(s.id);
    }

    return toDelete;
}

async function auditTestAccounts() {
    hr('3. AUDIT: test accounts (@test.com)');

    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, created_at')
        .like('email', '%@test.com');

    if (error) { console.error('  ❌ Lỗi:', error.message); return []; }

    if (!profiles || profiles.length === 0) {
        ok('Không tìm thấy test accounts — đã sạch.');
        return [];
    }

    warn(`Tìm thấy ${profiles.length} test accounts:`);
    profiles.forEach(p => {
        console.log(`     🗑️  [${p.role}] ${p.email} — "${p.full_name}"`);
    });

    return profiles.map(p => ({ id: p.id, email: p.email }));
}

async function auditOrphanClasses() {
    hr('4. AUDIT: classes mồ côi (không có học sinh, tên theo seed)');

    const SEED_NAMES = ['10A1','10A2','10A3','11A1','11A2','11A3','12A1','12A2','12A3','6A','6B','7A','7B','8A','8B','9A','9B'];

    const { data: classes, error } = await supabase
        .from('classes')
        .select('id, name, status, created_at')
        .in('name', SEED_NAMES);

    if (error) { console.error('  ❌ Lỗi:', error.message); return []; }
    if (!classes || classes.length === 0) {
        ok('Không tìm thấy lớp seed cũ — đã sạch.');
        return [];
    }

    warn(`Tìm thấy ${classes.length} lớp học có tên từ seed:`);
    const toDelete = [];

    for (const c of classes) {
        const { count } = await supabase
            .from('enrollments').select('*', { count: 'exact', head: true }).eq('class_id', c.id);
        const used = (count ?? 0) > 0;
        console.log(`     ${used ? '🔒' : '🗑️ '} "${c.name}" — ${count ?? 0} học sinh → ${used ? 'BỎ QUA' : 'CÓ THỂ XÓA'}`);
        if (!used) toDelete.push(c.id);
    }

    return toDelete;
}

// ─────────────────────────────────────────────────────────
// PHASE 2: CLEANUP — xóa những gì an toàn
// ─────────────────────────────────────────────────────────

async function cleanup({ courseIds, subjectIds, testAccounts, classIds }) {
    hr('5. CLEANUP — Thực hiện dọn dẹp');

    let deletedCount = 0;

    // --- courses ---
    if (courseIds.length > 0) {
        const { error } = await supabase.from('courses').delete().in('id', courseIds);
        if (error) console.error('  ❌ Lỗi xóa courses:', error.message);
        else { ok(`Đã xóa ${courseIds.length} courses seed tiếng Anh.`); deletedCount += courseIds.length; }
    } else {
        info('Courses: không có gì cần xóa.');
    }

    // --- subjects ---
    if (subjectIds.length > 0) {
        const { error } = await supabase.from('subjects').delete().in('id', subjectIds);
        if (error) console.error('  ❌ Lỗi xóa subjects:', error.message);
        else { ok(`Đã xóa ${subjectIds.length} subjects tiếng Anh trùng lặp.`); deletedCount += subjectIds.length; }
    } else {
        info('Subjects: không có gì cần xóa.');
    }

    // --- test accounts (profiles only, auth.users cần service role đặc biệt) ---
    if (testAccounts.length > 0) {
        const ids = testAccounts.map(a => a.id);
        const { error } = await supabase.from('profiles').delete().in('id', ids);
        if (error) console.error('  ❌ Lỗi xóa test profiles:', error.message);
        else { ok(`Đã xóa ${ids.length} test account profiles.`); deletedCount += ids.length; }
    } else {
        info('Test accounts: không có gì cần xóa.');
    }

    // --- orphan classes ---
    if (classIds.length > 0) {
        const { error } = await supabase.from('classes').delete().in('id', classIds);
        if (error) console.error('  ❌ Lỗi xóa classes mồ côi:', error.message);
        else { ok(`Đã xóa ${classIds.length} lớp học mồ côi.`); deletedCount += classIds.length; }
    } else {
        info('Classes: không có gì cần xóa.');
    }

    return deletedCount;
}

// ─────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────

async function main() {
    console.log('\n🔍 BH-EDU Database Audit & Cleanup');
    console.log('════════════════════════════════════════');

    const courseIds = await auditCourses();
    const subjectIds = await auditSubjects();
    const testAccounts = await auditTestAccounts();
    const classIds = await auditOrphanClasses();

    hr('TỔNG KẾT AUDIT');
    console.log(`  Courses cần xóa:       ${courseIds.length}`);
    console.log(`  Subjects cần xóa:      ${subjectIds.length}`);
    console.log(`  Test accounts cần xóa: ${testAccounts.length}`);
    console.log(`  Classes mồ côi cần xóa: ${classIds.length}`);

    const total = courseIds.length + subjectIds.length + testAccounts.length + classIds.length;

    if (total === 0) {
        ok('\nDB đã sạch! Không cần dọn dẹp gì cả.');
        return;
    }

    const deleted = await cleanup({ courseIds, subjectIds, testAccounts, classIds });

    hr('KẾT QUẢ');
    ok(`Dọn dẹp hoàn tất! Đã xóa ${deleted} bản ghi thừa.`);
    console.log('\n  ⚡ Gợi ý tiếp theo:');
    console.log('     - Xóa dòng seed trong 20260120100000_create_courses.sql (dòng 95-103)');
    console.log('     - Xóa dòng seed trong 20260102100000_add_academic_features.sql (dòng 124-134)');
    console.log('     - Kiểm tra lại dropdown Khóa học trong UI\n');
}

main().catch(console.error);
