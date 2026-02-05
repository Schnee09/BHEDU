/**
 * Student Service - Business logic for student management
 *
 * MIGRATED TO INSTANCE-BASED (Phase 2)
 */

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NotFoundError, ValidationError } from "@/lib/api/errors";
import type { CreateStudentInput, UpdateStudentInput } from "@/lib/schemas";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface Student {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  date_of_birth: string;
  phone: string | null;
  address: string | null;
  emergency_contact: string | null;
  user_id: string;
  student_code?: string;
  grade_level?: string;
  gender?: string | null;
  status?: string | null;
  photo_url?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentWithEnrollments extends Student {
  enrollments: Array<{
    id: string;
    class_id: string;
    enrollment_date: string;
    status: string;
    classes: {
      id: string;
      name: string;
      course_id: string;
    };
  }>;
}

export class StudentService {
  private supabase: SupabaseClient;

  constructor(supabase?: SupabaseClient) {
    this.supabase = supabase || createServiceClient();
  }

  async getStudents(filters?: {
    search?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 20;
    const offset = (page - 1) * pageSize;

    let query = this.supabase
      .from("profiles")
      .select("*", { count: "exact" })
      .eq("role", "student");

    if (filters?.search) {
      query = query.or(
        `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`,
      );
    }

    query = query.range(offset, offset + pageSize - 1).order("last_name");

    const { data, error, count } = await query;

    if (error) {
      console.error("Failed to fetch students:", error);
      throw new Error("Failed to fetch students");
    }

    return {
      students: data || [],
      total: count || 0,
      page,
      pageSize,
    };
  }

  async getStudentById(id: string): Promise<StudentWithEnrollments> {
    const { data, error } = await this.supabase
      .from("profiles")
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
      .eq("id", id)
      .eq("role", "student")
      .single();

    if (error || !data) {
      throw new NotFoundError("Student not found");
    }

    return data as StudentWithEnrollments;
  }

  async getStudentByCode(code: string): Promise<Student> {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("*")
      .eq("student_code", code.toUpperCase())
      .eq("role", "student")
      .single();

    if (error || !data) {
      throw new NotFoundError("Không tìm thấy học sinh với mã này");
    }

    return data as Student;
  }

  async createStudent(input: CreateStudentInput) {
    const { data: existing } = await this.supabase
      .from("profiles")
      .select("id")
      .eq("email", input.email)
      .single();

    if (existing) {
      throw new ValidationError("Email already exists");
    }

    const { data: authData, error: authError } = await this.supabase.auth.admin
      .createUser({
        email: input.email || undefined,
        email_confirm: true,
        user_metadata: {
          first_name: input.first_name,
          last_name: input.last_name,
          full_name: `${input.last_name} ${input.first_name}`.trim(),
          role: "student",
        },
      });

    if (authError || !authData.user) {
      console.error("Failed to create auth user:", authError);
      throw new Error("Failed to create student account");
    }

    const { data: profile, error: profileError } = await this.supabase
      .from("profiles")
      .update({
        first_name: input.first_name,
        last_name: input.last_name,
        full_name: `${input.last_name} ${input.first_name}`.trim(),
        date_of_birth: input.date_of_birth,
        phone: input.phone || null,
        address: input.address || null,
        emergency_contact: input.emergency_contact || null,
        role: "student",
        student_code: input.student_code || null,
        grade_level: input.grade_level || null,
      })
      .eq("user_id", authData.user.id)
      .select()
      .single();

    if (profileError) {
      console.error("Failed to update profile:", profileError);
      await this.supabase.auth.admin.deleteUser(authData.user.id);
      throw new Error("Failed to create student profile");
    }

    // Synchronize to student_profiles
    await this.supabase.from("student_profiles").upsert({
      profile_id: profile.id,
      student_code: profile.student_code || input.student_code,
      grade_level: profile.grade_level || input.grade_level,
    }, { onConflict: "profile_id" });

    return profile;
  }

  async updateStudent(id: string, input: UpdateStudentInput) {
    await this.getStudentById(id);

    if (input.email) {
      const { data: existing } = await this.supabase
        .from("profiles")
        .select("id")
        .eq("email", input.email)
        .neq("id", id)
        .single();

      if (existing) {
        throw new ValidationError("Email already exists");
      }
    }

    const updates: Partial<Student> = {};
    if (input.first_name) updates.first_name = input.first_name;
    if (input.last_name) updates.last_name = input.last_name;
    if (input.first_name || input.last_name) {
      const firstName = input.first_name || "";
      const lastName = input.last_name || "";
      updates.full_name = `${lastName} ${firstName}`.trim();
    }
    if (input.email) updates.email = input.email;
    if (input.date_of_birth) updates.date_of_birth = input.date_of_birth;
    if (input.phone !== undefined) updates.phone = input.phone || null;
    if (input.address !== undefined) updates.address = input.address || null;
    if (input.emergency_contact !== undefined) {
      updates.emergency_contact = input.emergency_contact || null;
    }
    if (input.student_code !== undefined) {
      updates.student_code = input.student_code || undefined;
    }
    if (input.grade_level !== undefined) {
      updates.grade_level = input.grade_level || undefined;
    }

    const { data, error } = await this.supabase
      .from("profiles")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Failed to update student:", error);
      throw new Error("Failed to update student");
    }

    // Synchronize to student_profiles
    if (input.student_code || input.grade_level) {
      await this.supabase.from("student_profiles").upsert({
        profile_id: id,
        student_code: data.student_code,
        grade_level: data.grade_level,
      }, { onConflict: "profile_id" });
    }

    return data;
  }

  async deleteStudent(id: string) {
    await this.getStudentById(id);

    const { data: enrollments } = await this.supabase
      .from("enrollments")
      .select("id")
      .eq("student_id", id)
      .eq("status", "active")
      .limit(1);

    if (enrollments && enrollments.length > 0) {
      throw new ValidationError(
        "Cannot delete student with active enrollments",
      );
    }

    const { error } = await this.supabase.auth.admin.deleteUser(id);

    if (error) {
      console.error("Failed to delete student:", error);
      throw new Error("Failed to delete student");
    }
  }

  async getStudentGrades(studentId: string, classId?: string) {
    let query = this.supabase
      .from("grades")
      .select(`
        *,
        assignments (
          id,
          title,
          max_points,
          due_date,
          class_id,
          classes (
            name
          )
        )
      `)
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (classId) {
      query = query.eq("assignments.class_id", classId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch student grades:", error);
      throw new Error("Failed to fetch student grades");
    }

    return data;
  }

  async getStudentAttendance(studentId: string, classId?: string) {
    let query = this.supabase
      .from("attendance")
      .select(`
        *,
        classes (
          id,
          name
        )
      `)
      .eq("student_id", studentId)
      .order("date", { ascending: false });

    if (classId) {
      query = query.eq("class_id", classId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch attendance:", error);
      throw new Error("Failed to fetch attendance");
    }

    return data;
  }

  async enrollStudent(studentId: string, classId: string) {
    await this.getStudentById(studentId);

    const { data: existing } = await this.supabase
      .from("enrollments")
      .select("id")
      .eq("student_id", studentId)
      .eq("class_id", classId)
      .single();

    if (existing) {
      throw new ValidationError("Student already enrolled in this class");
    }

    const { data, error } = await this.supabase
      .from("enrollments")
      .insert({
        student_id: studentId,
        class_id: classId,
        enrollment_date: new Date().toISOString().split("T")[0],
        status: "active",
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to enroll student:", error);
      throw new Error("Failed to enroll student");
    }

    return data;
  }

  async unenrollStudent(studentId: string, classId: string) {
    const { data, error } = await this.supabase
      .from("enrollments")
      .update({ status: "withdrawn" })
      .eq("student_id", studentId)
      .eq("class_id", classId)
      .select()
      .single();

    if (error) {
      console.error("Failed to unenroll student:", error);
      throw new Error("Failed to unenroll student");
    }

    return data;
  }

  async getStudentsForTeacher(
    teacherProfileId: string,
    filters: {
      search?: string;
      page?: number;
      limit?: number;
      status?: string;
      grade_level?: string;
      gender?: string;
    } = {},
  ) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    // Get teacher's classes
    const { data: classes } = await this.supabase
      .from("classes")
      .select("id")
      .eq("teacher_id", teacherProfileId);

    if (!classes || classes.length === 0) {
      return { students: [], total: 0 };
    }

    const classIds = classes.map((c: any) => c.id);

    // Get active enrollments
    const { data: enrollments } = await this.supabase
      .from("enrollments")
      .select("student_id")
      .in("class_id", classIds)
      .eq("status", "active");

    if (!enrollments || enrollments.length === 0) {
      return { students: [], total: 0 };
    }

    const studentIds = Array.from(
      new Set(enrollments.map((e: any) => e.student_id)),
    );

    let query = this.supabase
      .from("profiles")
      .select("*", { count: "exact" })
      .eq("role", "student")
      .in("id", studentIds);

    if (filters.search) {
      query = query.or(
        `full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`,
      );
    }
    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }
    if (filters.grade_level) {
      query = query.eq("grade_level", filters.grade_level);
    }
    if (filters.gender) {
      query = query.eq("gender", filters.gender);
    }

    query = query.range(offset, offset + limit - 1).order("full_name");

    const { data, count, error } = await query;
    if (error) throw error;

    return {
      students: (data || []) as Student[],
      total: count || 0,
    };
  }

  // ============================================================
  // STATIC METHODS FOR BACKWARD COMPATIBILITY
  // ============================================================

  static async getStudents(
    filters?: Parameters<StudentService["getStudents"]>[0],
  ) {
    return studentService.getStudents(filters);
  }

  static async getStudentById(id: string) {
    return studentService.getStudentById(id);
  }

  static async getStudentByCode(code: string) {
    return studentService.getStudentByCode(code);
  }

  static async createStudent(input: CreateStudentInput) {
    return studentService.createStudent(input);
  }

  static async updateStudent(id: string, input: UpdateStudentInput) {
    return studentService.updateStudent(id, input);
  }

  static async deleteStudent(id: string) {
    return studentService.deleteStudent(id);
  }

  static async getStudentGrades(studentId: string, classId?: string) {
    return studentService.getStudentGrades(studentId, classId);
  }

  static async getStudentAttendance(studentId: string, classId?: string) {
    return studentService.getStudentAttendance(studentId, classId);
  }

  static async enrollStudent(studentId: string, classId: string) {
    return studentService.enrollStudent(studentId, classId);
  }

  static async unenrollStudent(studentId: string, classId: string) {
    return studentService.unenrollStudent(studentId, classId);
  }
}

// Default singleton instance
export const studentService = new StudentService();
