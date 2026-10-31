import { getStudentImportOutcome } from '../studentImportResult';

describe('getStudentImportOutcome', () => {
  it('distinguishes successful, partial, and failed imports', () => {
    expect(getStudentImportOutcome({ total: 2, successCount: 2, errorCount: 0 })).toBe('success');
    expect(getStudentImportOutcome({ total: 2, successCount: 1, errorCount: 1 })).toBe('partial');
    expect(getStudentImportOutcome({ total: 2, successCount: 0, errorCount: 2 })).toBe('failed');
  });
});
