/**
 * Class Service - Business logic for class management
 *
 * MIGRATED TO INSTANCE-BASED (Phase 2)
 * - All methods now use this.supabase instead of creating client per-call
 * - Supabase client can be injected for testing
 * - Default singleton exported for backward compatibility
 */

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NotFoundError, ValidationError } from "@/lib/api/errors";
import type { CreateClassInput, UpdateClassInput } from "@/lib/schemas";
import type { SupabaseClient } from "@supabase/supabase-js";
import { hasPermission, UserRole } from "@/lib/auth/core";

export interface Class {
  id: string;
  name: string;
  course_id: string;
  teacher_id: string;
  academic_year_id: string;
  schedule: string | null;
  room: string | null;
  capacity: number | null;
  created_at: string;
  updated_at: string;
  status: "active" | "inactive" | "completed";
}

export interface ClassWithDetails extends Class {
  courses: {
    id: string;
    name: string;
    code: string;
  };
  teacher: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    subject_id?: string;
    subjects?: {
      id: string;
      name: string;
      code: string;
    };
  };
  academic_years: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
  };
  _count?: {
    enrollments: number;
  };
}

export interface ClassFilters {
  courseId?: string;
  teacherId?: string;
  academicYearId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  context?: {
    role: UserRole;
    profileId: string;
  };
}

export class ClassService {
  private supabase: SupabaseClient;

  /**
   * @param supabase - Optional Supabase client for dependency injection (testing)
   */
  constructor(supabase?: SupabaseClient) {
    this.supabase = supabase || createServiceClient();
  }

  /**
   * Set the Supabase client (primarily for testing)
   */
  public setSupabase(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Get all classes with optional filters and role-based visibility
   */
  async getClasses(filters?: ClassFilters) {
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 20;
    const offset = (page - 1) * pageSize;
    const { role, profileId } = filters?.context || {};

    let query = this.supabase
      .from("classes")
      .select(
        `
        *,
        courses (id, name, code),
        teacher:profiles!teacher_id (id, first_name, last_name, email, subject_id, subjects (id, name, code)),
        academic_years (id, name, start_date, end_date)
      `,
        { count: "exact" },
      );

    // --- Role-based Visibility Logic (Centralized) ---
    if (role && profileId) {
      if (hasPermission(role, "classes.manage")) {
        // Staff/Admin - No additional filtering (sees all)
      } else if (role === "teacher") {
        // Teachers - See their assigned classes
        query = query.eq("teacher_id", profileId);
      } else if (role === "student") {
        // Students - See classes they are enrolled in
        // We use a subquery/join approach for efficiency
        const { data: enrollmentData } = await this.supabase
          .from("enrollments")
          .select("class_id")
          .eq("student_id", profileId)
          .eq("status", "active");

        const classIds = (enrollmentData || []).map((e) => e.class_id);
        if (classIds.length === 0) {
          return { classes: [], total: 0, page, pageSize };
        }
        query = query.in("id", classIds);
      } else {
        // Other roles - return empty potentially or handle based on rules
        return { classes: [], total: 0, page, pageSize };
      }
    }

    if (filters?.courseId) {
      query = query.eq("course_id", filters.courseId);
    }
    if (filters?.teacherId) {
      query = query.eq("teacher_id", filters.teacherId);
    }
    if (filters?.academicYearId) {
      query = query.eq("academic_year_id", filters.academicYearId);
    }
    if (filters?.search) {
      query = query.ilike("name", `%${filters.search}%`);
    }

    query = query.range(offset, offset + pageSize - 1).order("name");

    const { data, error, count } = await query;

    if (error) {
      console.error("Failed to fetch classes:", error);
      throw new Error("Failed to fetch classes");
    }

    return {
      classes: data || [],
      total: count || 0,
      page,
      pageSize,
    };
  }

  /**
   * Get a single class by ID
   */
  async getClassById(id: string): Promise<ClassWithDetails> {
    const { data, error } = await this.supabase
      .from("classes")
      .select(`
        *,
        courses (id, name, code),
        teacher:profiles!teacher_id (id, first_name, last_name, email, subject_id, subjects (id, name, code)),
        academic_years (id, name, start_date, end_date)
      `)
      .eq("id", id)
      .single();

    if (error || !data) {
      throw new NotFoundError("Class not found");
    }

    const { count } = await this.supabase
      .from("enrollments")
      .select("*", { count: "exact", head: true })
      .eq("class_id", id)
      .eq("status", "active");

    return {
      ...data,
      _count: { enrollments: count || 0 },
    } as ClassWithDetails;
  }

  /**
   * Create a new class
   */
  async createClass(input: CreateClassInput) {
    // Verify course exists
    const { data: course } = await this.supabase
      .from("courses")
      .select("id")
      .eq("id", input.course_id)
      .single();

    if (!course) {
      throw new ValidationError("Course not found");
    }

    // Verify teacher exists and has teacher role
    const { data: teacher } = await this.supabase
      .from("profiles")
      .select("id, role")
      .eq("id", input.teacher_id)
      .single();

    if (!teacher) {
      throw new ValidationError("Teacher not found");
    }

    if (teacher.role !== "teacher" && teacher.role !== "admin") {
      throw new ValidationError("User must have teacher or admin role");
    }

    // Verify academic year exists
    const { data: academicYear } = await this.supabase
      .from("academic_years")
      .select("id")
      .eq("id", input.academic_year_id)
      .single();

    if (!academicYear) {
      throw new ValidationError("Academic year not found");
    }

    const { data, error } = await this.supabase
      .from("classes")
      .insert({
        name: input.name,
        course_id: input.course_id,
        teacher_id: input.teacher_id,
        academic_year_id: input.academic_year_id,
        schedule: input.schedule || null,
        room: input.room || null,
        capacity: input.capacity || null,
        status: input.status,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create class:", error);
      throw new Error("Failed to create class");
    }

    return data;
  }

  /**
   * Update a class
   */
  async updateClass(id: string, input: UpdateClassInput) {
    // Check if class exists
    await this.getClassById(id);

    // Validate teacher if provided
    if (input.teacher_id) {
      const { data: teacher } = await this.supabase
        .from("profiles")
        .select("id, role")
        .eq("id", input.teacher_id)
        .single();

      if (!teacher) {
        throw new ValidationError("Teacher not found");
      }

      if (teacher.role !== "teacher" && teacher.role !== "admin") {
        throw new ValidationError("User must have teacher or admin role");
      }
    }

    // Validate course if provided
    if (input.course_id) {
      const { data: course } = await this.supabase
        .from("courses")
        .select("id")
        .eq("id", input.course_id)
        .single();

      if (!course) {
        throw new ValidationError("Course not found");
      }
    }

    // Validate academic year if provided
    if (input.academic_year_id) {
      const { data: academicYear } = await this.supabase
        .from("academic_years")
        .select("id")
        .eq("id", input.academic_year_id)
        .single();

      if (!academicYear) {
        throw new ValidationError("Academic year not found");
      }
    }

    const { data, error } = await this.supabase
      .from("classes")
      .update(input)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Failed to update class:", error);
      throw new Error("Failed to update class");
    }

    return data;
  }

  /**
   * Delete a class
   */
  async deleteClass(id: string) {
    // Check if class exists
    await this.getClassById(id);

    // Check if class has any enrollments
    const { data: enrollments } = await this.supabase
      .from("enrollments")
      .select("id")
      .eq("class_id", id)
      .limit(1);

    if (enrollments && enrollments.length > 0) {
      throw new ValidationError(
        "Cannot delete class with existing enrollments",
      );
    }

    const { error } = await this.supabase.from("classes").delete().eq("id", id);

    if (error) {
      console.error("Failed to delete class:", error);
      throw new Error("Failed to delete class");
    }
  }

  /**
   * Get students enrolled in a class
   */
  async getClassStudents(classId: string) {
    const { data, error } = await this.supabase
      .from("enrollments")
      .select(`
        id,
        enrollment_date,
        status,
        student:profiles!student_id (
          id,
          first_name,
          last_name,
          email,
          full_name,
          student_profiles (
            student_code
          )
        )
      `)
      .eq("class_id", classId)
      .eq("status", "active")
      .order("student(last_name)"); // Note: Specific join ordering syntax might vary

    if (error) {
      console.error("Failed to fetch class students:", error);
      throw new Error("Failed to fetch class students");
    }

    return data;
  }

  /**
   * Get assignments for a class
   */
  async getClassAssignments(classId: string) {
    const { data, error } = await this.supabase
      .from("assignments")
      .select("*")
      .eq("class_id", classId)
      .order("due_date", { ascending: false });

    if (error) {
      console.error("Failed to fetch assignments:", error);
      throw new Error("Failed to fetch assignments");
    }

    return data;
  }

  /**
   * Get attendance records for a class
   */
  async getClassAttendance(classId: string, date?: string) {
    let query = this.supabase
      .from("attendance")
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
      .order("date", { ascending: false });

    if (date) {
      query = query.eq("date", date);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch attendance:", error);
      throw new Error("Failed to fetch attendance");
    }

    return data;
  }

  /**
   * Get grade statistics for a class
   */
  async getClassGradeStats(classId: string) {
    const { data: assignments } = await this.supabase
      .from("assignments")
      .select("id, max_points")
      .eq("class_id", classId);

    if (!assignments || assignments.length === 0) {
      return {
        averageGrade: 0,
        highestGrade: 0,
        lowestGrade: 0,
        totalAssignments: 0,
      };
    }

    const assignmentIds = assignments.map((a) => a.id);
    const { data: grades } = await this.supabase
      .from("grades")
      .select("score, assignment_id")
      .in("assignment_id", assignmentIds);

    if (!grades || grades.length === 0) {
      return {
        averageGrade: 0,
        highestGrade: 0,
        lowestGrade: 0,
        totalAssignments: assignments.length,
      };
    }

    const percentages = grades.map((grade) => {
      const assignment = assignments.find((a) => a.id === grade.assignment_id);
      if (!assignment || assignment.max_points === 0) return 0;
      return (grade.score / assignment.max_points) * 100;
    });

    const avg = percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
    const highest = Math.max(...percentages);
    const lowest = Math.min(...percentages);

    return {
      averageGrade: Math.round(avg * 10) / 10,
      highestGrade: Math.round(highest * 10) / 10,
      lowestGrade: Math.round(lowest * 10) / 10,
      totalAssignments: assignments.length,
    };
  }

  /**
   * Get classes taught by a teacher
   */
  async getTeacherClasses(teacherId: string, academicYearId?: string) {
    return this.getClasses({ teacherId, academicYearId });
  }

  // ============================================================
  // STATIC METHODS FOR BACKWARD COMPATIBILITY
  // These delegate to the default singleton instance
  // ============================================================

  static async getClasses(filters?: Parameters<ClassService["getClasses"]>[0]) {
    return classService.getClasses(filters);
  }

  static async getClassById(id: string) {
    return classService.getClassById(id);
  }

  static async createClass(input: CreateClassInput) {
    return classService.createClass(input);
  }

  static async updateClass(id: string, input: UpdateClassInput) {
    return classService.updateClass(id, input);
  }

  static async deleteClass(id: string) {
    return classService.deleteClass(id);
  }

  static async getClassStudents(classId: string) {
    return classService.getClassStudents(classId);
  }

  static async getClassAssignments(classId: string) {
    return classService.getClassAssignments(classId);
  }

  static async getClassAttendance(classId: string, date?: string) {
    return classService.getClassAttendance(classId, date);
  }

  static async getClassGradeStats(classId: string) {
    return classService.getClassGradeStats(classId);
  }

  static async getTeacherClasses(teacherId: string, academicYearId?: string) {
    return classService.getTeacherClasses(teacherId, academicYearId);
  }
}

// Default singleton instance for backward compatibility
export const classService = new ClassService();
