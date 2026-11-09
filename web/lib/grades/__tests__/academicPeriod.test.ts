import { findSemesterPeriod } from '../academicPeriod';

describe('findSemesterPeriod', () => {
  const periods = [
    {
      code: '2025-2026-HK1',
      start_date: '2025-09-01',
      end_date: '2026-01-15',
    },
    {
      code: '2026-2027-HK1',
      start_date: '2026-09-01',
      end_date: '2027-01-15',
    },
  ];

  it('matches both academic year and normalized semester', () => {
    expect(findSemesterPeriod(periods, '2025-2026', '1')).toEqual(periods[0]);
    expect(findSemesterPeriod(periods, '2026-2027', 'HK1')).toEqual(periods[1]);
  });

  it('does not use a period from another year or for a whole-year report', () => {
    expect(findSemesterPeriod(periods, '2024-2025', 'HK1')).toBeNull();
    expect(findSemesterPeriod(periods, '2025-2026', 'CN')).toBeNull();
  });
});
