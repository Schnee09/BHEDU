import { classifyStudentDuplicate } from '../duplicateCheck';

const row = {
  id: 'student-1',
  full_name: 'Nguyễn Văn An',
  student_code: 'HS20260001',
  student_id: '012345678901',
  phone: '0912 345 678',
  email: 'hs20260001@student.bhedu.vn',
  personal_email: 'an@example.com',
  grade_level: 'Lớp 10',
  status: 'active',
};

describe('classifyStudentDuplicate', () => {
  it('marks stable identifiers as high severity', () => {
    const result = classifyStudentDuplicate(row, { student_id: '012345678901' });
    expect(result?.severity).toBe('high');
    expect(result?.reasons).toContain('student_id');
  });

  it('normalizes phone formatting and marks it as medium severity', () => {
    const result = classifyStudentDuplicate(row, { phone: '0912345678' });
    expect(result?.severity).toBe('medium');
    expect(result?.reasons).toContain('phone');
  });

  it('matches Vietnamese names without accents but keeps name-only matches low severity', () => {
    const result = classifyStudentDuplicate(row, { full_name: 'nguyen van an' });
    expect(result?.severity).toBe('low');
    expect(result?.reasons).toEqual(['full_name']);
  });

  it('returns null when no identifying value matches', () => {
    expect(classifyStudentDuplicate(row, { full_name: 'Trần Minh Bình' })).toBeNull();
  });
});
