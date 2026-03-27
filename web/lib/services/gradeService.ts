/**
 * Grade Service - Student academic performance management
 *
 * Architecture v5.0 (Instance-based)
 * Consolidates Vietnamese education system (Midterm/Final) logic.
 */

import { createServiceClient } from '@/lib/supabase/server';
import { ConflictError, NotFoundError, ValidationError } from '@/lib/api/errors';
import type { SupabaseClient } from '@supabase/supabase-js';
import { calculateAverageGrade, EvaluationType, type Semester } from '@/lib/grades/types';

export interface GradeEntry {
  student_id: string;
  midterm?: number | null;
  final?: number | null;
  average?: number | null;
}

export interface SaveGradesInput {
  class_id: string;
  subject_code: string;
  semester: Semester;
  students: {
    student_id: string;
    grades: {
      [EvaluationType.MIDTERM]?: number | null;
      [EvaluationType.FINAL]?: number | null;
    };
  }[];
}

export class GradeService {
  private supabase: SupabaseClient;

  constructor(supabase?: SupabaseClient) {
    this.supabase = supabase || createServiceClient();
  }

  /**
   * Get grades for a class, subject, and semester
   */
  async getGrades(classId: string, subjectCode: string, semester: Semester) {
    // 1. Get subject ID from code
    const { data: subject } = await this.supabase
      .from('subjects')
      .select('id')
      .eq('code', subjectCode.toUpperCase())
      .single();

    if (!subject) {
      throw new NotFoundError(`Không tìm thấy môn học: ${subjectCode}`);
    }

    // 2. Get grades joined with profiles (and student_profiles for student_code)
    const { data, error } = await this.supabase
      .from('grades')
      .select(
        `
                student_id,
                component_type,
                score,
                student:profiles!student_id(
                    full_name,
                    student_profiles(student_code)
                )
            `
      )
      .eq('class_id', classId)
      .eq('subject_id', subject.id)
      .eq('semester', semester);

    if (error) throw error;

    // 3. Transform into row-based structure (one row per student)
    const studentMap = new Map<string, any>();

    (data || []).forEach((record: any) => {
      const student = Array.isArray(record.student) ? record.student[0] : record.student;
      if (!student) return;

      // Extract student_code from joined table
      const studentCode = student.student_profiles?.[0]?.student_code || student.student_code;

      if (!studentMap.has(record.student_id)) {
        studentMap.set(record.student_id, {
          student_id: record.student_id,
          full_name: student.full_name,
          student_code: studentCode,
          midterm: null,
          final: null,
          average: null,
        });
      }

      const row = studentMap.get(record.student_id);
      if (record.component_type === EvaluationType.MIDTERM) {
        row.midterm = record.score;
      } else if (record.component_type === EvaluationType.FINAL) {
        row.final = record.score;
      }

      row.average = calculateAverageGrade(row.midterm, row.final);
    });

    return Array.from(studentMap.values());
  }

  /**
   * Save grades in bulk
   */
  async saveGrades(input: SaveGradesInput) {
    const { class_id, subject_code, semester, students } = input;

    // 1. Get subject ID
    const { data: subject } = await this.supabase
      .from('subjects')
      .select('id')
      .eq('code', subject_code.toUpperCase())
      .single();

    if (!subject) {
      throw new NotFoundError(`Không tìm thấy môn học: ${subject_code}`);
    }

    const recordsToInsert = [];

    for (const s of students) {
      if (s.grades[EvaluationType.MIDTERM] !== undefined) {
        recordsToInsert.push({
          student_id: s.student_id,
          class_id,
          subject_id: subject.id,
          semester,
          component_type: EvaluationType.MIDTERM,
          score: s.grades[EvaluationType.MIDTERM],
        });
      }
      if (s.grades[EvaluationType.FINAL] !== undefined) {
        recordsToInsert.push({
          student_id: s.student_id,
          class_id,
          subject_id: subject.id,
          semester,
          component_type: EvaluationType.FINAL,
          score: s.grades[EvaluationType.FINAL],
        });
      }
    }

    if (recordsToInsert.length === 0) return { success: true, count: 0 };

    // 2. Upsert grades
    const { error } = await this.supabase.from('grades').upsert(recordsToInsert, {
      onConflict: 'student_id,class_id,subject_id,component_type,semester',
    });

    if (error) throw error;

    return { success: true, count: recordsToInsert.length };
  }

  /**
   * Get student transcript for an academic year (or all time)
   */
  async getStudentTranscript(studentId: string, academicYearId?: string) {
    const selectCols = academicYearId
      ? `
        score,
        component_type,
        semester,
        class:classes!inner(name),
        subject:subjects!subject_id(name, code)
      `
      : `
        score,
        component_type,
        semester,
        class:classes!class_id(name),
        subject:subjects!subject_id(name, code)
      `;

    let query = this.supabase.from('grades').select(selectCols).eq('student_id', studentId);

    if (academicYearId) {
      query = query.eq('class.academic_year_id', academicYearId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data;
  }

  // Static methods removed in favor of singleton instance usage.
}

export const gradeService = new GradeService();

// Legacy type exports for backward compatibility with assignment management system
// These reference the old assignment/category tables that may still exist
export interface AssignmentCategory {
  id: string;
  name: string;
  description?: string;
  weight: number;
  drop_lowest: number;
  class_id: string;
}

export interface Assignment {
  id: string;
  title: string;
  description?: string;
  category_id?: string;
  total_points: number;
  due_date?: string;
  assigned_date: string;
  published: boolean;
  class_id: string;
  category?: AssignmentCategory;
}
