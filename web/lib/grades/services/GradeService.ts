import { apiFetch } from '@/lib/api/client';
import { StudentGradesPayload, SaveResult } from '../types';
import { validatePayload } from '../validation';

export class GradeService {
  /**
   * Save grades for a list of students
   */
  static async saveGrades(payload: StudentGradesPayload): Promise<SaveResult> {
    // Client-side validation
    const validation = validatePayload(payload);
    if (!validation.valid) {
      return {
        ok: false,
        error: validation.error,
        studentErrors: {}
      };
    }

    try {
      const res = await apiFetch('/api/grades/vietnamese-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({ error: res.statusText }));

      if (!res.ok) {
        return { 
          ok: false, 
          error: data.error || 'Failed to save grades', 
          studentErrors: {} 
        };
      }

      // Process failures if any
      const failures = data?.errors || data?.failedStudents || data?.failures || [];
      const studentErrors: Record<string, string> = {};
      
      if (Array.isArray(failures) && failures.length > 0) {
        for (const f of failures) {
          const sid = f.student_id || f.id || f.studentId;
          const msg = f.message || f.error || f.msg || 'Save failed';
          if (sid) studentErrors[sid] = msg;
        }
      }

      return { 
        ok: !!data?.success, 
        data, 
        studentErrors 
      };

    } catch (error) {
      console.error('GradeService.saveGrades error:', error);
      return {
        ok: false,
        error: 'Network error or internal server error',
        studentErrors: {}
      };
    }
  }

  /**
   * Fetch students with their grades
   */
  static async getStudentsWithGrades(classId: string, subjectCode: string, semester: string) {
    const params = new URLSearchParams({
      class_id: classId,
      subject_code: subjectCode,
      semester
    });

    try {
      const res = await apiFetch(`/api/grades/vietnamese-entry?${params.toString()}`);
      if (!res.ok) {
        throw new Error(await res.text() || 'Failed to fetch students');
      }
      return await res.json();
    } catch (error) {
      console.error('GradeService.getStudentsWithGrades error:', error);
      throw error;
    }
  }
}
