import { normalizeGradeSemester } from './semester';

export interface SemesterPeriod {
  code: string;
  start_date: string;
  end_date: string;
}

export function findSemesterPeriod(
  periods: SemesterPeriod[],
  academicYearName: string,
  semester: unknown
): SemesterPeriod | null {
  const canonicalSemester = normalizeGradeSemester(semester);
  if (!canonicalSemester || canonicalSemester === 'final') return null;

  return (
    periods.find(
      (period) =>
        period.code.includes(academicYearName) &&
        normalizeGradeSemester(period.code) === canonicalSemester
    ) || null
  );
}
