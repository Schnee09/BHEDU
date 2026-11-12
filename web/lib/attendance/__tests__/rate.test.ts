import { calculateAttendanceRate } from '../rate';

describe('calculateAttendanceRate', () => {
  it('returns null when attendance has not been recorded', () => {
    expect(calculateAttendanceRate([])).toBeNull();
  });

  it('counts present and late records as attended', () => {
    expect(calculateAttendanceRate(['present', 'late', 'absent', 'excused'])).toBe(50);
  });

  it('supports a requested decimal precision', () => {
    expect(calculateAttendanceRate(['present', 'late', 'absent'], 1)).toBe(66.7);
  });
});
