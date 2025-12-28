import { apiFetch } from '@/lib/api/client';

export interface StudentGradesPayload {
  class_id: string;
  subject_code: string;
  semester: string;
  students: Array<{ student_id: string; grades: Record<string, number | null> }>;
}

export interface SaveResult {
  ok: boolean;
  data: any;
  studentErrors: Record<string, string>;
}

export async function performVietnameseSave(payload: StudentGradesPayload): Promise<SaveResult> {
  const res = await apiFetch('/api/grades/vietnamese-entry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const safeParseJson = async (r: Response) => { try { return await r.json() } catch { return { error: r.statusText || `HTTP ${r.status}` } } };
  if (!res.ok) {
    const err = await safeParseJson(res);
    return { ok: false, data: err, studentErrors: {} };
  }
  const data = await safeParseJson(res);
  const failures = data?.errors || data?.failedStudents || data?.failures || [];
  const studentErrors: Record<string, string> = {};
  if (Array.isArray(failures) && failures.length > 0) {
    for (const f of failures) {
      const sid = (f as any).student_id || (f as any).id || (f as any).studentId;
      if (!sid) continue;
      const msg = (f as any).message || (f as any).error || (f as any).msg || 'Failed to save for this student';
      studentErrors[sid] = msg;
    }
  }
  return { ok: !!data?.success, data, studentErrors };
}
