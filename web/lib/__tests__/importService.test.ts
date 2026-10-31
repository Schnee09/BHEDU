import { normalizeVietnameseNameImportHeader, validateImportData } from '@/lib/importService';

describe('student import service', () => {
  it('maps Vietnamese name columns to the database name convention', () => {
    expect(normalizeVietnameseNameImportHeader('Họ')).toBe('lastName');
    expect(normalizeVietnameseNameImportHeader('Họ và tên đệm')).toBe('lastName');
    expect(normalizeVietnameseNameImportHeader('Tên')).toBe('firstName');
  });

  it('allows students without personal email addresses', async () => {
    const result = await validateImportData([
      { firstName: 'An', lastName: 'Nguyễn Văn', studentId: 'HS001' },
    ]);

    expect(result.errors).toEqual([]);
    expect(result.valid).toHaveLength(1);
  });
});
