/**
 * EnrollmentService
 * 
 * Manages student-class enrollment relationships.
 */

import { createServiceClient } from '@/lib/supabase/server';

export interface Enrollment {
  id: string;
  studentId: string;
  studentName?: string;
  studentCode?: string;
  classId: string;
  className?: string;
  enrolledAt: string;
  status?: string;
}

export interface CreateEnrollmentInput {
  studentId: string;
  classId: string;
}

export interface EnrollmentListOptions {
  studentId?: string;
  classId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface EnrollmentListResult {
  enrollments: Enrollment[];
  total: number;
  page: number;
  limit: number;
}

export class EnrollmentService {
  private supabase;

  constructor() {
    this.supabase = createServiceClient();
  }

  /**
   * Get enrollments with optional filters
   */
  async getEnrollments(options: EnrollmentListOptions = {}): Promise<EnrollmentListResult> {
    const {
      studentId,
      classId,
      search,
      page = 1,
      limit = 50,
    } = options;

    let query = this.supabase
      .from('enrollments')
      .select(`
        id,
        student_id,
        class_id,
        enrolled_at,
        status,
        student:student_id(id, full_name, student_id),
        class:class_id(id, name)
      `, { count: 'exact' });

    if (studentId) {
      query = query.eq('student_id', studentId);
    }
    if (classId) {
      query = query.eq('class_id', classId);
    }

    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1).order('enrolled_at', { ascending: false });

    const { data, count, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch enrollments: ${error.message}`);
    }

    // Filter by search if provided (search student name)
    let filtered = data || [];
    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter((e: any) => 
        e.student?.full_name?.toLowerCase().includes(lowerSearch) ||
        e.student?.student_id?.toLowerCase().includes(lowerSearch)
      );
    }

    const enrollments: Enrollment[] = filtered.map((e: any) => ({
      id: e.id,
      studentId: e.student_id,
      studentName: e.student?.full_name,
      studentCode: e.student?.student_id,
      classId: e.class_id,
      className: e.class?.name,
      enrolledAt: e.enrolled_at,
      status: e.status,
    }));

    return {
      enrollments,
      total: count || 0,
      page,
      limit,
    };
  }

  /**
   * Enroll a student in a class
   */
  async createEnrollment(input: CreateEnrollmentInput): Promise<Enrollment> {
    const { studentId, classId } = input;

    // Check if already enrolled
    const { data: existing } = await this.supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', studentId)
      .eq('class_id', classId)
      .single();

    if (existing) {
      throw new Error('Học sinh đã được ghi danh vào lớp này');
    }

    const { data, error } = await this.supabase
      .from('enrollments')
      .insert({
        student_id: studentId,
        class_id: classId,
        enrolled_at: new Date().toISOString(),
      })
      .select(`
        id,
        student_id,
        class_id,
        enrolled_at,
        student:student_id(full_name, student_id),
        class:class_id(name)
      `)
      .single();

    if (error) {
      throw new Error(`Failed to create enrollment: ${error.message}`);
    }

    return {
      id: data.id,
      studentId: data.student_id,
      studentName: data.student?.full_name,
      studentCode: data.student?.student_id,
      classId: data.class_id,
      className: data.class?.name,
      enrolledAt: data.enrolled_at,
    };
  }

  /**
   * Bulk enroll students in a class
   */
  async bulkEnroll(classId: string, studentIds: string[]): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const studentId of studentIds) {
      try {
        await this.createEnrollment({ studentId, classId });
        success++;
      } catch (error: any) {
        failed++;
        errors.push(`${studentId}: ${error.message}`);
      }
    }

    return { success, failed, errors };
  }

  /**
   * Remove enrollment
   */
  async deleteEnrollment(enrollmentId: string): Promise<void> {
    const { error } = await this.supabase
      .from('enrollments')
      .delete()
      .eq('id', enrollmentId);

    if (error) {
      throw new Error(`Failed to delete enrollment: ${error.message}`);
    }
  }

  /**
   * Remove student from class
   */
  async removeStudentFromClass(studentId: string, classId: string): Promise<void> {
    const { error } = await this.supabase
      .from('enrollments')
      .delete()
      .eq('student_id', studentId)
      .eq('class_id', classId);

    if (error) {
      throw new Error(`Failed to remove student from class: ${error.message}`);
    }
  }

  /**
   * Transfer student to another class
   */
  async transferStudent(studentId: string, fromClassId: string, toClassId: string): Promise<Enrollment> {
    // Remove from old class
    await this.removeStudentFromClass(studentId, fromClassId);
    
    // Add to new class
    return this.createEnrollment({ studentId, classId: toClassId });
  }

  /**
   * Get class student count
   */
  async getClassStudentCount(classId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('class_id', classId);

    if (error) {
      throw new Error(`Failed to count students: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * Get student's classes
   */
  async getStudentClasses(studentId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('enrollments')
      .select(`
        id,
        enrolled_at,
        class:class_id(id, name, teacher_id, teacher:teacher_id(full_name))
      `)
      .eq('student_id', studentId);

    if (error) {
      throw new Error(`Failed to fetch student classes: ${error.message}`);
    }

    return (data || []).map((e: any) => ({
      enrollmentId: e.id,
      enrolledAt: e.enrolled_at,
      classId: e.class?.id,
      className: e.class?.name,
      teacherName: e.class?.teacher?.full_name,
    }));
  }
}
