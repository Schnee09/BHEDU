/**
 * Enrollment Repository
 * 
 * Handles all database operations for student enrollments.
 * Follows Single Responsibility Principle - only data access, no business logic.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { BaseRepository, type PaginatedResult, type PaginationParams } from './index'

// ============================================
// Types
// ============================================

export interface Enrollment {
  id: string
  student_id: string
  class_id: string
  enrollment_date: string
  status: 'active' | 'inactive' | 'completed' | 'dropped'
  notes: string | null
  created_at: string
  updated_at: string
}

export interface EnrollmentWithDetails extends Enrollment {
  student?: {
    id: string
    first_name: string
    last_name: string
    full_name: string
    email: string
  } | null
  class?: {
    id: string
    name: string
    course_id: string | null
    teacher_id: string | null
  } | null
}

export interface EnrollmentFilters extends PaginationParams {
  student_id?: string
  class_id?: string
  status?: string
  from_date?: string
  to_date?: string
}

export interface CreateEnrollmentInput {
  student_id: string
  class_id: string
  enrollment_date?: string
  status?: 'active' | 'inactive'
  notes?: string | null
}

export interface UpdateEnrollmentInput {
  status?: 'active' | 'inactive' | 'completed' | 'dropped'
  notes?: string | null
}

export interface BulkEnrollInput {
  class_id: string
  student_ids: string[]
  enrollment_date?: string
}

// ============================================
// Repository Interface (for DIP)
// ============================================

export interface IEnrollmentRepository {
  findById(id: string): Promise<Enrollment | null>
  findByIdWithDetails(id: string): Promise<EnrollmentWithDetails | null>
  findAll(filters?: EnrollmentFilters): Promise<PaginatedResult<Enrollment>>
  findByStudent(studentId: string): Promise<EnrollmentWithDetails[]>
  findByClass(classId: string): Promise<EnrollmentWithDetails[]>
  findByStudentAndClass(studentId: string, classId: string): Promise<Enrollment | null>
  create(data: CreateEnrollmentInput): Promise<Enrollment>
  createBulk(data: BulkEnrollInput): Promise<Enrollment[]>
  update(id: string, data: UpdateEnrollmentInput): Promise<Enrollment>
  delete(id: string): Promise<void>
  isEnrolled(studentId: string, classId: string): Promise<boolean>
  getActiveEnrollmentCount(classId: string): Promise<number>
}

// ============================================
// Repository Implementation
// ============================================

export class EnrollmentRepository 
  extends BaseRepository<Enrollment, CreateEnrollmentInput, UpdateEnrollmentInput>
  implements IEnrollmentRepository {
  
  protected readonly tableName = 'enrollments'
  protected readonly primaryKey = 'id'

  constructor(supabase: SupabaseClient) {
    super(supabase)
  }

  /**
   * Find enrollment by ID with student and class details
   */
  async findByIdWithDetails(id: string): Promise<EnrollmentWithDetails | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        student:profiles!student_id (
          id,
          first_name,
          last_name,
          full_name,
          email
        ),
        class:classes (
          id,
          name,
          course_id,
          teacher_id
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Failed to find enrollment: ${error.message}`)
    }

    return data as EnrollmentWithDetails
  }

  /**
   * Find all enrollments with filters and pagination
   */
  async findAll(filters: EnrollmentFilters = {}): Promise<PaginatedResult<Enrollment>> {
    const page = filters.page || 1
    const pageSize = filters.pageSize || 50
    const start = (page - 1) * pageSize
    const end = start + pageSize - 1

    let query = this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact' })

    // Apply filters
    if (filters.student_id) {
      query = query.eq('student_id', filters.student_id)
    }

    if (filters.class_id) {
      query = query.eq('class_id', filters.class_id)
    }

    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.from_date) {
      query = query.gte('enrollment_date', filters.from_date)
    }

    if (filters.to_date) {
      query = query.lte('enrollment_date', filters.to_date)
    }

    const { data, error, count } = await query
      .range(start, end)
      .order('enrollment_date', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch enrollments: ${error.message}`)
    }

    return {
      data: (data || []) as Enrollment[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    }
  }

  /**
   * Find all enrollments for a student with class details
   */
  async findByStudent(studentId: string): Promise<EnrollmentWithDetails[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        class:classes (
          id,
          name,
          course_id,
          teacher_id
        )
      `)
      .eq('student_id', studentId)
      .order('enrollment_date', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch student enrollments: ${error.message}`)
    }

    return (data || []) as EnrollmentWithDetails[]
  }

  /**
   * Find all enrollments for a class with student details
   */
  async findByClass(classId: string): Promise<EnrollmentWithDetails[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        student:profiles!student_id (
          id,
          first_name,
          last_name,
          full_name,
          email
        )
      `)
      .eq('class_id', classId)
      .eq('status', 'active')
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch class enrollments: ${error.message}`)
    }

    return (data || []) as EnrollmentWithDetails[]
  }

  /**
   * Find enrollment by student and class
   */
  async findByStudentAndClass(studentId: string, classId: string): Promise<Enrollment | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('student_id', studentId)
      .eq('class_id', classId)
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to find enrollment: ${error.message}`)
    }

    return data as Enrollment | null
  }

  /**
   * Create enrollment with default date
   */
  async create(input: CreateEnrollmentInput): Promise<Enrollment> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert({
        ...input,
        enrollment_date: input.enrollment_date || new Date().toISOString().split('T')[0],
        status: input.status || 'active'
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create enrollment: ${error.message}`)
    }

    return data as Enrollment
  }

  /**
   * Bulk enroll students in a class
   */
  async createBulk(data: BulkEnrollInput): Promise<Enrollment[]> {
    const enrollmentDate = data.enrollment_date || new Date().toISOString().split('T')[0]
    
    const records = data.student_ids.map(studentId => ({
      student_id: studentId,
      class_id: data.class_id,
      enrollment_date: enrollmentDate,
      status: 'active' as const
    }))

    const { data: created, error } = await this.supabase
      .from(this.tableName)
      .upsert(records, {
        onConflict: 'student_id,class_id',
        ignoreDuplicates: true
      })
      .select()

    if (error) {
      throw new Error(`Failed to bulk enroll students: ${error.message}`)
    }

    return (created || []) as Enrollment[]
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
      .eq('status', 'active')

    if (error) {
      throw new Error(`Failed to check enrollment: ${error.message}`)
    }

    return (count || 0) > 0
  }

  /**
   * Get count of active enrollments in a class
   */
  async getActiveEnrollmentCount(classId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from(this.tableName)
      .select('id', { count: 'exact', head: true })
      .eq('class_id', classId)
      .eq('status', 'active')

    if (error) {
      throw new Error(`Failed to count enrollments: ${error.message}`)
    }

    return count || 0
  }
}
