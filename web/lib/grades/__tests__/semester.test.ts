import { getGradeSemesterAliases, normalizeGradeSemester } from '../semester';

describe('grade semester normalization', () => {
  it.each([
    ['1', '1'],
    ['HK1', '1'],
    ['2026-2027-HK1', '1'],
    ['2', '2'],
    ['2026-2027-HK2', '2'],
    ['CN', 'final'],
  ])('normalizes %s to %s', (input, expected) => {
    expect(normalizeGradeSemester(input)).toBe(expected);
  });

  it('keeps the original code as a read alias for transitional data', () => {
    expect(getGradeSemesterAliases('2026-2027-HK2')).toEqual(['2', '2026-2027-HK2']);
  });
});
