import { calculateAttendanceRate, summarizeAttendanceStatuses } from '../metrics';

describe('summarizeAttendanceStatuses', () => {
  it('counts every supported status and treats late students as attending', () => {
    expect(
      summarizeAttendanceStatuses([
        { status: 'present' },
        { status: 'present' },
        { status: 'late' },
        { status: 'absent' },
        { status: 'excused' },
      ])
    ).toEqual({
      present: 2,
      absent: 1,
      late: 1,
      excused: 1,
      total: 5,
      attendanceRate: 60,
    });
  });

  it('returns zero rate for an empty data set', () => {
    expect(summarizeAttendanceStatuses([])).toEqual({
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      total: 0,
      attendanceRate: 0,
    });
  });
});

describe('calculateAttendanceRate', () => {
  it('counts late students as attending', () => {
    expect(calculateAttendanceRate(2, 1, 4)).toBe(75);
  });

  it('returns zero when no attendance has been marked', () => {
    expect(calculateAttendanceRate(0, 0, 0)).toBe(0);
  });
});
