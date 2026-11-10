import { normalizeGradeComponent } from '../component';

describe('normalizeGradeComponent', () => {
  it.each([
    ['Miệng', 'oral'],
    ['15 phút', 'fifteen_min'],
    ['45-phút', 'one_period'],
    ['1 tiết', 'one_period'],
    ['Giữa kỳ', 'midterm'],
    ['cuoi_ky', 'final'],
  ])('normalizes %s to %s', (input, expected) => {
    expect(normalizeGradeComponent(input)).toBe(expected);
  });

  it('does not guess an unknown component', () => {
    expect(normalizeGradeComponent('weekly_quiz')).toBeNull();
    expect(normalizeGradeComponent(null)).toBeNull();
  });
});
