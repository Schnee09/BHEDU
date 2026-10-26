export interface EnrollmentPeriod {
  enrollment_date: string;
  end_date?: string | null;
}

export interface DatePeriod {
  start: string;
  end: string;
}

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const CENTER_TIME_ZONE = 'Asia/Ho_Chi_Minh';

function assertDateOnly(value: string, fieldName: string): void {
  if (!isValidDateOnly(value)) {
    throw new Error(`${fieldName} must use YYYY-MM-DD format`);
  }
}

export function isValidDateOnly(value: string): boolean {
  if (!DATE_ONLY_PATTERN.test(value)) return false;

  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const parsed = new Date(Date.UTC(year, month - 1, day));

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

/** Enrollment dates are inclusive at both ends. */
export function isEnrollmentEffectiveOn(enrollment: EnrollmentPeriod, date: string): boolean {
  assertDateOnly(date, 'date');
  return (
    enrollment.enrollment_date <= date && (!enrollment.end_date || enrollment.end_date >= date)
  );
}

/** Returns true when an enrollment is effective for at least one day in a period. */
export function doesEnrollmentOverlapPeriod(
  enrollment: EnrollmentPeriod,
  period: DatePeriod
): boolean {
  assertDateOnly(period.start, 'period.start');
  assertDateOnly(period.end, 'period.end');
  if (period.end < period.start) {
    throw new Error('period.end cannot precede period.start');
  }

  return (
    enrollment.enrollment_date <= period.end &&
    (!enrollment.end_date || enrollment.end_date >= period.start)
  );
}

export function getCalendarMonthPeriod(value: string): DatePeriod {
  assertDateOnly(value, 'month');
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  if (month < 1 || month > 12) {
    throw new Error('month must contain a valid calendar month');
  }
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();

  return {
    start: `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-01`,
    end: `${year.toString().padStart(4, '0')}-${month
      .toString()
      .padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`,
  };
}

export function addDaysToDateOnly(value: string, days: number): string {
  assertDateOnly(value, 'date');
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

export function getWeekPeriodContaining(value: string): DatePeriod {
  assertDateOnly(value, 'date');
  const date = new Date(`${value}T00:00:00Z`);
  const dayOfWeek = date.getUTCDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const start = addDaysToDateOnly(value, mondayOffset);

  return { start, end: addDaysToDateOnly(start, 6) };
}

export function getCurrentDateOnly(
  now: Date = new Date(),
  timeZone: string = CENTER_TIME_ZONE
): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}
