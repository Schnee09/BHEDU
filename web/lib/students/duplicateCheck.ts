import type { SupabaseClient } from '@supabase/supabase-js';

export const STUDENT_DUPLICATE_SELECT =
  'id, full_name, student_code, student_id, phone, email, personal_email, grade_level, status';

export type DuplicateMatchReason =
  | 'student_code'
  | 'student_id'
  | 'phone'
  | 'personal_email'
  | 'email'
  | 'full_name';

export type DuplicateSeverity = 'high' | 'medium' | 'low';

export interface StudentDuplicateInput {
  full_name?: string | null;
  student_code?: string | null;
  student_id?: string | null;
  phone?: string | null;
  personal_email?: string | null;
  email?: string | null;
}

export interface StudentDuplicateCandidate {
  id: string;
  full_name: string | null;
  student_code: string | null;
  student_id: string | null;
  phone: string | null;
  email: string | null;
  personal_email: string | null;
  grade_level: string | null;
  status: string | null;
  severity: DuplicateSeverity;
  reasons: DuplicateMatchReason[];
}

type StudentRow = Omit<StudentDuplicateCandidate, 'severity' | 'reasons'>;

const compact = (value?: string | null) => value?.trim() || '';
const normalizedText = (value?: string | null) =>
  compact(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .toLowerCase();
const normalizedPhone = (value?: string | null) => compact(value).replace(/\D/g, '');
const normalizedCode = (value?: string | null) => compact(value).toUpperCase();
const normalizedEmail = (value?: string | null) => compact(value).toLowerCase();

export function classifyStudentDuplicate(
  row: StudentRow,
  input: StudentDuplicateInput
): StudentDuplicateCandidate | null {
  const reasons: DuplicateMatchReason[] = [];

  if (
    normalizedCode(input.student_code) &&
    normalizedCode(row.student_code) === normalizedCode(input.student_code)
  ) {
    reasons.push('student_code');
  }
  if (
    normalizedCode(input.student_id) &&
    normalizedCode(row.student_id) === normalizedCode(input.student_id)
  ) {
    reasons.push('student_id');
  }
  if (normalizedPhone(input.phone) && normalizedPhone(row.phone) === normalizedPhone(input.phone)) {
    reasons.push('phone');
  }
  if (
    normalizedEmail(input.personal_email) &&
    normalizedEmail(row.personal_email) === normalizedEmail(input.personal_email)
  ) {
    reasons.push('personal_email');
  }
  if (normalizedEmail(input.email) && normalizedEmail(row.email) === normalizedEmail(input.email)) {
    reasons.push('email');
  }
  if (
    normalizedText(input.full_name) &&
    normalizedText(row.full_name) === normalizedText(input.full_name)
  ) {
    reasons.push('full_name');
  }

  if (reasons.length === 0) return null;

  const severity: DuplicateSeverity = reasons.some((reason) =>
    ['student_code', 'student_id', 'email'].includes(reason)
  )
    ? 'high'
    : reasons.includes('phone') || reasons.includes('personal_email')
      ? 'medium'
      : 'low';

  return { ...row, severity, reasons };
}

function phoneVariants(value?: string | null): string[] {
  const digits = normalizedPhone(value);
  if (!digits) return [];
  const variants = new Set([compact(value), digits]);
  if (digits.length === 10) {
    variants.add(`${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`);
  }
  return [...variants];
}

export async function findStudentDuplicates(
  supabase: SupabaseClient,
  input: StudentDuplicateInput
): Promise<StudentDuplicateCandidate[]> {
  const baseQuery = () =>
    supabase
      .from('profiles')
      .select(STUDENT_DUPLICATE_SELECT)
      .eq('role', 'student')
      .is('deleted_at', null)
      .limit(10);

  const queries: PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>[] = [];
  if (compact(input.student_code))
    queries.push(baseQuery().ilike('student_code', compact(input.student_code)));
  if (compact(input.student_id))
    queries.push(baseQuery().ilike('student_id', compact(input.student_id)));
  if (phoneVariants(input.phone).length)
    queries.push(baseQuery().in('phone', phoneVariants(input.phone)));
  if (compact(input.personal_email))
    queries.push(baseQuery().ilike('personal_email', compact(input.personal_email)));
  if (compact(input.email)) queries.push(baseQuery().ilike('email', compact(input.email)));
  if (compact(input.full_name).length >= 3)
    queries.push(baseQuery().ilike('full_name', compact(input.full_name)));

  if (queries.length === 0) return [];

  const results = await Promise.all(queries);
  const rows = new Map<string, StudentRow>();
  for (const result of results) {
    if (result.error) throw new Error(`Không thể kiểm tra hồ sơ trùng: ${result.error.message}`);
    for (const row of result.data || []) {
      const typedRow = row as StudentRow;
      rows.set(typedRow.id, typedRow);
    }
  }

  return [...rows.values()]
    .map((row) => classifyStudentDuplicate(row, input))
    .filter((candidate): candidate is StudentDuplicateCandidate => candidate !== null)
    .sort(
      (a, b) =>
        ({ high: 0, medium: 1, low: 2 })[a.severity] - { high: 0, medium: 1, low: 2 }[b.severity]
    );
}
