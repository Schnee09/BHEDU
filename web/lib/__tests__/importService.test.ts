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

  it('keeps warning rows importable by removing invalid optional values', async () => {
    const result = await validateImportData([
      {
        firstName: 'An',
        lastName: 'Nguyễn Văn',
        phone: 'abc',
        dateOfBirth: '2010-02-31',
        gender: 'unknown' as never,
        guardianEmail: 'invalid',
        guardianPhone: '123',
        guardianRelationship: 'friend' as never,
      },
    ]);

    expect(result.valid).toHaveLength(1);
    expect(result.warnings).toHaveLength(6);
    expect(result.valid[0]).toEqual(
      expect.objectContaining({ firstName: 'An', lastName: 'Nguyễn Văn' })
    );
    expect(result.valid[0]?.phone).toBeUndefined();
    expect(result.valid[0]?.dateOfBirth).toBeUndefined();
    expect(result.valid[0]?.gender).toBeUndefined();
    expect(result.valid[0]?.guardianEmail).toBeUndefined();
    expect(result.valid[0]?.guardianPhone).toBeUndefined();
    expect(result.valid[0]?.guardianRelationship).toBeUndefined();
  });
});
