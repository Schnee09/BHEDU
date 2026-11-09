import { getVietnameseClassification, normalizeConductRating } from '../conduct';

describe('conduct and academic classification', () => {
  it('does not invent a conduct rating when none was recorded', () => {
    expect(normalizeConductRating(undefined)).toBeNull();
    expect(normalizeConductRating('unknown')).toBeNull();
  });
  it.each([
    ['Tot', 'Tốt'],
    ['Kha', 'Khá'],
    ['TB', 'Đạt'],
    ['Yeu', 'Chưa đạt'],
    ['Yếu', 'Chưa đạt'],
  ])('normalizes %s to %s', (input, expected) => {
    expect(normalizeConductRating(input)).toBe(expected);
  });

  it('allows excellent classification with the stored Tốt rating', () => {
    expect(getVietnameseClassification(9.2, 'Tốt').classification_vi).toBe('Xuất sắc');
  });

  it('does not award a high classification for Chưa đạt conduct', () => {
    expect(getVietnameseClassification(8.5, 'Chưa đạt').classification_vi).toBe('Trung bình');
  });
});
