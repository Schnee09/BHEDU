/**
 * StudentService
 * Centralized service layer for student data access
 * Encapsulates business logic and database queries
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { Student, StudentQueryParams, StudentListResult } from '../types';

const STUDENT_SELECT_FIELDS = `
  id, user_id, email, full_name, role, phone, address, 
  date_of_birth, student_code, grade_level, gender, status, 
  is_active, photo_url, enrollment_date, notes, created_at, updated_at
`;

export class StudentService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get all students (for admin/staff)
   */
  async getAllStudents(params: StudentQueryParams = {}): Promise<StudentListResult> {
    const { search = '', page = 1, limit = 50, status } = params;
    const offset = (page - 1) * limit;

    let countQuery = this.supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'student');

    let dataQuery = this.supabase
      .from('profiles')
      .select(STUDENT_SELECT_FIELDS)
      .eq('role', 'student')
      .order('full_name', { ascending: true });

    if (status) {
      countQuery = countQuery.eq('status', status);
      dataQuery = dataQuery.eq('status', status);
    }

    if (search) {
      const searchFilter = `full_name.ilike.%${search}%,email.ilike.%${search}%`;
      countQuery = countQuery.or(searchFilter);
      dataQuery = dataQuery.or(searchFilter);
    }

    const { count, error: countError } = await countQuery;
    if (countError) throw countError;

    const { data, error: dataError } = await dataQuery.range(offset, offset + limit - 1);
    if (dataError) throw dataError;

    return {
      students: (data || []) as Student[],
      total: count || 0,
      statistics: null,
    };
  }

  /**
   * Get students for a specific teacher (by their classes)
   * Note: teacherProfileId is already the profile.id from teacherAuth
   */
  async getStudentsForTeacher(
    teacherProfileId: string,
    params: StudentQueryParams = {}
  ): Promise<StudentListResult> {
    const { search = '', page = 1, limit = 50 } = params;
    const offset = (page - 1) * limit;

    // teacherProfileId is already profile.id from teacherAuth, no need to lookup

    // Get teacher's classes directly using profile.id
    const { data: classRows, error: classErr } = await this.supabase
      .from('classes')
      .select('id')
      .eq('teacher_id', teacherProfileId);

    if (classErr || !classRows || classRows.length === 0) {
      return { students: [], total: 0, statistics: null };
    }

    const classIds = classRows.map((c) => c.id);

    // Get active enrollments
    const { data: enrollments, error: enrollErr } = await this.supabase
      .from('enrollments')
      .select('student_id')
      .in('class_id', classIds)
      .eq('status', 'active');

    if (enrollErr || !enrollments || enrollments.length === 0) {
      return { students: [], total: 0, statistics: null };
    }

    const studentIds = Array.from(new Set(enrollments.map((e) => e.student_id)));

    let countQuery = this.supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'student')
      .in('id', studentIds);

    let dataQuery = this.supabase
      .from('profiles')
      .select(STUDENT_SELECT_FIELDS)
      .eq('role', 'student')
      .in('id', studentIds)
      .order('full_name', { ascending: true });

    // Apply filters
    if (params.status) {
      countQuery = countQuery.eq('status', params.status);
      dataQuery = dataQuery.eq('status', params.status);
    }

    if (params.grade_level) {
      countQuery = countQuery.eq('grade_level', params.grade_level);
      dataQuery = dataQuery.eq('grade_level', params.grade_level);
    }

    if (params.gender) {
      countQuery = countQuery.eq('gender', params.gender);
      dataQuery = dataQuery.eq('gender', params.gender);
    }

    if (search) {
      const searchFilter = `full_name.ilike.%${search}%,email.ilike.%${search}%`;
      countQuery = countQuery.or(searchFilter);
      dataQuery = dataQuery.or(searchFilter);
    }

    const { count, error: countError } = await countQuery;
    if (countError) throw countError;

    const { data, error: dataError } = await dataQuery.range(offset, offset + limit - 1);
    if (dataError) throw dataError;

    return {
      students: (data || []) as Student[],
      total: count || 0,
      statistics: null,
    };
  }

  /**
   * Get a single student by ID
   */
  async getStudentById(studentId: string): Promise<Student | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select(STUDENT_SELECT_FIELDS)
      .eq('id', studentId)
      .eq('role', 'student')
      .maybeSingle();

    if (error) throw error;
    return data as Student | null;
  }
}
