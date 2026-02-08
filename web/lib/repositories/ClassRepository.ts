/**
 * Class Repository
 *
 * Handles all database operations for classes.
 * Follows Single Responsibility Principle - only data access, no business logic.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  BaseRepository,
  type PaginatedResult,
  type PaginationParams,
} from "./base";

// ============================================
// Types
// ============================================

export interface Class {
  id: string;
  name: string;
  course_id: string | null;
  teacher_id: string | null;
  room: string | null;
  schedule: string | null;
  capacity: number | null;
  academic_year_id: string | null;
  status: "active" | "inactive" | "completed";
  created_at: string;
  updated_at: string;
}

export interface ClassWithDetails extends Class {
  teacher?: {
    id: string;
    first_name: string;
    last_name: string;
    full_name: string;
  } | null;
  course?: {
    id: string;
    name: string;
    code: string;
  } | null;
  _count?: {
    enrollments: number;
  };
}

export interface ClassFilters extends PaginationParams {
  search?: string;
  status?: string;
  teacher_id?: string;
  course_id?: string;
  academic_year_id?: string;
}

export interface CreateClassInput {
  name: string;
  course_id?: string | null;
  teacher_id?: string | null;
  room?: string | null;
  schedule?: string | null;
  capacity?: number | null;
  academic_year_id?: string | null;
  status?: "active" | "inactive";
}

export interface UpdateClassInput {
  name?: string;
  course_id?: string | null;
  teacher_id?: string | null;
  room?: string | null;
  schedule?: string | null;
  capacity?: number | null;
  academic_year_id?: string | null;
  status?: "active" | "inactive" | "completed";
}

// ============================================
// Repository Interface (for DIP)
// ============================================

export interface IClassRepository {
  findById(id: string): Promise<Class | null>;
  findByIdWithDetails(id: string): Promise<ClassWithDetails | null>;
  findAll(filters?: ClassFilters): Promise<PaginatedResult<ClassWithDetails>>;
  findByTeacher(teacherId: string): Promise<Class[]>;
  create(data: CreateClassInput): Promise<Class>;
  update(id: string, data: UpdateClassInput): Promise<Class>;
  delete(id: string): Promise<void>;
  getEnrollmentCount(classId: string): Promise<number>;
}

// ============================================
// Repository Implementation
// ============================================

export class ClassRepository
  extends BaseRepository<Class, CreateClassInput, UpdateClassInput>
  implements IClassRepository {
  protected readonly tableName = "classes";
  protected readonly primaryKey = "id";

  constructor(supabase: SupabaseClient) {
    super(supabase);
  }

  /**
   * Find class by ID with teacher and course details
   */
  /**
   * Find class by ID with teacher and course details
   * Optimized to use parallel queries instead of single deep join for better performance
   */
  async findByIdWithDetails(id: string): Promise<ClassWithDetails | null> {
    // 1. Fetch base class data
    const classQuery = this.supabase
      .from(this.tableName)
      .select("*")
      .eq("id", id)
      .single();

    // 2. Fetch enrollment count (parallel)
    const countQuery = this.supabase
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .eq("class_id", id)
      .eq("status", "enrolled");

    const [classResult, countResult] = await Promise.all([
      classQuery,
      countQuery,
    ]);

    if (classResult.error) {
      if (classResult.error.code === "PGRST116") return null;
      throw new Error(`Failed to find class: ${classResult.error.message}`);
    }

    const cls = classResult.data as Class;

    // 3. Fetch related details in parallel if IDs exist
    const promises: Promise<any>[] = [];

    // Teacher promise
    if (cls.teacher_id) {
      promises.push(
        this.supabase
          .from("profiles")
          .select("id, first_name, last_name, full_name, email")
          .eq("id", cls.teacher_id)
          .single()
          .then((res) => res) as Promise<any>,
      );
    } else {
      promises.push(Promise.resolve({ data: null }));
    }

    // Course promise
    if (cls.course_id) {
      promises.push(
        this.supabase
          .from("courses")
          .select("id, name, code")
          .eq("id", cls.course_id)
          .single()
          .then((res) => res) as Promise<any>,
      );
    } else {
      promises.push(Promise.resolve({ data: null }));
    }

    const [teacherRes, courseRes] = await Promise.all(promises);

    return {
      ...cls,
      teacher: teacherRes.data || null,
      course: courseRes.data || null,
      _count: { enrollments: countResult.count || 0 },
    } as ClassWithDetails;
  }

  /**
   * Find all classes with filters and pagination
   */
  async findAll(
    filters: ClassFilters = {},
  ): Promise<PaginatedResult<ClassWithDetails>> {
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;

    let query = this.supabase
      .from(this.tableName)
      .select(
        `
        *,
        teacher:profiles!classes_teacher_id_fkey (
          id,
          first_name,
          last_name,
          full_name,
          email,
          subject_id,
          subjects!profiles_subject_id_fkey (
            id,
            name,
            code
          )
        ),
        course:courses (
          id,
          name,
          code
        ),
        enrollments (count)
      `,
        { count: "exact" },
      );

    // Apply filters
    if (filters.search) {
      query = query.ilike("name", `%${filters.search}%`);
    }

    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    if (filters.teacher_id) {
      query = query.eq("teacher_id", filters.teacher_id);
    }

    if (filters.course_id) {
      query = query.eq("course_id", filters.course_id);
    }

    if (filters.academic_year_id) {
      query = query.eq("academic_year_id", filters.academic_year_id);
    }

    const { data, error, count } = await query
      .range(start, end)
      .order("name", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch classes: ${error.message}`);
    }

    const resultData = (data || []).map((item: any) => ({
      ...item,
      // Flatten enrollment count if it comes as an array/object
      enrollment_count: item.enrollments?.[0]?.count || 0,
      // Teacher and course are already in right format from select
    }));

    return {
      data: resultData as ClassWithDetails[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }

  /**
   * Find all classes for a specific teacher
   */
  async findByTeacher(teacherId: string): Promise<Class[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select("*")
      .eq("teacher_id", teacherId)
      .eq("status", "active")
      .order("name", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch teacher's classes: ${error.message}`);
    }

    return (data || []) as Class[];
  }

  /**
   * Get enrollment count for a class
   */
  async getEnrollmentCount(classId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .eq("class_id", classId)
      .eq("status", "enrolled");

    if (error) {
      throw new Error(`Failed to count enrollments: ${error.message}`);
    }

    return count || 0;
  }
}
