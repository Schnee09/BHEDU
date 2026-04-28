/**
 * CSV Import Service
 * Handles validation, parsing, and bulk import of student data
 */

import Papa from 'papaparse';

export interface StudentImportRow {
  // Required fields
  firstName: string;
  lastName: string;
  email: string;

  // Optional student fields
  phone?: string;
  address?: string;
  dateOfBirth?: string; // YYYY-MM-DD format
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  studentId?: string;
  enrollmentDate?: string; // YYYY-MM-DD format
  gradeLevel?: string;
  status?: 'active' | 'inactive' | 'graduated' | 'transferred' | 'suspended';

  // Guardian fields
  guardianName?: string;
  guardianRelationship?: 'father' | 'mother' | 'guardian' | 'grandparent' | 'sibling' | 'other';
  guardianPhone?: string;
  guardianEmail?: string;
  guardianAddress?: string;
  isPrimaryContact?: boolean;
  isEmergencyContact?: boolean;
}

export interface ValidationError {
  row: number;
  field: string;
  value: unknown;
  message: string;
  severity: 'error' | 'warning';
}

export interface ImportPreview {
  valid: StudentImportRow[];
  errors: ValidationError[];
  warnings: ValidationError[];
  totalRows: number;
  validRows: number;
  errorRows: number;
}

/**
 * Parse CSV file to structured data
 */
export async function parseCSV(file: File): Promise<StudentImportRow[]> {
  return new Promise<StudentImportRow[]>((resolve, reject) => {
    Papa.parse<StudentImportRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => {
        // Convert various header formats to camelCase
        const headerMap: Record<string, string> = {
          'first name': 'firstName',
          firstname: 'firstName',
          first_name: 'firstName',
          'họ': 'firstName',
          'last name': 'lastName',
          lastname: 'lastName',
          last_name: 'lastName',
          'tên': 'lastName',
          email: 'email',
          'e-mail': 'email',
          phone: 'phone',
          'phone number': 'phone',
          'số điện thoại': 'phone',
          'sđt': 'phone',
          address: 'address',
          'địa chỉ': 'address',
          'date of birth': 'dateOfBirth',
          dob: 'dateOfBirth',
          'birth date': 'dateOfBirth',
          'ngày sinh': 'dateOfBirth',
          gender: 'gender',
          sex: 'gender',
          'giới tính': 'gender',
          'student id': 'studentId',
          student_id: 'studentId',
          id: 'studentId',
          'mã học sinh': 'studentId',
          'mã định danh (cid)': 'studentId',
          'cid': 'studentId',
          'enrollment date': 'enrollmentDate',
          enrollment_date: 'enrollmentDate',
          'ngày nhập học': 'enrollmentDate',
          grade: 'gradeLevel',
          'grade level': 'gradeLevel',
          class: 'gradeLevel',
          'khối lớp': 'gradeLevel',
          'lớp': 'gradeLevel',
          status: 'status',
          'trạng thái': 'status',
          'guardian name': 'guardianName',
          guardian_name: 'guardianName',
          'parent name': 'guardianName',
          'tên phụ huynh': 'guardianName',
          'tên người giám hộ': 'guardianName',
          'guardian relationship': 'guardianRelationship',
          relationship: 'guardianRelationship',
          'mối quan hệ': 'guardianRelationship',
          'guardian phone': 'guardianPhone',
          guardian_phone: 'guardianPhone',
          'parent phone': 'guardianPhone',
          'sđt phụ huynh': 'guardianPhone',
          'guardian email': 'guardianEmail',
          guardian_email: 'guardianEmail',
          'parent email': 'guardianEmail',
          'email phụ huynh': 'guardianEmail',
          'guardian address': 'guardianAddress',
          'địa chỉ phụ huynh': 'guardianAddress',
          'primary contact': 'isPrimaryContact',
          'liên hệ chính': 'isPrimaryContact',
          'emergency contact': 'isEmergencyContact',
          'liên hệ khẩn cấp': 'isEmergencyContact',
        };

        const normalized = header.toLowerCase().trim();
        return headerMap[normalized] || header;
      },
      complete: (results: Papa.ParseResult<StudentImportRow>) => {
        resolve(results.data);
      },
      error: (error: Error) => {
        reject(error);
      },
    });
  });
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate date format (YYYY-MM-DD or common formats)
 */
function parseDate(dateString: string): Date | null {
  if (!dateString) return null;

  // Try ISO format first (YYYY-MM-DD)
  const isoDate = new Date(dateString);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }

  // Try common formats: MM/DD/YYYY, DD/MM/YYYY, etc.
  const parts = dateString.split(/[-\/]/);
  if (parts.length === 3) {
    // Try MM/DD/YYYY
    const date1 = new Date(`${parts[2]}-${parts[0]}-${parts[1]}`);
    if (!isNaN(date1.getTime())) return date1;

    // Try DD/MM/YYYY
    const date2 = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    if (!isNaN(date2.getTime())) return date2;
  }

  return null;
}

/**
 * Validate phone number (basic validation)
 */
function isValidPhone(phone: string): boolean {
  // Remove common formatting characters
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  // Check if it's between 10-15 digits
  return /^\d{10,15}$/.test(cleaned);
}

/**
 * Validate student import data
 */
export async function validateImportData(rows: StudentImportRow[]): Promise<ImportPreview> {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const valid: StudentImportRow[] = [];
  const seenEmails = new Set<string>();
  const seenStudentIds = new Set<string>();

  rows.forEach((row, index) => {
    const rowNumber = index + 2; // +2 because row 1 is header, arrays are 0-indexed
    let hasError = false;

    // Required field validations
    if (!row.firstName || row.firstName.trim() === '') {
      errors.push({
        row: rowNumber,
        field: 'firstName',
        value: row.firstName,
        message: 'Họ không được để trống',
        severity: 'error',
      });
      hasError = true;
    }

    if (!row.lastName || row.lastName.trim() === '') {
      errors.push({
        row: rowNumber,
        field: 'lastName',
        value: row.lastName,
        message: 'Tên không được để trống',
        severity: 'error',
      });
      hasError = true;
    }

    if (!row.email || row.email.trim() === '') {
      errors.push({
        row: rowNumber,
        field: 'email',
        value: row.email,
        message: 'Email không được để trống',
        severity: 'error',
      });
      hasError = true;
    } else if (!isValidEmail(row.email)) {
      errors.push({
        row: rowNumber,
        field: 'email',
        value: row.email,
        message: 'Định dạng Email không hợp lệ',
        severity: 'error',
      });
      hasError = true;
    } else if (seenEmails.has(row.email.toLowerCase())) {
      errors.push({
        row: rowNumber,
        field: 'email',
        value: row.email,
        message: 'Email này đã tồn tại trong danh sách nhập',
        severity: 'error',
      });
      hasError = true;
    } else {
      seenEmails.add(row.email.toLowerCase());
    }

    // Optional field validations
    if (row.phone && !isValidPhone(row.phone)) {
      warnings.push({
        row: rowNumber,
        field: 'phone',
        value: row.phone,
        message: 'Định dạng số điện thoại không hợp lệ',
        severity: 'warning',
      });
    }

    if (row.dateOfBirth) {
      const dob = parseDate(row.dateOfBirth);
      if (!dob) {
        warnings.push({
          row: rowNumber,
          field: 'dateOfBirth',
          value: row.dateOfBirth,
          message: 'Định dạng ngày không hợp lệ (hỗ trợ YYYY-MM-DD)',
          severity: 'warning',
        });
      } else {
        // Convert to ISO format
        row.dateOfBirth = dob.toISOString().split('T')[0] ?? '';
      }
    }

    if (row.gender && !['male', 'female', 'other', 'prefer_not_to_say'].includes(row.gender)) {
      warnings.push({
        row: rowNumber,
        field: 'gender',
        value: row.gender,
        message: 'Giới tính không hợp lệ (dùng: male, female, other)',
        severity: 'warning',
      });
    }

    if (row.studentId) {
      if (seenStudentIds.has(row.studentId)) {
        errors.push({
          row: rowNumber,
          field: 'studentId',
          value: row.studentId,
          message: 'Mã định danh (CID) bị trùng trong danh sách nhập',
          severity: 'error',
        });
        hasError = true;
      } else {
        seenStudentIds.add(row.studentId);
      }
    }

    if (row.enrollmentDate) {
      const enrollDate = parseDate(row.enrollmentDate);
      if (!enrollDate) {
        warnings.push({
          row: rowNumber,
          field: 'enrollmentDate',
          value: row.enrollmentDate,
          message: 'Định dạng ngày nhập học không hợp lệ',
          severity: 'warning',
        });
      } else {
        row.enrollmentDate = enrollDate.toISOString().split('T')[0] ?? '';
      }
    }

    if (
      row.status &&
      !['active', 'inactive', 'graduated', 'transferred', 'suspended'].includes(row.status)
    ) {
      warnings.push({
        row: rowNumber,
        field: 'status',
        value: row.status,
        message: 'Trạng thái không hợp lệ (dùng: active, inactive, graduated...)',
        severity: 'warning',
      });
      row.status = 'active'; // Default to active
    }

    // Guardian validations
    if (row.guardianEmail && !isValidEmail(row.guardianEmail)) {
      warnings.push({
        row: rowNumber,
        field: 'guardianEmail',
        value: row.guardianEmail,
        message: 'Định dạng Email phụ huynh không hợp lệ',
        severity: 'warning',
      });
    }

    if (row.guardianPhone && !isValidPhone(row.guardianPhone)) {
      warnings.push({
        row: rowNumber,
        field: 'guardianPhone',
        value: row.guardianPhone,
        message: 'Định dạng SĐT phụ huynh không hợp lệ',
        severity: 'warning',
      });
    }

    if (
      row.guardianRelationship &&
      !['father', 'mother', 'guardian', 'grandparent', 'sibling', 'other'].includes(
        row.guardianRelationship
      )
    ) {
      warnings.push({
        row: rowNumber,
        field: 'guardianRelationship',
        value: row.guardianRelationship,
        message:
          'Mối quan hệ không hợp lệ (dùng: father, mother, guardian...)',
        severity: 'warning',
      });
    }

    // Convert boolean strings to actual booleans
    if (row.isPrimaryContact !== undefined) {
      row.isPrimaryContact = ['true', '1', 'yes', 'y'].includes(
        String(row.isPrimaryContact).toLowerCase()
      );
    }
    if (row.isEmergencyContact !== undefined) {
      row.isEmergencyContact = ['true', '1', 'yes', 'y'].includes(
        String(row.isEmergencyContact).toLowerCase()
      );
    }

    if (!hasError) {
      valid.push(row);
    }
  });

  return {
    valid,
    errors,
    warnings,
    totalRows: rows.length,
    validRows: valid.length,
    errorRows: rows.length - valid.length,
  };
}

/**
 * Generate CSV template for download
 */
export function generateCSVTemplate(): string {
  const headers = [
    'Họ',
    'Tên',
    'Email',
    'Số điện thoại',
    'Địa chỉ',
    'Ngày sinh',
    'Giới tính',
    'Mã định danh (CID)',
    'Ngày nhập học',
    'Khối lớp',
    'Trạng thái',
    'Tên phụ huynh',
    'Mối quan hệ',
    'SĐT phụ huynh',
    'Email phụ huynh',
    'Địa chỉ phụ huynh',
    'Liên hệ chính',
    'Liên hệ khẩn cấp',
  ];

  const sampleData = [
    [
      'Nguyễn',
      'Văn A',
      'nguyen.vana@example.com',
      '0901234567',
      '123 Đường Lê Lợi, Quận 1, TP.HCM',
      '2010-05-15',
      'male',
      'CID-2024-001',
      '2024-09-01',
      'Lớp 8',
      'active',
      'Nguyễn Văn B',
      'father',
      '0907654321',
      'nguyen.vanb@example.com',
      '123 Đường Lê Lợi, Quận 1, TP.HCM',
      'true',
      'true',
    ],
    [
      'Trần',
      'Thị B',
      'tran.thib@example.com',
      '0912345678',
      '456 Đường Nguyễn Huệ, Quận 1, TP.HCM',
      '2011-08-22',
      'female',
      'CID-2024-002',
      '2024-09-01',
      'Lớp 7',
      'active',
      'Trần Văn C',
      'father',
      '0918765432',
      'tran.vanc@example.com',
      '456 Đường Nguyễn Huệ, Quận 1, TP.HCM',
      'true',
      'false',
    ],
  ];

  const csv = Papa.unparse({
    fields: headers,
    data: sampleData,
  });

  return csv;
}
