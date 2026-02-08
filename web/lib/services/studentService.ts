import { createServiceClient } from "@/lib/supabase/server";
import { NotFoundError, ValidationError } from "@/lib/api/errors";
import type { CreateStudentInput, UpdateStudentInput } from "@/lib/schemas";
import type { SupabaseClient } from "@supabase/supabase-js";
import { StudentRepository } from "../repositories/StudentRepository";

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
  private repository: StudentRepository;

  constructor(supabase?: SupabaseClient) {
    this.supabase = supabase || createServiceClient();
    this.repository = new StudentRepository(this.supabase);
  }

  async getStudents(filters?: {
    search?: string;
    page?: number;
    pageSize?: number;
  }) {
    const result = await this.repository.findAll(filters);
    return {
      students: result.data,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    };
  }

  async getStudentById(id: string): Promise<StudentWithEnrollments> {
    const student = await this.repository.findByIdWithEnrollments(id);
    if (!student) {
      throw new NotFoundError("Student not found");
    }
    return student as unknown as StudentWithEnrollments;
  }

  async getStudentByCode(code: string): Promise<Student> {
    // Repository doesn't have findByCode yet, but let's add it or keep it here if specific
    const { data, error } = await this.supabase
      .from("profiles")
      .select(`
        *,
        student_profiles!inner (
          student_code,
          grade_level
        )
      `)
      .eq("student_profiles.student_code", code.toUpperCase())
      .eq("role", "student")
      .single();

    if (error || !data) {
      throw new NotFoundError("Không tìm thấy học sinh với mã này");
    }

    // Flatten
    const { student_profiles, ...rest } = data as any;
    return {
      ...rest,
      student_code: student_profiles?.[0]?.student_code ||
        (data as any).student_code,
      grade_level: student_profiles?.[0]?.grade_level ||
        (data as any).grade_level,
    } as Student;
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
    // Delegate to repository
    return this.repository.update(id, input as any);
  }

  async deleteStudent(id: string) {
    // Delegate to repository
    return this.repository.softDelete(id);
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
    filters: any = {},
  ) {
    const result = await this.repository.findByTeacher(
      teacherProfileId,
      filters,
    );
    return {
      students: result.data,
      total: result.total,
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
