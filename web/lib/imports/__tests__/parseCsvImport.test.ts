import { CsvImportError, MAX_CSV_ROWS, parseCsvImport } from '@/lib/imports/parseCsvImport';

describe('parseCsvImport', () => {
  it('preserves commas and line breaks inside quoted cells', () => {
    const result = parseCsvImport(
      'full_name,email\r\n"Nguyễn, Văn An","an@example.com"\r\n"Trần\nThị Bình",binh@example.com',
      'students'
    );

    expect(result.rows).toEqual([
      ['Nguyễn, Văn An', 'an@example.com'],
      ['Trần\nThị Bình', 'binh@example.com'],
    ]);
  });

  it('removes a UTF-8 BOM from the first header', () => {
    expect(
      parseCsvImport('\uFEFFstudent_id,class_id,date\ns1,c1,2026-10-31', 'attendance').headers
    ).toEqual(['student_id', 'class_id', 'date']);
  });

  it('rejects missing required headers', () => {
    expect(() => parseCsvImport('student_id,score\ns1,8', 'grades')).toThrow(
      'Thiếu cột bắt buộc: subject'
    );
  });

  it('rejects duplicate headers', () => {
    expect(() => parseCsvImport('full_name,full_name\nA,B', 'students')).toThrow(
      'Tiêu đề cột bị trùng: full_name'
    );
  });

  it('rejects imports above the row limit', () => {
    const rows = Array.from({ length: MAX_CSV_ROWS + 1 }, (_, index) => `Học sinh ${index}`);
    expect(() => parseCsvImport(['full_name', ...rows].join('\n'), 'students')).toThrow(
      CsvImportError
    );
  });
});
