import { getNormalizedGradeScore } from '../normalizedScore';

describe('getNormalizedGradeScore', () => {
  it('prefers the normalized score over raw assignment points', () => {
    expect(getNormalizedGradeScore({ score: 8, points_earned: 40 })).toBe(8);
  });

  it('supports legacy 10-point rows without a score', () => {
    expect(getNormalizedGradeScore({ score: null, points_earned: 7.5 })).toBe(7.5);
  });

  it('does not treat unscaled raw points as a normalized score', () => {
    expect(getNormalizedGradeScore({ score: null, points_earned: 40 })).toBeNull();
  });

  it('rejects an invalid stored score', () => {
    expect(getNormalizedGradeScore({ score: 15, points_earned: 40 })).toBeNull();
  });
});
