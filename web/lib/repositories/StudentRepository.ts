/**
 * Student Repository
 *
 * Handles all database operations for students.
 * Follows Single Responsibility Principle - only data access, no business logic.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { BaseRepository, type PaginatedResult, type PaginationParams } from './base';
import { splitFullName, formatVietnameseName } from '@/lib/utils/names';

// ============================================
// Types
// ============================================

export interface Student {
  id: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
  emergency_contact: string | null;
  grade_level: string | null;
  status: 'active' | 'inactive' | 'graduated' | 'suspended' | 'transferred';
  role: 'student';
  student_id: string | null;
  student_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentWithEnrollments extends Student {
  enrollments: Array<{
    id: string;
    class_id: string;
    enrollment_date: string;
    status: string;
    classes: {
      id: string;
      name: string;
      subject_id: string | null;
    };
  }>;
}

export interface StudentFilters extends PaginationParams {
  search?: string;
  status?: string;
  grade_level?: string;
  gender?: string;
  class_id?: string;
}

export interface CreateStudentInput {
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string;
  email?: string | null;
  phone?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  address?: string | null;
  emergency_contact?: string | null;
  grade_level?: string | null;
  student_id?: string | null;
  student_code?: string | null;
  status?: 'active' | 'inactive' | 'suspended';
}

export interface UpdateStudentInput {
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string;
  email?: string | null;
  phone?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  address?: string | null;
  emergency_contact?: string | null;
  grade_level?: string | null;
  student_id?: string | null;
  student_code?: string | null;
  status?: 'active' | 'inactive' | 'graduated' | 'suspended' | 'transferred';
}

// ============================================
// Repository Interface (for DIP)
// ============================================

export interface IStudentRepository {
  findById(id: string): Promise<Student | null>;
  findByIdWithEnrollments(id: string): Promise<StudentWithEnrollments | null>;
  findAll(filters?: StudentFilters): Promise<PaginatedResult<Student>>;
  findByTeacher(teacherId: string, filters?: StudentFilters): Promise<PaginatedResult<Student>>;
  create(data: CreateStudentInput): Promise<Student>;
  update(id: string, data: UpdateStudentInput): Promise<Student>;
  delete(id: string): Promise<void>;
  softDelete(id: string): Promise<void>;
  countByStatus(): Promise<Record<string, number>>;
  bulkArchive(ids: string[]): Promise<void>;
}

// ============================================
// Repository Implementation
// ============================================

export class StudentRepository
  extends BaseRepository<Student, CreateStudentInput, UpdateStudentInput>
  implements IStudentRepository
{
  protected override readonly tableName = 'profiles';
  protected override readonly primaryKey = 'id';
  protected override readonly useSoftDelete = true;

  constructor(supabase: SupabaseClient) {
    super(supabase);
  }

  /**
   * Find student by ID with enrollments
   */
  async findByIdWithEnrollments(id: string): Promise<StudentWithEnrollments | null> {
    // 1. Fetch student profile
    let studentQuery = this.supabase
      .from(this.tableName)
      .select(
        `
        id,
        user_id,
        first_name,
        last_name,
        full_name,
        email,
        phone,
        date_of_birth,
        gender,
        address,
        emergency_contact,
        grade_level,
        status,
        role,
        created_at,
        updated_at,
        student_code,
        student_id
      `
      )
      .eq('id', id)
      .eq('role', 'student');

    if (this.useSoftDelete && typeof (studentQuery as any).is === 'function') {
      studentQuery = (studentQuery as any).is('deleted_at', null);
    }

    // 2. Fetch enrollments with class details (Parallel)
    let enrollmentsQuery = this.supabase
      .from('enrollments')
      .select(
        `
        id,
        class_id,
        enrollment_date,
        status,
        classes!inner(
          id,
          name,
          subject_id
        )
      `
      )
      .eq('student_id', id);

    if (this.useSoftDelete && typeof (enrollmentsQuery as any).is === 'function') {
      enrollmentsQuery = (enrollmentsQuery as any).is('deleted_at', null);
    }

    const [studentResult, enrollmentsResult] = await Promise.all([
      typeof (studentQuery as any).maybeSingle === 'function'
        ? (studentQuery as any).maybeSingle()
        : (studentQuery as any).single(),
      enrollmentsQuery,
    ]);

    if (studentResult.error) {
      if (studentResult.error.code === 'PGRST116' || !studentResult.data) return null;
      throw new Error(`Failed to find student: ${studentResult.error.message}`);
    }

    const rawStudent = studentResult.data as any;
    let studentFullName = rawStudent.full_name;
    if (
      !studentFullName ||
      studentFullName.trim() === '' ||
      studentFullName === 'undefined undefined' ||
      studentFullName === 'null null'
    ) {
      const parts = [rawStudent.last_name, rawStudent.first_name].filter(
        (p: any) => p && p !== 'undefined' && p !== 'null'
      );
      studentFullName =
        parts.length > 0
          ? parts.join(' ')
          : rawStudent.email
            ? rawStudent.email.split('@')[0]
            : 'Học sinh';
    }

    const student = {
      ...rawStudent,
      full_name: studentFullName,
    } as Student;

    const enrollments = (enrollmentsResult.data || []).map((e: any) => ({
      ...e,
      classes: Array.isArray(e.classes) ? e.classes[0] : e.classes,
    }));

    return {
      ...student,
      enrollments,
    } as StudentWithEnrollments;
  }

  /**
   * Find all students with pagination and basic filters
   */
  async findAll(filters: StudentFilters = {}): Promise<PaginatedResult<Student>> {
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;

    let query = this.supabase
      .from(this.tableName)
      .select(
        `
        id,
        user_id,
        first_name,
        last_name,
        full_name,
        email,
        phone,
        date_of_birth,
        gender,
        address,
        emergency_contact,
        grade_level,
        status,
        role,
        created_at,
        updated_at,
        student_code,
        student_id
      `,
        { count: 'exact' }
      )
      .eq('role', 'student');

    if (this.useSoftDelete && typeof (query as any).is === 'function') {
      query = query.is('deleted_at', null);
    }

    // Apply filters
    if (filters.search) {
      query = query.or(
        `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,student_code.ilike.%${filters.search}%,student_id.ilike.%${filters.search}%`
      );
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.grade_level) {
      query = query.eq('grade_level', filters.grade_level);
    }

    if (filters.gender) {
      query = query.eq('gender', filters.gender);
    }

    const { data, error, count } = await query
      .range(start, end)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch students: ${error.message}`);
    }

    const flattenedData = (data || []).map((item: any) => {
      let fullName = item.full_name;
      if (
        !fullName ||
        fullName.trim() === '' ||
        fullName === 'undefined undefined' ||
        fullName === 'null null'
      ) {
        const parts = [item.last_name, item.first_name].filter(
          (p: any) => p && p !== 'undefined' && p !== 'null'
        );
        fullName =
          parts.length > 0 ? parts.join(' ') : item.email ? item.email.split('@')[0] : 'Học sinh';
      }
      return {
        ...item,
        full_name: fullName,
      };
    }) as Student[];

    return {
      data: flattenedData,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }

  /**
   * Find students for a specific teacher (via class assignments)
   */
  async findByTeacher(
    teacherId: string,
    filters: StudentFilters = {}
  ): Promise<PaginatedResult<Student>> {
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;

    let query = this.supabase
      .from(this.tableName)
      .select(
        `
        id,
        user_id,
        first_name,
        last_name,
        full_name,
        email,
        phone,
        date_of_birth,
        gender,
        address,
        emergency_contact,
        grade_level,
        status,
        role,
        created_at,
        updated_at,
        student_code,
        student_id,
        enrollments!inner(
          status,
          class_id,
          classes!inner(
            teacher_id
          )
        )
      `,
        { count: 'exact' }
      )
      .eq('role', 'student')
      .eq('enrollments.status', 'enrolled')
      .eq('enrollments.classes.teacher_id', teacherId);

    if (this.useSoftDelete && typeof (query as any).is === 'function') {
      query = query.is('deleted_at', null);
    }

    // Apply filters
    if (filters.search) {
      query = query.or(
        `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
      );
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error, count } = await query
      .range(start, end)
      .order('last_name', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch teacher's students: ${error.message}`);
    }

    // Remove the nested enrollment data from the result to match the Student type
    const cleanedData = (data || []).map((s: any) => {
      const { enrollments, ...rest } = s;
      return rest;
    }) as Student[];

    return {
      data: cleanedData,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }

  /**
   * Create student with computed full_name
   */
  async create(input: CreateStudentInput): Promise<Student> {
    const fullName = input.full_name || formatVietnameseName(input.first_name, input.last_name);

    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert({
        ...input,
        full_name: fullName,
        role: 'student',
        status: input.status || 'active',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create student: ${error.message}`);
    }

    return data as Student;
  }

  /**
   * Update student with recomputed full_name if names change
   */
  async update(id: string, input: UpdateStudentInput): Promise<Student> {
    const anyInput = input as any;
    const updates: Record<string, unknown> = {};

    // 1. If full_name is provided, compute first_name and last_name
    if (anyInput.full_name) {
      const parts = splitFullName(anyInput.full_name);
      updates.first_name = input.first_name || parts.first_name;
      updates.last_name = input.last_name || parts.last_name;
      updates.full_name = anyInput.full_name.trim();
    } else if (input.first_name || input.last_name) {
      const existing = await this.findById(id);
      if (existing) {
        const firstName = input.first_name || existing.first_name;
        const lastName = input.last_name || existing.last_name;
        updates.full_name = formatVietnameseName(firstName, lastName);
      }
    }

    // 2. Profile table fields
    if (input.email !== undefined) updates.email = input.email;
    if (input.phone !== undefined) updates.phone = input.phone;
    if (input.address !== undefined) updates.address = input.address;
    if (input.date_of_birth !== undefined) updates.date_of_birth = input.date_of_birth;
    if (input.gender !== undefined) updates.gender = input.gender;
    if (input.status !== undefined) {
      updates.status = input.status;
      updates.is_active = input.status === 'active';
    }
    if (anyInput.is_active !== undefined) updates.is_active = anyInput.is_active;

    let updatedRecord: any = null;

    if (Object.keys(updates).length > 0) {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) {
        throw new Error(`Failed to update student: ${error.message}`);
      }
      updatedRecord = data;
    }

    if (!updatedRecord) {
      updatedRecord = await this.findById(id);
    }

    // 3. Sync student_profiles if student_code or grade_level was updated
    if (anyInput.student_code !== undefined || anyInput.grade_level !== undefined) {
      const studentProfilePayload: Record<string, any> = { profile_id: id };
      if (anyInput.student_code !== undefined)
        studentProfilePayload.student_code = anyInput.student_code;
      if (anyInput.grade_level !== undefined)
        studentProfilePayload.grade_level = anyInput.grade_level;

      await this.supabase
        .from('student_profiles')
        .upsert(studentProfilePayload, { onConflict: 'profile_id' });
    }

    return (updatedRecord || { id, ...input }) as Student;
  }

  /**
   * Soft delete - set status to inactive
   */
  async softDelete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .update({ status: 'inactive' })
      .eq('id', id)
      .eq('role', 'student');

    if (error) {
      throw new Error(`Failed to soft delete student: ${error.message}`);
    }
  }

  /**
   * Get student count by status for statistics
   */
  async countByStatus(): Promise<Record<string, number>> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('status')
      .eq('role', 'student');

    if (error) {
      throw new Error(`Failed to count students: ${error.message}`);
    }

    // Better aggregation using reduce to avoid multiple iterations
    return (data || []).reduce((acc: Record<string, number>, row: any) => {
      const status = row.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Bulk archive students
   */
  async bulkArchive(ids: string[]): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .update({ status: 'inactive' }) // Assuming 'inactive' is the correct status value
      .in('id', ids)
      .eq('role', 'student');

    if (error) {
      throw new Error(`Failed to bulk archive students: ${error.message}`);
    }
  }
}
