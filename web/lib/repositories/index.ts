/**
 * Repository Pattern - Base Types and Interfaces
 * 
 * Following SOLID principles:
 * - S: Single Responsibility - Each repository handles one entity
 * - O: Open/Closed - New repositories extend base without modifying it
 * - L: Liskov Substitution - All repositories implement common interface
 * - I: Interface Segregation - Minimal interfaces focused on specific operations
 * - D: Dependency Inversion - Services depend on interfaces, not concrete implementations
 */

import type { SupabaseClient } from '@supabase/supabase-js'

// ============================================
// Base Types
// ============================================

export interface PaginationParams {
  page?: number
  pageSize?: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface SortParams {
  field: string
  order: 'asc' | 'desc'
}

// ============================================
// Base Repository Interface
// ============================================

export interface IRepository<T, CreateInput, UpdateInput> {
  findById(id: string): Promise<T | null>
  findAll(params?: PaginationParams): Promise<PaginatedResult<T>>
  create(data: CreateInput): Promise<T>
  update(id: string, data: UpdateInput): Promise<T>
  delete(id: string): Promise<void>
}

// ============================================
// Base Repository Implementation
// ============================================

export abstract class BaseRepository<T, CreateInput, UpdateInput> 
  implements IRepository<T, CreateInput, UpdateInput> {
  
  protected readonly supabase: SupabaseClient
  protected abstract readonly tableName: string
  protected abstract readonly primaryKey: string

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  async findById(id: string): Promise<T | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq(this.primaryKey, id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw new Error(`Failed to find ${this.tableName}: ${error.message}`)
    }

    return data as T
  }

  async findAll(params: PaginationParams = {}): Promise<PaginatedResult<T>> {
    const page = params.page || 1
    const pageSize = params.pageSize || 20
    const start = (page - 1) * pageSize
    const end = start + pageSize - 1

    const { data, error, count } = await this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact' })
      .range(start, end)

    if (error) {
      throw new Error(`Failed to fetch ${this.tableName}: ${error.message}`)
    }

    return {
      data: (data || []) as T[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    }
  }

  async create(input: CreateInput): Promise<T> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(input as Record<string, unknown>)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create ${this.tableName}: ${error.message}`)
    }

    return data as T
  }

  async update(id: string, input: UpdateInput): Promise<T> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(input as Record<string, unknown>)
      .eq(this.primaryKey, id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update ${this.tableName}: ${error.message}`)
    }

    return data as T
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq(this.primaryKey, id)

    if (error) {
      throw new Error(`Failed to delete ${this.tableName}: ${error.message}`)
    }
  }
}

// Re-export repository implementations
export { StudentRepository, type Student, type StudentFilters } from './StudentRepository'
export { ClassRepository, type Class, type ClassFilters } from './ClassRepository'
export { GradeRepository, type Grade, type GradeFilters } from './GradeRepository'
export { AttendanceRepository, type Attendance, type AttendanceFilters } from './AttendanceRepository'
export { EnrollmentRepository, type Enrollment, type EnrollmentFilters } from './EnrollmentRepository'
