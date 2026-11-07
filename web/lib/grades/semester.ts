export type CanonicalGradeSemester = '1' | '2' | 'final';

export function normalizeGradeSemester(value: unknown): CanonicalGradeSemester | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;

  const semester = String(value).trim().toUpperCase();
  if (semester === '1' || semester.includes('HK1')) return '1';
  if (semester === '2' || semester.includes('HK2')) return '2';
  if (['FINAL', 'YEAR', 'CN', 'CẢ NĂM'].includes(semester)) return 'final';
  return null;
}

export function getGradeSemesterAliases(value: unknown): string[] {
  const canonical = normalizeGradeSemester(value);
  if (!canonical) return [];

  const original = String(value).trim();
  return original && original !== canonical ? [canonical, original] : [canonical];
}
