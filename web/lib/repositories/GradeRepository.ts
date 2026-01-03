/**
 * Grade Repository
 * 
 * Handles all database operations for grades.
 * Follows Single Responsibility Principle - only data access, no business logic.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { BaseRepository, type PaginatedResult, type PaginationParams } from './index'

// ============================================
// Types
// ============================================

export interface Grade {
  id: string
  student_id: string
  class_id: string
  category_id: string | null
  subject_id: string | null
  score: number
  max_score: number
  weight: number
  grade_type: string
  notes: string | null
  graded_at: string
  graded_by: string | null
  created_at: string
  updated_at: string
}

export interface GradeWithDetails extends Grade {
  student?: {
    id: string
    first_name: string
    last_name: string
    full_name: string
  } | null
  class?: {
    id: string
    name: string
  } | null
  category?: {
    id: string
    name: string
    weight: number
  } | null
}

export interface GradeFilters extends PaginationParams {
  student_id?: string
  class_id?: string
  category_id?: string
  subject_id?: string
  grade_type?: string
  from_date?: string
  to_date?: string
}

export interface CreateGradeInput {
  student_id: string
  class_id: string
  category_id?: string | null
  subject_id?: string | null
  score: number
  max_score?: number
  weight?: number
  grade_type?: string
  notes?: string | null
  graded_at?: string
  graded_by?: string | null
}

export interface UpdateGradeInput {
  score?: number
  max_score?: number
  weight?: number
  notes?: string | null
  graded_at?: string
}

export interface BulkGradeInput {
  grades: CreateGradeInput[]
}

// ============================================
// Repository Interface (for DIP)
// ============================================

export interface IGradeRepository {
  findById(id: string): Promise<Grade | null>
  findByIdWithDetails(id: string): Promise<GradeWithDetails | null>
  findAll(filters?: GradeFilters): Promise<PaginatedResult<Grade>>
  findByStudent(studentId: string, classId?: string): Promise<Grade[]>
  findByClass(classId: string): Promise<GradeWithDetails[]>
  create(data: CreateGradeInput): Promise<Grade>
  createMany(data: CreateGradeInput[]): Promise<Grade[]>
  update(id: string, data: UpdateGradeInput): Promise<Grade>
  delete(id: string): Promise<void>
  getAverageByStudent(studentId: string, classId?: string): Promise<number | null>
  getAverageByClass(classId: string): Promise<number | null>
}

// ============================================
// Repository Implementation
// ============================================

export class GradeRepository 
  extends BaseRepository<Grade, CreateGradeInput, UpdateGradeInput>
  implements IGradeRepository {
  
  protected readonly tableName = 'grades'
  protected readonly primaryKey = 'id'

  constructor(supabase: SupabaseClient) {
    super(supabase)
  }

  /**
   * Find grade by ID with student and class details
   */
  async findByIdWithDetails(id: string): Promise<GradeWithDetails | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        student:profiles!student_id (
          id,
          first_name,
          last_name,
          full_name
        ),
        class:classes (
          id,
          name
        ),
        category:grade_categories (
          id,
          name,
          weight
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Failed to find grade: ${error.message}`)
    }

    return data as GradeWithDetails
  }

  /**
   * Find all grades with filters and pagination
   */
  async findAll(filters: GradeFilters = {}): Promise<PaginatedResult<Grade>> {
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

    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id)
    }

    if (filters.subject_id) {
      query = query.eq('subject_id', filters.subject_id)
    }

    if (filters.grade_type) {
      query = query.eq('grade_type', filters.grade_type)
    }

    if (filters.from_date) {
      query = query.gte('graded_at', filters.from_date)
    }

    if (filters.to_date) {
      query = query.lte('graded_at', filters.to_date)
    }

    const { data, error, count } = await query
      .range(start, end)
      .order('graded_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch grades: ${error.message}`)
    }

    return {
      data: (data || []) as Grade[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    }
  }

  /**
   * Find all grades for a student
   */
  async findByStudent(studentId: string, classId?: string): Promise<Grade[]> {
    let query = this.supabase
      .from(this.tableName)
      .select('*')
      .eq('student_id', studentId)

    if (classId) {
      query = query.eq('class_id', classId)
    }

    const { data, error } = await query
      .order('graded_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch student grades: ${error.message}`)
    }

    return (data || []) as Grade[]
  }

  /**
   * Find all grades for a class with student details
   */
  async findByClass(classId: string): Promise<GradeWithDetails[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        student:profiles!student_id (
          id,
          first_name,
          last_name,
          full_name
        ),
        category:grade_categories (
          id,
          name,
          weight
        )
      `)
      .eq('class_id', classId)
      .order('graded_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch class grades: ${error.message}`)
    }

    return (data || []) as GradeWithDetails[]
  }

  /**
   * Create multiple grades in bulk (for grade entry pages)
   */
  async createMany(grades: CreateGradeInput[]): Promise<Grade[]> {
    if (grades.length === 0) return []

    const now = new Date().toISOString()
    const gradesWithDefaults = grades.map(g => ({
      ...g,
      max_score: g.max_score ?? 10,
      weight: g.weight ?? 1,
      grade_type: g.grade_type ?? 'assignment',
      graded_at: g.graded_at ?? now
    }))

    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(gradesWithDefaults)
      .select()

    if (error) {
      throw new Error(`Failed to create grades: ${error.message}`)
    }

    return (data || []) as Grade[]
  }

  /**
   * Calculate average score for a student
   */
  async getAverageByStudent(studentId: string, classId?: string): Promise<number | null> {
    let query = this.supabase
      .from(this.tableName)
      .select('score, max_score, weight')
      .eq('student_id', studentId)

    if (classId) {
      query = query.eq('class_id', classId)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to calculate student average: ${error.message}`)
    }

    if (!data || data.length === 0) return null

    // Weighted average calculation
    let totalWeightedScore = 0
    let totalWeight = 0

    for (const grade of data) {
      const normalizedScore = (grade.score / grade.max_score) * 10
      totalWeightedScore += normalizedScore * grade.weight
      totalWeight += grade.weight
    }

    return totalWeight > 0 ? totalWeightedScore / totalWeight : null
  }

  /**
   * Calculate average score for a class
   */
  async getAverageByClass(classId: string): Promise<number | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('score, max_score, weight')
      .eq('class_id', classId)

    if (error) {
      throw new Error(`Failed to calculate class average: ${error.message}`)
    }

    if (!data || data.length === 0) return null

    // Simple average of normalized scores
    const total = data.reduce((sum, g) => sum + (g.score / g.max_score) * 10, 0)
    return total / data.length
  }
}
