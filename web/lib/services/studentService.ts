/**
 * Student Service - Business logic for student management
 */

import { createClient } from '@/lib/supabase/server';
import { NotFoundError, ValidationError } from '@/lib/api/errors';
import type { CreateStudentInput, UpdateStudentInput } from '@/lib/api/schemas';

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
  /**
   * Get all students with optional filters
   */
  static async getStudents(filters?: {
    search?: string;
    page?: number;
    pageSize?: number;
  }) {
    const supabase = await createClient();
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 20;
    const offset = (page - 1) * pageSize;

    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .eq('role', 'student');

    // Apply search filter
    if (filters?.search) {
      query = query.or(
        `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
      );
    }

    // Pagination
    query = query.range(offset, offset + pageSize - 1).order('last_name');

    const { data, error, count } = await query;

    if (error) {
      console.error('Failed to fetch students:', error);
      throw new Error('Failed to fetch students');
    }

    return {
      students: data || [],
      total: count || 0,
      page,
      pageSize,
    };
  }

  /**
   * Get a single student by ID with enrollments
   */
  static async getStudentById(id: string): Promise<StudentWithEnrollments> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('profiles')
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
      .single();

    if (error || !data) {
      throw new NotFoundError('Student not found');
    }

    return data as StudentWithEnrollments;
  }

  /**
   * Create a new student
   */
  static async createStudent(input: CreateStudentInput) {
    const supabase = await createClient();

    // Check if email already exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', input.email)
      .single();

    if (existing) {
      throw new ValidationError('Email already exists');
    }

    // First create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: input.email,
      email_confirm: true,
      user_metadata: {
        first_name: input.first_name,
        last_name: input.last_name,
        role: 'student',
      },
    });

    if (authError || !authData.user) {
      console.error('Failed to create auth user:', authError);
      throw new Error('Failed to create student account');
    }

    // Profile should be created automatically by trigger, but we can update it
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update({
        first_name: input.first_name,
        last_name: input.last_name,
        full_name: `${input.first_name} ${input.last_name}`,
        date_of_birth: input.date_of_birth,
        phone: input.phone || null,
        address: input.address || null,
        emergency_contact: input.emergency_contact || null,
        role: 'student',
      })
      .eq('id', authData.user.id)
      .select()
      .single();

    if (profileError) {
      console.error('Failed to update profile:', profileError);
      // Try to clean up auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw new Error('Failed to create student profile');
    }

    return profile;
  }

  /**
   * Update a student
   */
  static async updateStudent(id: string, input: UpdateStudentInput) {
    const supabase = await createClient();

    // Check if student exists
    await this.getStudentById(id);

    // If updating email, check for duplicates
    if (input.email) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', input.email)
        .neq('id', id)
        .single();

      if (existing) {
        throw new ValidationError('Email already exists');
      }
    }

    // Build update object
    const updates: Partial<Student> = {};
    if (input.first_name) updates.first_name = input.first_name;
    if (input.last_name) updates.last_name = input.last_name;
    if (input.first_name || input.last_name) {
      const firstName = input.first_name || '';
      const lastName = input.last_name || '';
      updates.full_name = `${firstName} ${lastName}`.trim();
    }
    if (input.email) updates.email = input.email;
    if (input.date_of_birth) updates.date_of_birth = input.date_of_birth;
    if (input.phone !== undefined) updates.phone = input.phone || null;
    if (input.address !== undefined) updates.address = input.address || null;
    if (input.emergency_contact !== undefined) {
      updates.emergency_contact = input.emergency_contact || null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update student:', error);
      throw new Error('Failed to update student');
    }

    return data;
  }

  /**
   * Delete a student (soft delete)
   */
  static async deleteStudent(id: string) {
    const supabase = await createClient();

    // Check if student exists
    await this.getStudentById(id);

    // Check if student has active enrollments
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', id)
      .eq('status', 'active')
      .limit(1);

    if (enrollments && enrollments.length > 0) {
      throw new ValidationError('Cannot delete student with active enrollments');
    }

    // Soft delete by deactivating auth account
    const { error } = await supabase.auth.admin.deleteUser(id);

    if (error) {
      console.error('Failed to delete student:', error);
      throw new Error('Failed to delete student');
    }
  }

  /**
   * Get student's grades
   */
  static async getStudentGrades(studentId: string, classId?: string) {
    const supabase = await createClient();

    let query = supabase
      .from('grades')
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
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (classId) {
      query = query.eq('assignments.class_id', classId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch student grades:', error);
      throw new Error('Failed to fetch student grades');
    }

    return data;
  }

  /**
   * Get student's attendance records
   */
  static async getStudentAttendance(studentId: string, classId?: string) {
    const supabase = await createClient();

    let query = supabase
      .from('attendance')
      .select(`
        *,
        classes (
          id,
          name
        )
      `)
      .eq('student_id', studentId)
      .order('date', { ascending: false });

    if (classId) {
      query = query.eq('class_id', classId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch attendance:', error);
      throw new Error('Failed to fetch attendance');
    }

    return data;
  }

  /**
   * Enroll student in a class
   */
  static async enrollStudent(studentId: string, classId: string) {
    const supabase = await createClient();

    // Check if student exists
    await this.getStudentById(studentId);

    // Check if already enrolled
    const { data: existing } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', studentId)
      .eq('class_id', classId)
      .single();

    if (existing) {
      throw new ValidationError('Student already enrolled in this class');
    }

    const { data, error } = await supabase
      .from('enrollments')
      .insert({
        student_id: studentId,
        class_id: classId,
        enrollment_date: new Date().toISOString().split('T')[0],
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to enroll student:', error);
      throw new Error('Failed to enroll student');
    }

    return data;
  }

  /**
   * Unenroll student from a class
   */
  static async unenrollStudent(studentId: string, classId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('enrollments')
      .update({ status: 'withdrawn' })
      .eq('student_id', studentId)
      .eq('class_id', classId)
      .select()
      .single();

    if (error) {
      console.error('Failed to unenroll student:', error);
      throw new Error('Failed to unenroll student');
    }

    return data;
  }
}
