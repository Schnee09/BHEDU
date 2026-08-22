/**
 * Attendance Repository
 *
 * Handles all database operations for attendance records.
 * Follows Single Responsibility Principle - only data access, no business logic.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { BaseRepository, type PaginatedResult, type PaginationParams } from './base';

// ============================================
// Types
// ============================================

import type {
  AttendanceQueryInput,
  BulkAttendanceInput,
  CreateAttendanceInput,
  UpdateAttendanceInput,
} from '@/lib/schemas';

export type AttendanceFilters = AttendanceQueryInput;

import type { AttendanceResponse } from '@/lib/schemas/responses/attendance';

// Alias for backwards compatibility if needed, or prefer using the imported types directly
export type Attendance = AttendanceResponse;
export type AttendanceWithDetails = AttendanceResponse;

// ============================================
// Repository Interface (for DIP)
// ============================================

export interface IAttendanceRepository {
  findById(id: string): Promise<Attendance | null>;
  findByIdWithDetails(id: string): Promise<AttendanceWithDetails | null>;
  findAll(filters?: AttendanceFilters): Promise<PaginatedResult<Attendance>>;
  findByStudent(studentId: string, filters?: AttendanceFilters): Promise<Attendance[]>;
  findByClass(classId: string, date?: string): Promise<AttendanceWithDetails[]>;
  findByClassAndDate(classId: string, date: string): Promise<AttendanceWithDetails[]>;
  create(data: CreateAttendanceInput): Promise<Attendance>;
  createBulk(data: BulkAttendanceInput): Promise<Attendance[]>;
  update(id: string, data: UpdateAttendanceInput): Promise<Attendance>;
  delete(id: string): Promise<void>;
  getAttendanceRate(studentId: string, classId?: string): Promise<number>;
  getClassAttendanceStats(
    classId: string,
    date: string
  ): Promise<{
    total: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
  }>;
}

// ============================================
// Repository Implementation
// ============================================

export class AttendanceRepository
  extends BaseRepository<Attendance, CreateAttendanceInput, UpdateAttendanceInput>
  implements IAttendanceRepository
{
  protected override readonly tableName = 'attendance';
  protected override readonly primaryKey = 'id';
  protected override readonly useSoftDelete = true;

  constructor(supabase: SupabaseClient) {
    super(supabase);
  }

  /**
   * Find attendance by ID with student and class details
   */
  async findByIdWithDetails(id: string): Promise<AttendanceWithDetails | null> {
    let query = this.supabase
      .from(this.tableName)
      .select(
        `
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
        )
      `
      )
      .eq('id', id);

    if (this.useSoftDelete) {
      query = query.is('deleted_at', null);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to find attendance: ${error.message}`);
    }

    return data as AttendanceWithDetails;
  }

  /**
   * Find all attendance with filters and pagination
   */
  async findAll(filters: Partial<AttendanceFilters> = {}): Promise<PaginatedResult<Attendance>> {
    const page = filters.page || 1;
    const pageSize = filters.limit || 50;
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;

    let query = this.supabase.from(this.tableName).select(
      `
        *,
        student:profiles!student_id (
          id,
          first_name,
          last_name,
          full_name,
          student_profiles (
            student_code
          )
        ),
        class:classes (
          id,
          name
        )
      `,
      { count: 'exact' }
    );

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

    if (filters.date) {
      query = query.eq('date', filters.date);
    }

    if (filters.from_date) {
      query = query.gte('date', filters.from_date);
    }

    if (filters.to_date) {
      query = query.lte('date', filters.to_date);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error, count } = await query
      .range(start, end)
      .order('date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch attendance: ${error.message}`);
    }

    return {
      data: (data || []) as Attendance[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }

  /**
   * Find all attendance for a student
   */
  async findByStudent(
    studentId: string,
    filters: Partial<AttendanceFilters> = {}
  ): Promise<Attendance[]> {
    let query = this.supabase.from(this.tableName).select('*').eq('student_id', studentId);

    if (this.useSoftDelete) {
      query = query.is('deleted_at', null);
    }

    if (filters.class_id) {
      query = query.eq('class_id', filters.class_id);
    }

    if (filters.from_date) {
      query = query.gte('date', filters.from_date);
    }

    if (filters.to_date) {
      query = query.lte('date', filters.to_date);
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch student attendance: ${error.message}`);
    }

    return (data || []) as Attendance[];
  }

  /**
   * Find all attendance for a class (optionally on a specific date)
   */
  async findByClass(classId: string, date?: string): Promise<AttendanceWithDetails[]> {
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
          student_profiles (
            student_code
          )
        )
      `
      )
      .eq('class_id', classId);

    if (this.useSoftDelete) {
      query = query.is('deleted_at', null);
    }

    if (date) {
      query = query.eq('date', date);
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch class attendance: ${error.message}`);
    }

    return (data || []) as AttendanceWithDetails[];
  }

  /**
   * Find attendance for a class on a specific date
   */
  async findByClassAndDate(classId: string, date: string): Promise<AttendanceWithDetails[]> {
    return this.findByClass(classId, date);
  }

  /**
   * Create bulk attendance records (for taking attendance for a whole class)
   */
  async createBulk(data: BulkAttendanceInput): Promise<Attendance[]> {
    const records = data.records.map((record) => ({
      student_id: record.student_id,
      class_id: data.class_id,
      date: data.date,
      status: record.status,
      remarks: record.notes || null,
      marked_by: data.marked_by || null,
    }));

    const { data: created, error } = await this.supabase
      .from(this.tableName)
      .upsert(records, {
        onConflict: 'student_id,class_id,date',
        ignoreDuplicates: false,
      })
      .select();

    if (error) {
      throw new Error(`Failed to create bulk attendance: ${error.message}`);
    }

    return (created || []) as Attendance[];
  }

  /**
   * Calculate attendance rate for a student
   */
  async getAttendanceRate(studentId: string, classId?: string): Promise<number> {
    // Optimization: Use SQL function for calculation
    const { data: rate, error } = await (this.supabase as any).rpc('get_attendance_rate', {
      p_student_id: studentId,
      p_class_id: classId || null,
    });

    if (!error && rate !== null) {
      return rate;
    }

    // Fallback if RPC fails
    let query = this.supabase.from(this.tableName).select('status').eq('student_id', studentId);

    if (classId) {
      query = query.eq('class_id', classId);
    }

    const { data, error: queryError } = await query;

    if (queryError) {
      throw new Error(`Failed to calculate attendance rate: ${queryError.message}`);
    }

    if (!data || data.length === 0) return 0;

    const present = data.filter((r) => r.status === 'present' || r.status === 'late').length;
    return (present / data.length) * 100;
  }

  /**
   * Get attendance statistics for a class on a date
   */
  async getClassAttendanceStats(
    classId: string,
    date: string
  ): Promise<{
    total: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
  }> {
    // Optimization: Use SQL count to avoid fetching large datasets
    const { data: statsData, error } = await (this.supabase as any).rpc(
      'get_class_attendance_stats',
      {
        p_class_id: classId,
        p_date: date,
      }
    );

    if (!error && statsData) {
      return statsData;
    }

    // Fallback to optimized select if RPC fails or is not yet deployed
    const { data, error: queryError } = await this.supabase
      .from(this.tableName)
      .select('status')
      .eq('class_id', classId)
      .eq('date', date);

    if (queryError) {
      throw new Error(`Failed to get attendance stats: ${queryError.message}`);
    }

    const stats = {
      total: data?.length || 0,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
    };

    for (const record of data || []) {
      if (record.status in stats) {
        stats[record.status as keyof typeof stats]++;
      }
    }

    return stats;
  }
}
