import { calculateComponentAverage, normalizeGradeComponent } from '../component';

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

describe('calculateComponentAverage', () => {
  it('uses the current 50:50 formula for midterm and final grades', () => {
    expect(
      calculateComponentAverage({
        oral: null,
        fifteen_min: null,
        one_period: null,
        midterm: 8,
        final: 6,
      })
    ).toBe(7);
  });

  it('preserves coefficient weighting for legacy component records', () => {
    expect(
      calculateComponentAverage({
        oral: 8,
        fifteen_min: null,
        one_period: null,
        midterm: 6,
        final: 10,
      })
    ).toBeCloseTo(8.33, 2);
  });
});
