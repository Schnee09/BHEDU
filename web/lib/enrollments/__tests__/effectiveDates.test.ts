import {
  addDaysToDateOnly,
  doesEnrollmentOverlapPeriod,
  getCalendarMonthPeriod,
  getCurrentDateOnly,
  getWeekPeriodContaining,
  isEnrollmentEffectiveOn,
  isValidDateOnly,
} from '../effectiveDates';

describe('enrollment effective dates', () => {
  const historicalEnrollment = {
    enrollment_date: '2026-01-10',
    end_date: '2026-03-05',
  };

  it('includes both the first and last effective day', () => {
    expect(isEnrollmentEffectiveOn(historicalEnrollment, '2026-01-10')).toBe(true);
    expect(isEnrollmentEffectiveOn(historicalEnrollment, '2026-03-05')).toBe(true);
  });

  it('excludes dates outside the enrollment period', () => {
    expect(isEnrollmentEffectiveOn(historicalEnrollment, '2026-01-09')).toBe(false);
    expect(isEnrollmentEffectiveOn(historicalEnrollment, '2026-03-06')).toBe(false);
  });

  it('treats an enrollment without an end date as ongoing', () => {
    expect(
      isEnrollmentEffectiveOn({ enrollment_date: '2026-09-01', end_date: null }, '2027-01-01')
    ).toBe(true);
  });

  it('detects enrollment overlap with a billing month', () => {
    const march = getCalendarMonthPeriod('2026-03-01');
    expect(doesEnrollmentOverlapPeriod(historicalEnrollment, march)).toBe(true);
    expect(
      doesEnrollmentOverlapPeriod(historicalEnrollment, getCalendarMonthPeriod('2026-04-01'))
    ).toBe(false);
  });

  it('handles leap-year month boundaries', () => {
    expect(getCalendarMonthPeriod('2028-02-15')).toEqual({
      start: '2028-02-01',
      end: '2028-02-29',
    });
  });

  it('rejects an invalid calendar month', () => {
    expect(() => getCalendarMonthPeriod('2026-13-01')).toThrow('month must use YYYY-MM-DD format');
  });

  it('rejects impossible calendar dates', () => {
    expect(isValidDateOnly('2026-02-29')).toBe(false);
    expect(isValidDateOnly('2028-02-29')).toBe(true);
  });

  it('counts an enrollment ending on the first day of a month as overlapping', () => {
    expect(
      doesEnrollmentOverlapPeriod(
        { enrollment_date: '2026-01-01', end_date: '2026-03-01' },
        getCalendarMonthPeriod('2026-03-01')
      )
    ).toBe(true);
  });

  it('builds a Monday-to-Sunday period across month boundaries', () => {
    expect(getWeekPeriodContaining('2026-11-01')).toEqual({
      start: '2026-10-26',
      end: '2026-11-01',
    });
    expect(addDaysToDateOnly('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('uses the center timezone for the current business date', () => {
    expect(getCurrentDateOnly(new Date('2026-10-24T18:30:00Z'))).toBe('2026-10-25');
  });
});
