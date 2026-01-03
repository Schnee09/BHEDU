/**
 * Student Repository
 * 
 * Handles all database operations for students.
 * Follows Single Responsibility Principle - only data access, no business logic.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { BaseRepository, type PaginatedResult, type PaginationParams } from './index'

// ============================================
// Types
// ============================================

export interface Student {
  id: string
  user_id: string | null
  first_name: string
  last_name: string
  full_name: string
  email: string
  phone: string | null
  date_of_birth: string | null
  gender: string | null
  address: string | null
  emergency_contact: string | null
  grade_level: string | null
  status: 'active' | 'inactive' | 'graduated' | 'transferred'
  role: 'student'
  created_at: string
  updated_at: string
}

export interface StudentWithEnrollments extends Student {
  enrollments: Array<{
    id: string
    class_id: string
    enrollment_date: string
    status: string
    classes: {
      id: string
      name: string
      course_id: string | null
    }
  }>
}

export interface StudentFilters extends PaginationParams {
  search?: string
  status?: string
  grade_level?: string
  gender?: string
  class_id?: string
}

export interface CreateStudentInput {
  first_name: string
  last_name: string
  email: string
  phone?: string | null
  date_of_birth?: string | null
  gender?: string | null
  address?: string | null
  emergency_contact?: string | null
  grade_level?: string | null
  status?: 'active' | 'inactive'
}

export interface UpdateStudentInput {
  first_name?: string
  last_name?: string
  email?: string
  phone?: string | null
  date_of_birth?: string | null
  gender?: string | null
  address?: string | null
  emergency_contact?: string | null
  grade_level?: string | null
  status?: 'active' | 'inactive' | 'graduated' | 'transferred'
}

// ============================================
// Repository Interface (for DIP)
// ============================================

export interface IStudentRepository {
  findById(id: string): Promise<Student | null>
  findByIdWithEnrollments(id: string): Promise<StudentWithEnrollments | null>
  findAll(filters?: StudentFilters): Promise<PaginatedResult<Student>>
  findByTeacher(teacherId: string, filters?: StudentFilters): Promise<PaginatedResult<Student>>
  create(data: CreateStudentInput): Promise<Student>
  update(id: string, data: UpdateStudentInput): Promise<Student>
  delete(id: string): Promise<void>
  softDelete(id: string): Promise<void>
  countByStatus(): Promise<Record<string, number>>
}

// ============================================
// Repository Implementation
// ============================================

export class StudentRepository 
  extends BaseRepository<Student, CreateStudentInput, UpdateStudentInput>
  implements IStudentRepository {
  
  protected readonly tableName = 'profiles'
  protected readonly primaryKey = 'id'

  constructor(supabase: SupabaseClient) {
    super(supabase)
  }

  /**
   * Find student by ID with enrollments
   */
  async findByIdWithEnrollments(id: string): Promise<StudentWithEnrollments | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        enrollments (
          id,
          class_id,
          enrollment_date,
          status,
          classes (
            id,
            name,
            course_id
          )
        )
      `)
      .eq('id', id)
      .eq('role', 'student')
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Failed to find student: ${error.message}`)
    }

    return data as StudentWithEnrollments
  }

  /**
   * Find all students with filters and pagination
   */
  async findAll(filters: StudentFilters = {}): Promise<PaginatedResult<Student>> {
    const page = filters.page || 1
    const pageSize = filters.pageSize || 20
    const start = (page - 1) * pageSize
    const end = start + pageSize - 1

    let query = this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact' })
      .eq('role', 'student')

    // Apply filters
    if (filters.search) {
      query = query.or(
        `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
      )
    }

    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.grade_level) {
      query = query.eq('grade_level', filters.grade_level)
    }

    if (filters.gender) {
      query = query.eq('gender', filters.gender)
    }

    const { data, error, count } = await query
      .range(start, end)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch students: ${error.message}`)
    }

    return {
      data: (data || []) as Student[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    }
  }

  /**
   * Find students for a specific teacher (via class assignments)
   */
  async findByTeacher(teacherId: string, filters: StudentFilters = {}): Promise<PaginatedResult<Student>> {
    const page = filters.page || 1
    const pageSize = filters.pageSize || 20
    const start = (page - 1) * pageSize
    const end = start + pageSize - 1

    // First get classes taught by this teacher
    const { data: classes } = await this.supabase
      .from('classes')
      .select('id')
      .eq('teacher_id', teacherId)

    const classIds = classes?.map(c => c.id) || []

    if (classIds.length === 0) {
      return { data: [], total: 0, page, pageSize, totalPages: 0 }
    }

    // Get students enrolled in those classes
    const { data: enrollments } = await this.supabase
      .from('enrollments')
      .select('student_id')
      .in('class_id', classIds)
      .eq('status', 'active')

    const studentIds = [...new Set(enrollments?.map(e => e.student_id) || [])]

    if (studentIds.length === 0) {
      return { data: [], total: 0, page, pageSize, totalPages: 0 }
    }

    let query = this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact' })
      .in('id', studentIds)
      .eq('role', 'student')

    // Apply filters
    if (filters.search) {
      query = query.or(
        `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
      )
    }

    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    const { data, error, count } = await query
      .range(start, end)
      .order('last_name', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch teacher's students: ${error.message}`)
    }

    return {
      data: (data || []) as Student[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    }
  }

  /**
   * Create student with computed full_name
   */
  async create(input: CreateStudentInput): Promise<Student> {
    const fullName = `${input.first_name} ${input.last_name}`
    
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert({
        ...input,
        full_name: fullName,
        role: 'student',
        status: input.status || 'active'
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create student: ${error.message}`)
    }

    return data as Student
  }

  /**
   * Update student with recomputed full_name if names change
   */
  async update(id: string, input: UpdateStudentInput): Promise<Student> {
    const updates: Record<string, unknown> = { ...input }
    
    // If names are changing, update full_name
    if (input.first_name || input.last_name) {
      const existing = await this.findById(id)
      if (existing) {
        const firstName = input.first_name || existing.first_name
        const lastName = input.last_name || existing.last_name
        updates.full_name = `${firstName} ${lastName}`
      }
    }

    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(updates)
      .eq('id', id)
      .eq('role', 'student')
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update student: ${error.message}`)
    }

    return data as Student
  }

  /**
   * Soft delete - set status to inactive
   */
  async softDelete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .update({ status: 'inactive' })
      .eq('id', id)
      .eq('role', 'student')

    if (error) {
      throw new Error(`Failed to soft delete student: ${error.message}`)
    }
  }

  /**
   * Get student count by status for statistics
   */
  async countByStatus(): Promise<Record<string, number>> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('status')
      .eq('role', 'student')

    if (error) {
      throw new Error(`Failed to count students: ${error.message}`)
    }

    const counts: Record<string, number> = {}
    for (const row of data || []) {
      const status = row.status || 'unknown'
      counts[status] = (counts[status] || 0) + 1
    }

    return counts
  }
}
