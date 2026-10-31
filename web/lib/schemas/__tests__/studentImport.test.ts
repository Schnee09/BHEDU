import { studentImportRequestSchema } from '@/lib/schemas/requests/studentImport';

const validStudent = {
  firstName: 'Nguyễn',
  lastName: 'Văn An',
  email: 'an@example.com',
  studentId: 'HS001',
  dateOfBirth: '2010-05-15',
};

describe('studentImportRequestSchema', () => {
  it('normalizes valid rows', () => {
    const result = studentImportRequestSchema.parse({
      students: [{ ...validStudent, email: ' AN@EXAMPLE.COM ', unusedSpreadsheetColumn: 'x' }],
    });

    expect(result.students[0]?.email).toBe('an@example.com');
    expect(result.students[0]).not.toHaveProperty('unusedSpreadsheetColumn');
  });

  it('allows the system to issue an email when the spreadsheet omits it', () => {
    expect(
      studentImportRequestSchema.safeParse({
        students: [
          {
            firstName: validStudent.firstName,
            lastName: validStudent.lastName,
            studentId: validStudent.studentId,
          },
        ],
      }).success
    ).toBe(true);
  });

  it('rejects malformed rows', () => {
    const result = studentImportRequestSchema.safeParse({
      students: [{ ...validStudent, email: 'not-an-email', dateOfBirth: '15/05/2010' }],
    });

    expect(result.success).toBe(false);
  });

  it('rejects calendar dates that do not exist', () => {
    const result = studentImportRequestSchema.safeParse({
      students: [{ ...validStudent, dateOfBirth: '2010-02-31' }],
    });

    expect(result.success).toBe(false);
  });

  it('rejects invalid phone numbers from direct API callers', () => {
    const result = studentImportRequestSchema.safeParse({
      students: [{ ...validStudent, phone: 'abc', guardianPhone: '123' }],
    });

    expect(result.success).toBe(false);
  });

  it('accepts common Vietnamese international phone formatting', () => {
    const result = studentImportRequestSchema.safeParse({
      students: [{ ...validStudent, phone: '+84 901 234 567' }],
    });

    expect(result.success).toBe(true);
  });

  it('rejects duplicate email and student codes in one batch', () => {
    const result = studentImportRequestSchema.safeParse({
      students: [validStudent, { ...validStudent, firstName: 'Trần' }],
    });

    expect(result.success).toBe(false);
  });
});
