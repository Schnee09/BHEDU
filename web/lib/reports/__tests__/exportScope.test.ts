import { intersectClassScopes } from '@/lib/reports/exportScope';

describe('intersectClassScopes', () => {
  it('uses the first resolved filter as the initial scope', () => {
    expect(intersectClassScopes(null, ['class-1', 'class-2', 'class-1'])).toEqual([
      'class-1',
      'class-2',
    ]);
  });

  it('keeps only classes shared by multiple filters', () => {
    expect(intersectClassScopes(['class-1', 'class-2'], ['class-2', 'class-3'])).toEqual([
      'class-2',
    ]);
  });

  it('preserves an empty scope instead of treating it as unfiltered', () => {
    expect(intersectClassScopes([], ['class-1'])).toEqual([]);
    expect(intersectClassScopes(['class-1'], [])).toEqual([]);
  });
});
