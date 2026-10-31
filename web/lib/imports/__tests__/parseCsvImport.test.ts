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
      parseCsvImport('\uFEFFfull_name,email\nNguyễn Văn A,a@example.com', 'students').headers
    ).toEqual(['full_name', 'email']);
  });

  it('rejects legacy import types that bypass their dedicated workflows', () => {
    expect(() => parseCsvImport('student_id,score\ns1,8', 'grades')).toThrow(
      'Loại dữ liệu nhập không hợp lệ'
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
