export interface StudentImportResultSummary {
  total: number;
  successCount: number;
  errorCount: number;
  warningCount?: number;
}

export type StudentImportOutcome = 'success' | 'partial' | 'failed';

export function getStudentImportOutcome(result: StudentImportResultSummary): StudentImportOutcome {
  if (result.errorCount === 0) return 'success';
  if (result.successCount > 0) return 'partial';
  return 'failed';
}
