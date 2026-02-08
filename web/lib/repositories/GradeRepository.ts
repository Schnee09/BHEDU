/**
 * Grade Repository
 *
 * Handles all database operations for grades.
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

export interface Grade {
  id: string;
  student_id: string;
  class_id: string | null;
  subject_id: string | null;
  assignment_id: string | null;
  score: number | null;
  points_earned: number | null;
  feedback: string | null;
  graded_at: string | null;
  graded_by: string | null;
  semester: string | null;
  academic_year_id: string | null;
  component_type: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface GradeWithDetails extends Grade {
  student?: {
    id: string;
    first_name: string;
    last_name: string;
    full_name: string;
  } | null;
  class?: {
    id: string;
    name: string;
  } | null;
}

export interface GradeFilters extends PaginationParams {
  student_id?: string;
  class_id?: string;
  subject_id?: string;
  component_type?: string;
  semester?: string;
  from_date?: string;
  to_date?: string;
}

export interface CreateGradeInput {
  student_id: string;
  class_id?: string | null;
  subject_id?: string | null;
  assignment_id?: string | null;
  score?: number | null;
  points_earned?: number | null;
  feedback?: string | null;
  graded_at?: string | null;
  graded_by?: string | null;
  semester?: string | null;
  academic_year_id?: string | null;
  component_type?: string | null;
}

export interface UpdateGradeInput {
  score?: number | null;
  points_earned?: number | null;
  feedback?: string | null;
  graded_at?: string | null;
}

export interface BulkGradeInput {
  grades: CreateGradeInput[];
}

// ============================================
// Repository Interface (for DIP)
// ============================================

export interface IGradeRepository {
  findById(id: string): Promise<Grade | null>;
  findByIdWithDetails(id: string): Promise<GradeWithDetails | null>;
  findAll(filters?: GradeFilters): Promise<PaginatedResult<Grade>>;
  findByStudent(studentId: string, classId?: string): Promise<Grade[]>;
  findByClass(classId: string): Promise<GradeWithDetails[]>;
  create(data: CreateGradeInput): Promise<Grade>;
  createMany(data: CreateGradeInput[]): Promise<Grade[]>;
  upsertMany(data: CreateGradeInput[]): Promise<Grade[]>;
  update(id: string, data: UpdateGradeInput): Promise<Grade>;
  delete(id: string): Promise<void>;
  getAverageByStudent(
    studentId: string,
    classId?: string,
  ): Promise<number | null>;
  getAverageByClass(classId: string): Promise<number | null>;
}

// ============================================
// Repository Implementation
// ============================================

export class GradeRepository
  extends BaseRepository<Grade, CreateGradeInput, UpdateGradeInput>
  implements IGradeRepository {
  protected readonly tableName = "grades";
  protected readonly primaryKey = "id";

  constructor(supabase: SupabaseClient) {
    super(supabase);
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
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Failed to find grade: ${error.message}`);
    }

    return data as GradeWithDetails;
  }

  /**
   * Find all grades with filters and pagination
   */
  async findAll(filters: GradeFilters = {}): Promise<PaginatedResult<Grade>> {
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 50;
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;

    let query = this.supabase
      .from(this.tableName)
      .select("*", { count: "exact" });

    // Apply filters
    if (filters.student_id) {
      query = query.eq("student_id", filters.student_id);
    }

    if (filters.class_id) {
      query = query.eq("class_id", filters.class_id);
    }

    if (filters.subject_id) {
      query = query.eq("subject_id", filters.subject_id);
    }

    if (filters.component_type) {
      query = query.eq("component_type", filters.component_type);
    }

    // CRITICAL: Filter by semester - this was missing and caused grades to appear in all semesters
    if (filters.semester) {
      query = query.eq("semester", filters.semester);
    }

    if (filters.from_date) {
      query = query.gte("graded_at", filters.from_date);
    }

    if (filters.to_date) {
      query = query.lte("graded_at", filters.to_date);
    }

    const { data, error, count } = await query
      .range(start, end)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch grades: ${error.message}`);
    }

    return {
      data: (data || []) as Grade[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }

  /**
   * Find all grades for a student
   */
  async findByStudent(studentId: string, classId?: string): Promise<Grade[]> {
    let query = this.supabase
      .from(this.tableName)
      .select("*")
      .eq("student_id", studentId);

    if (classId) {
      query = query.eq("class_id", classId);
    }

    const { data, error } = await query
      .order("graded_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch student grades: ${error.message}`);
    }

    return (data || []) as Grade[];
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
        )
      `)
      .eq("class_id", classId)
      .order("graded_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch class grades: ${error.message}`);
    }

    return (data || []) as GradeWithDetails[];
  }

  /**
   * Create multiple grades in bulk (for grade entry pages)
   */
  async createMany(grades: CreateGradeInput[]): Promise<Grade[]> {
    if (grades.length === 0) return [];

    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(grades)
      .select();

    if (error) {
      throw new Error(`Failed to create grades: ${error.message}`);
    }

    return (data || []) as Grade[];
  }

  /**
   * Upsert multiple grades in bulk (for grade entry pages)
   * Handles conflicts based on student_id, class_id, subject_id, component_type, semester
   */
  async upsertMany(grades: CreateGradeInput[]): Promise<Grade[]> {
    if (grades.length === 0) return [];

    // Validate that all required constraint columns are non-null
    // This is critical because NULL values in unique constraints don't match in PostgreSQL
    for (const grade of grades) {
      const missing = [];
      if (!grade.student_id) missing.push("student_id");
      if (!grade.class_id) missing.push("class_id");
      if (!grade.subject_id) missing.push("subject_id");
      if (!grade.component_type) missing.push("component_type");
      if (!grade.semester) missing.push("semester");

      if (missing.length > 0) {
        console.error(
          "[GradeRepository.upsertMany] Missing required fields:",
          missing,
          "Grade:",
          grade,
        );
        throw new Error(
          `Missing required fields for upsert: ${missing.join(", ")}`,
        );
      }
    }

    console.log(
      "[GradeRepository.upsertMany] Upserting",
      grades.length,
      "grades",
    );
    console.log(
      "[GradeRepository.upsertMany] First grade:",
      JSON.stringify(grades[0]),
    );

    const { data, error } = await this.supabase
      .from(this.tableName)
      .upsert(grades, {
        onConflict: "student_id,class_id,subject_id,component_type,semester",
      })
      .select();

    if (error) {
      console.error("[GradeRepository.upsertMany] Error:", error);
      throw new Error(`Failed to upsert grades: ${error.message}`);
    }

    console.log(
      "[GradeRepository.upsertMany] Upserted",
      data?.length,
      "grades",
    );
    return (data || []) as Grade[];
  }

  /**
   * Calculate average score for a student
   */
  async getAverageByStudent(
    studentId: string,
    classId?: string,
  ): Promise<number | null> {
    let query = this.supabase
      .from(this.tableName)
      .select("score")
      .eq("student_id", studentId);

    if (classId) {
      query = query.eq("class_id", classId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to calculate student average: ${error.message}`);
    }

    if (!data || data.length === 0) return null;

    // TODO: Implement actual weighting based on component_type if needed
    const scores = data.map((g) => g.score).filter((s) =>
      s !== null
    ) as number[];
    if (scores.length === 0) return null;

    const total = scores.reduce((sum, s) => sum + s, 0);
    return total / scores.length;
  }

  /**
   * Calculate average score for a class
   */
  async getAverageByClass(classId: string): Promise<number | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select("score")
      .eq("class_id", classId);

    if (error) {
      throw new Error(`Failed to calculate class average: ${error.message}`);
    }

    if (!data || data.length === 0) return null;

    const scores = data.map((g) => g.score).filter((s) =>
      s !== null
    ) as number[];
    if (scores.length === 0) return null;

    const total = scores.reduce((sum, s) => sum + s, 0);
    return total / scores.length;
  }
}
