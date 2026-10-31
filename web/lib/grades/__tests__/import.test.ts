import { normalizeImportedGradeComponent } from '../import';

describe('normalizeImportedGradeComponent', () => {
  it.each([
    ['Giữa kỳ', 'midterm'],
    ['giua ky', 'midterm'],
    ['MIDTERM', 'midterm'],
    ['Cuối kỳ', 'final'],
    ['cuoi ky', 'final'],
    ['final', 'final'],
  ])('maps %s to %s', (input, expected) => {
    expect(normalizeImportedGradeComponent(input)).toBe(expected);
  });

  it('rejects unsupported components', () => {
    expect(normalizeImportedGradeComponent('15 phút')).toBeNull();
  });
});
