/**
 * Class Repository
 * 
 * Handles all database operations for classes.
 * Follows Single Responsibility Principle - only data access, no business logic.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { BaseRepository, type PaginatedResult, type PaginationParams } from './index'

// ============================================
// Types
// ============================================

export interface Class {
  id: string
  name: string
  course_id: string | null
  teacher_id: string | null
  room: string | null
  schedule: string | null
  capacity: number | null
  academic_year_id: string | null
  status: 'active' | 'inactive' | 'completed'
  created_at: string
  updated_at: string
}

export interface ClassWithDetails extends Class {
  teacher?: {
    id: string
    first_name: string
    last_name: string
    full_name: string
  } | null
  course?: {
    id: string
    name: string
    code: string
  } | null
  _count?: {
    enrollments: number
  }
}

export interface ClassFilters extends PaginationParams {
  search?: string
  status?: string
  teacher_id?: string
  course_id?: string
  academic_year_id?: string
}

export interface CreateClassInput {
  name: string
  course_id?: string | null
  teacher_id?: string | null
  room?: string | null
  schedule?: string | null
  capacity?: number | null
  academic_year_id?: string | null
  status?: 'active' | 'inactive'
}

export interface UpdateClassInput {
  name?: string
  course_id?: string | null
  teacher_id?: string | null
  room?: string | null
  schedule?: string | null
  capacity?: number | null
  academic_year_id?: string | null
  status?: 'active' | 'inactive' | 'completed'
}

// ============================================
// Repository Interface (for DIP)
// ============================================

export interface IClassRepository {
  findById(id: string): Promise<Class | null>
  findByIdWithDetails(id: string): Promise<ClassWithDetails | null>
  findAll(filters?: ClassFilters): Promise<PaginatedResult<Class>>
  findByTeacher(teacherId: string): Promise<Class[]>
  create(data: CreateClassInput): Promise<Class>
  update(id: string, data: UpdateClassInput): Promise<Class>
  delete(id: string): Promise<void>
  getEnrollmentCount(classId: string): Promise<number>
}

// ============================================
// Repository Implementation
// ============================================

export class ClassRepository 
  extends BaseRepository<Class, CreateClassInput, UpdateClassInput>
  implements IClassRepository {
  
  protected readonly tableName = 'classes'
  protected readonly primaryKey = 'id'

  constructor(supabase: SupabaseClient) {
    super(supabase)
  }

  /**
   * Find class by ID with teacher and course details
   */
  async findByIdWithDetails(id: string): Promise<ClassWithDetails | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        teacher:profiles!teacher_id (
          id,
          first_name,
          last_name,
          full_name
        ),
        course:courses (
          id,
          name,
          code
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Failed to find class: ${error.message}`)
    }

    // Get enrollment count
    const { count } = await this.supabase
      .from('enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('class_id', id)
      .eq('status', 'active')

    return {
      ...data,
      _count: { enrollments: count || 0 }
    } as ClassWithDetails
  }

  /**
   * Find all classes with filters and pagination
   */
  async findAll(filters: ClassFilters = {}): Promise<PaginatedResult<Class>> {
    const page = filters.page || 1
    const pageSize = filters.pageSize || 20
    const start = (page - 1) * pageSize
    const end = start + pageSize - 1

    let query = this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact' })

    // Apply filters
    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`)
    }

    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.teacher_id) {
      query = query.eq('teacher_id', filters.teacher_id)
    }

    if (filters.course_id) {
      query = query.eq('course_id', filters.course_id)
    }

    if (filters.academic_year_id) {
      query = query.eq('academic_year_id', filters.academic_year_id)
    }

    const { data, error, count } = await query
      .range(start, end)
      .order('name', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch classes: ${error.message}`)
    }

    return {
      data: (data || []) as Class[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    }
  }

  /**
   * Find all classes for a specific teacher
   */
  async findByTeacher(teacherId: string): Promise<Class[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('teacher_id', teacherId)
      .eq('status', 'active')
      .order('name', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch teacher's classes: ${error.message}`)
    }

    return (data || []) as Class[]
  }

  /**
   * Get enrollment count for a class
   */
  async getEnrollmentCount(classId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('class_id', classId)
      .eq('status', 'active')

    if (error) {
      throw new Error(`Failed to count enrollments: ${error.message}`)
    }

    return count || 0
  }
}
