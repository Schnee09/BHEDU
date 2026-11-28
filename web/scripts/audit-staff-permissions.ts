import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });
config({ path: '.env' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error('Supabase URL and service role key are required.');
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const intended = [
  'students.view',
  'students.create',
  'students.edit',
  'classes.view',
  'classes.enroll',
  'enrollments.view',
  'enrollments.manage',
  'timetable.view',
  'parent_links.view',
  'parent_links.approve',
  'attendance.view',
  'attendance.mark',
  'attendance.reports',
  'grades.view',
  'grades.entry',
  'finance.view',
  'finance.manage',
  'reports.view',
  'subjects.view',
  'curriculum.view',
];

async function main() {
  const [{ data: definitions, error: definitionsError }, { data: defaults, error: defaultsError }] =
    await Promise.all([
      supabase.from('permission_definitions').select('code').in('code', intended),
      supabase
        .from('role_permissions')
        .select('permission_code')
        .eq('role', 'staff')
        .order('permission_code'),
    ]);

  if (definitionsError) throw definitionsError;
  if (defaultsError) throw defaultsError;

  const existingDefinitions = new Set((definitions || []).map((item) => item.code));
  const missingDefinitions = intended.filter((code) => !existingDefinitions.has(code));
  const currentDefaults = (defaults || []).map((item) => item.permission_code);
  const intendedSet = new Set(intended);
  const missingDefaults = intended.filter((code) => !currentDefaults.includes(code));
  const unexpectedDefaults = currentDefaults.filter((code) => !intendedSet.has(code));

  console.log(`Missing definitions: ${missingDefinitions.join(', ') || 'none'}`);
  console.log(`Missing staff defaults: ${missingDefaults.join(', ') || 'none'}`);
  console.log(`Unexpected staff defaults: ${unexpectedDefaults.join(', ') || 'none'}`);

  if (missingDefinitions.length || missingDefaults.length || unexpectedDefaults.length) {
    throw new Error('Staff permission configuration does not match the intended baseline.');
  }

  console.log(`Staff permission audit passed (${currentDefaults.length} defaults).`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
