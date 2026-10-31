import {
  MAX_STUDENT_IMPORT_FILE_BYTES,
  normalizeVietnameseNameImportHeader,
  validateImportData,
  validateStudentImportFile,
} from '@/lib/importService';

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

  it('rejects unsupported or oversized files before parsing', () => {
    expect(validateStudentImportFile({ name: 'students.xlsx', size: 100 })).toBe(
      'Vui lòng chọn file CSV'
    );
    expect(
      validateStudentImportFile({ name: 'students.CSV', size: MAX_STUDENT_IMPORT_FILE_BYTES + 1 })
    ).toBe('File CSV không được vượt quá 10 MB');
    expect(validateStudentImportFile({ name: 'students.CSV', size: 100 })).toBeNull();
  });
});
