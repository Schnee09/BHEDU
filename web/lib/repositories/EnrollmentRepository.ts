/**
 * Enrollment Repository
 *
 * Handles all database operations for student enrollments.
 * Follows Single Responsibility Principle - only data access, no business logic.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { BaseRepository, type PaginatedResult, type PaginationParams } from './base';

// ============================================
// Types
// ============================================

import type {
  BulkEnrollmentInput as BulkEnrollInput,
  CreateEnrollmentInput,
  EnrollmentQueryInput,
  UpdateEnrollmentInput,
} from '@/lib/schemas';

export type EnrollmentFilters = EnrollmentQueryInput;

import type { EnrollmentResponse } from '@/lib/schemas/responses/enrollment';

// Alias for backwards compatibility if needed, or prefer using the imported types directly
export type Enrollment = EnrollmentResponse;
export type EnrollmentWithDetails = EnrollmentResponse;

// ============================================
// Repository Interface (for DIP)
// ============================================

export interface IEnrollmentRepository {
  findById(id: string): Promise<Enrollment | null>;
  findByIdWithDetails(id: string): Promise<EnrollmentWithDetails | null>;
  findAll(filters?: EnrollmentFilters): Promise<PaginatedResult<Enrollment>>;
  findByStudent(studentId: string): Promise<EnrollmentWithDetails[]>;
  findByClass(classId: string): Promise<EnrollmentWithDetails[]>;
  findByStudentAndClass(studentId: string, classId: string): Promise<Enrollment | null>;
  create(data: CreateEnrollmentInput): Promise<Enrollment>;
  createBulk(data: BulkEnrollInput): Promise<Enrollment[]>;
  update(id: string, data: UpdateEnrollmentInput): Promise<Enrollment>;
  delete(id: string): Promise<void>;
  isEnrolled(studentId: string, classId: string): Promise<boolean>;
  getEnrolledCount(classId: string): Promise<number>;
}

// ============================================
// Repository Implementation
// ============================================

export class EnrollmentRepository
  extends BaseRepository<Enrollment, CreateEnrollmentInput, UpdateEnrollmentInput>
  implements IEnrollmentRepository
{
  protected override readonly tableName = 'enrollments';
  protected override readonly primaryKey = 'id';
  protected override readonly useSoftDelete = true;

  constructor(supabase: SupabaseClient) {
    super(supabase);
  }

  /**
   * Find enrollment by ID with student and class details
   */
  async findByIdWithDetails(id: string): Promise<EnrollmentWithDetails | null> {
    // 1. Fetch base enrollment
    let enrollmentQuery = this.supabase.from(this.tableName).select('*').eq('id', id);

    if (this.useSoftDelete && typeof (enrollmentQuery as any).is === 'function') {
      enrollmentQuery = enrollmentQuery.is('deleted_at', null);
    }

    const { data: enrollment, error } = await (typeof (enrollmentQuery as any).maybeSingle ===
    'function'
      ? (enrollmentQuery as any).maybeSingle()
      : (enrollmentQuery as any).single());

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to find enrollment: ${error.message}`);
    }

    if (!enrollment) return null;

    const enr = enrollment as Enrollment;

    // 2. Fetch related details in parallel
    let studentQuery = this.supabase
      .from('profiles')
      .select('id, first_name, last_name, full_name, email')
      .eq('id', enr.student_id);

    if (typeof (studentQuery as any).is === 'function') {
      studentQuery = (studentQuery as any).is('deleted_at', null);
    }

    let classQuery = this.supabase
      .from('classes')
      .select('id, name, subject_id, teacher_id')
      .eq('id', enr.class_id);

    if (typeof (classQuery as any).is === 'function') {
      classQuery = (classQuery as any).is('deleted_at', null);
    }

    const [studentResult, classResult] = await Promise.all([
      typeof (studentQuery as any).maybeSingle === 'function'
        ? (studentQuery as any).maybeSingle()
        : (studentQuery as any).single(),
      typeof (classQuery as any).maybeSingle === 'function'
        ? (classQuery as any).maybeSingle()
        : (classQuery as any).single(),
    ]);

    return {
      ...enr,
      student: studentResult.data || null,
      class: classResult.data || null,
    } as EnrollmentWithDetails;
  }

  /**
   * Find all enrollments with filters and pagination
   */
  async findAll(filters: Partial<EnrollmentFilters> = {}): Promise<PaginatedResult<Enrollment>> {
    const page = filters.page || 1;
    const pageSize = filters.limit || 50;
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;

    let query = this.supabase.from(this.tableName).select('*', { count: 'exact' });

    if (this.useSoftDelete) {
      query = query.is('deleted_at', null);
    }

    // Apply filters
    if (filters.student_id) {
      query = query.eq('student_id', filters.student_id);
    }

    if (filters.class_id) {
      query = query.eq('class_id', filters.class_id);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.from_date) {
      query = query.gte('enrollment_date', filters.from_date);
    }

    if (filters.to_date) {
      query = query.lte('enrollment_date', filters.to_date);
    }

    const { data, error, count } = await query
      .range(start, end)
      .order('enrollment_date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch enrollments: ${error.message}`);
    }

    return {
      data: (data || []) as Enrollment[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }

  /**
   * Find all enrollments for a student with detailed class and teacher info
   */
  async findByStudent(studentId: string): Promise<EnrollmentWithDetails[]> {
    let query = this.supabase
      .from(this.tableName)
      .select(
        `
        *,
        class:classes (
          id,
          name,
          schedule,
          subject_id,
          teacher_id,
          teacher:profiles!classes_teacher_id_fkey (
            id,
            full_name
          )
        )
      `
      )
      .eq('student_id', studentId);

    if (this.useSoftDelete && typeof (query as any).is === 'function') {
      query = query.is('deleted_at', null);
    }

    const { data, error } = await query.order('enrollment_date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch student enrollments: ${error.message}`);
    }

    return (data || []) as EnrollmentWithDetails[];
  }

  /**
   * Find all enrollments for a class with student details
   */
  async findByClass(classId: string): Promise<EnrollmentWithDetails[]> {
    let query = this.supabase
      .from(this.tableName)
      .select(
        `
        *,
        student:profiles!student_id (
          id,
          first_name,
          last_name,
          full_name,
          email
        )
      `
      )
      .eq('class_id', classId)
      .eq('status', 'enrolled');

    if (this.useSoftDelete && typeof (query as any).is === 'function') {
      query = query.is('deleted_at', null);
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch class enrollments: ${error.message}`);
    }

    return (data || []) as EnrollmentWithDetails[];
  }

  /**
   * Find enrollment by student and class
   */
  async findByStudentAndClass(studentId: string, classId: string): Promise<Enrollment | null> {
    let query = this.supabase
      .from(this.tableName)
      .select('*')
      .eq('student_id', studentId)
      .eq('class_id', classId);

    if (this.useSoftDelete && typeof (query as any).is === 'function') {
      query = query.is('deleted_at', null);
    }

    const { data, error } = await (typeof (query as any).maybeSingle === 'function'
      ? (query as any).maybeSingle()
      : (query as any).single());

    if (error) {
      throw new Error(`Failed to find enrollment: ${error.message}`);
    }

    return data as Enrollment | null;
  }

  /**
   * Create enrollment with default date
   */
  async create(input: CreateEnrollmentInput): Promise<Enrollment> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .upsert(
        {
          ...input,
          enrollment_date: input.enrollment_date || new Date().toISOString().split('T')[0],
          status: (input.status as any) || 'enrolled',
        },
        {
          onConflict: 'student_id,class_id',
        }
      )
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create enrollment: ${error.message}`);
    }

    return data as Enrollment;
  }

  /**
   * Bulk enroll students in a class
   */
  async createBulk(data: BulkEnrollInput): Promise<Enrollment[]> {
    const enrollmentDate = data.enrollment_date || new Date().toISOString().split('T')[0];

    const records = data.student_ids.map((studentId) => ({
      student_id: studentId,
      class_id: data.class_id,
      enrollment_date: enrollmentDate,
      status: 'enrolled',
    }));

    const { data: created, error } = await this.supabase
      .from(this.tableName)
      .upsert(records, {
        onConflict: 'student_id,class_id',
      })
      .select();

    if (error) {
      throw new Error(`Failed to bulk enroll students: ${error.message}`);
    }

    return (created || []) as Enrollment[];
  }

  /**
   * Check if student is enrolled in a class
   */
  async isEnrolled(studentId: string, classId: string): Promise<boolean> {
    const { count, error } = await this.supabase
      .from(this.tableName)
      .select('id', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .eq('class_id', classId)
      .eq('status', 'enrolled');

    if (error) {
      throw new Error(`Failed to check enrollment: ${error.message}`);
    }

    return (count || 0) > 0;
  }

  /**
   * Get count of enrolled students in a class
   */
  async getEnrolledCount(classId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from(this.tableName)
      .select('id', { count: 'exact', head: true })
      .eq('class_id', classId)
      .eq('status', 'enrolled');

    if (error) {
      throw new Error(`Failed to count enrollments: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * Transfer student from one class to another
   */
  async transferStudent(
    studentId: string,
    fromClassId: string,
    toClassId: string
  ): Promise<Enrollment> {
    // 1. Find the existing enrollment ID
    const enrollment = await this.findByStudentAndClass(studentId, fromClassId);
    if (!enrollment) {
      throw new Error('Student is not enrolled in the source class');
    }

    // 2. Perform the transfer (delete existing and create new)
    // Note: We don't have atomic transactions in Supabase client easily,
    // so we'll do them sequentially.
    await this.delete(enrollment.id);

    return await this.create({
      student_id: studentId,
      class_id: toClassId,
      status: 'enrolled',
    });
  }
}
