import Papa from 'papaparse';

export const MAX_CSV_BYTES = 2 * 1024 * 1024;
export const MAX_CSV_ROWS = 1000;

const REQUIRED_HEADERS: Record<string, string[]> = {
  students: ['full_name'],
};

export class CsvImportError extends Error {}

export function parseCsvImport(text: string, type: string) {
  const requiredHeaders = REQUIRED_HEADERS[type];
  if (!requiredHeaders) {
    throw new CsvImportError('Loại dữ liệu nhập không hợp lệ');
  }

  const result = Papa.parse<string[]>(text.replace(/^\uFEFF/, ''), {
    skipEmptyLines: 'greedy',
  });

  if (result.errors.length > 0) {
    const firstError = result.errors[0];
    const row = typeof firstError?.row === 'number' ? firstError.row + 1 : undefined;
    throw new CsvImportError(row ? `CSV không hợp lệ tại dòng ${row}` : 'CSV không hợp lệ');
  }

  const [headerRow, ...rows] = result.data;
  const headers = (headerRow || []).map((header) => header.trim());

  if (headers.length === 0 || headers.every((header) => !header)) {
    throw new CsvImportError('File CSV không có hàng tiêu đề');
  }

  const duplicateHeaders = headers.filter(
    (header, index) => header && headers.indexOf(header) !== index
  );
  if (duplicateHeaders.length > 0) {
    throw new CsvImportError(`Tiêu đề cột bị trùng: ${duplicateHeaders[0]}`);
  }

  const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));
  if (missingHeaders.length > 0) {
    throw new CsvImportError(`Thiếu cột bắt buộc: ${missingHeaders.join(', ')}`);
  }

  if (rows.length > MAX_CSV_ROWS) {
    throw new CsvImportError(`File CSV chỉ được chứa tối đa ${MAX_CSV_ROWS} dòng dữ liệu`);
  }

  return { headers, rows };
}
