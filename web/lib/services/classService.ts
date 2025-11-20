/**
 * Class Service - Business logic for class management
 */

import { createClient } from '@/lib/supabase/server';
import { NotFoundError, ValidationError } from '@/lib/api/errors';
import type { CreateClassInput, UpdateClassInput } from '@/lib/api/schemas';

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

export class ClassService {
  /**
   * Get all classes with optional filters
   */
  static async getClasses(filters?: {
    courseId?: string;
    teacherId?: string;
    academicYearId?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }) {
    const supabase = await createClient();
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 20;
    const offset = (page - 1) * pageSize;

    let query = supabase
      .from('classes')
      .select(`
        *,
        courses (id, name, code),
        teacher:profiles!teacher_id (id, first_name, last_name, email),
        academic_years (id, name, start_date, end_date)
      `, { count: 'exact' });

    // Apply filters
    if (filters?.courseId) {
      query = query.eq('course_id', filters.courseId);
    }

    if (filters?.teacherId) {
      query = query.eq('teacher_id', filters.teacherId);
    }

    if (filters?.academicYearId) {
      query = query.eq('academic_year_id', filters.academicYearId);
    }

    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    // Pagination
    query = query.range(offset, offset + pageSize - 1).order('name');

    const { data, error, count } = await query;

    if (error) {
      console.error('Failed to fetch classes:', error);
      throw new Error('Failed to fetch classes');
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
  static async getClassById(id: string): Promise<ClassWithDetails> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        courses (id, name, code),
        teacher:profiles!teacher_id (id, first_name, last_name, email),
        academic_years (id, name, start_date, end_date)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundError('Class not found');
    }

    // Get enrollment count
    const { count } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('class_id', id)
      .eq('status', 'active');

    return {
      ...data,
      _count: { enrollments: count || 0 },
    } as ClassWithDetails;
  }

  /**
   * Create a new class
   */
  static async createClass(input: CreateClassInput) {
    const supabase = await createClient();

    // Verify course exists
    const { data: course } = await supabase
      .from('courses')
      .select('id')
      .eq('id', input.course_id)
      .single();

    if (!course) {
      throw new ValidationError('Course not found');
    }

    // Verify teacher exists and has teacher role
    const { data: teacher } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', input.teacher_id)
      .single();

    if (!teacher) {
      throw new ValidationError('Teacher not found');
    }

    if (teacher.role !== 'teacher' && teacher.role !== 'admin') {
      throw new ValidationError('User must have teacher or admin role');
    }

    // Verify academic year exists
    const { data: academicYear } = await supabase
      .from('academic_years')
      .select('id')
      .eq('id', input.academic_year_id)
      .single();

    if (!academicYear) {
      throw new ValidationError('Academic year not found');
    }

    const { data, error } = await supabase
      .from('classes')
      .insert({
        name: input.name,
        course_id: input.course_id,
        teacher_id: input.teacher_id,
        academic_year_id: input.academic_year_id,
        schedule: input.schedule || null,
        room: input.room || null,
        capacity: input.capacity || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create class:', error);
      throw new Error('Failed to create class');
    }

    return data;
  }

  /**
   * Update a class
   */
  static async updateClass(id: string, input: UpdateClassInput) {
    const supabase = await createClient();

    // Check if class exists
    await this.getClassById(id);

    // Validate teacher if provided
    if (input.teacher_id) {
      const { data: teacher } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', input.teacher_id)
        .single();

      if (!teacher) {
        throw new ValidationError('Teacher not found');
      }

      if (teacher.role !== 'teacher' && teacher.role !== 'admin') {
        throw new ValidationError('User must have teacher or admin role');
      }
    }

    // Validate course if provided
    if (input.course_id) {
      const { data: course } = await supabase
        .from('courses')
        .select('id')
        .eq('id', input.course_id)
        .single();

      if (!course) {
        throw new ValidationError('Course not found');
      }
    }

    // Validate academic year if provided
    if (input.academic_year_id) {
      const { data: academicYear } = await supabase
        .from('academic_years')
        .select('id')
        .eq('id', input.academic_year_id)
        .single();

      if (!academicYear) {
        throw new ValidationError('Academic year not found');
      }
    }

    const { data, error } = await supabase
      .from('classes')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update class:', error);
      throw new Error('Failed to update class');
    }

    return data;
  }

  /**
   * Delete a class
   */
  static async deleteClass(id: string) {
    const supabase = await createClient();

    // Check if class exists
    await this.getClassById(id);

    // Check if class has any enrollments
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('id')
      .eq('class_id', id)
      .limit(1);

    if (enrollments && enrollments.length > 0) {
      throw new ValidationError('Cannot delete class with existing enrollments');
    }

    const { error } = await supabase.from('classes').delete().eq('id', id);

    if (error) {
      console.error('Failed to delete class:', error);
      throw new Error('Failed to delete class');
    }
  }

  /**
   * Get students enrolled in a class
   */
  static async getClassStudents(classId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        id,
        enrollment_date,
        status,
        student:profiles!student_id (
          id,
          first_name,
          last_name,
          email,
          full_name
        )
      `)
      .eq('class_id', classId)
      .eq('status', 'active')
      .order('student.last_name');

    if (error) {
      console.error('Failed to fetch class students:', error);
      throw new Error('Failed to fetch class students');
    }

    return data;
  }

  /**
   * Get assignments for a class
   */
  static async getClassAssignments(classId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('class_id', classId)
      .order('due_date', { ascending: false });

    if (error) {
      console.error('Failed to fetch assignments:', error);
      throw new Error('Failed to fetch assignments');
    }

    return data;
  }

  /**
   * Get attendance records for a class
   */
  static async getClassAttendance(classId: string, date?: string) {
    const supabase = await createClient();

    let query = supabase
      .from('attendance')
      .select(`
        *,
        student:profiles!student_id (
          id,
          first_name,
          last_name,
          full_name
        )
      `)
      .eq('class_id', classId)
      .order('date', { ascending: false });

    if (date) {
      query = query.eq('date', date);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch attendance:', error);
      throw new Error('Failed to fetch attendance');
    }

    return data;
  }

  /**
   * Get grade statistics for a class
   */
  static async getClassGradeStats(classId: string) {
    const supabase = await createClient();

    // Get all assignments for the class
    const { data: assignments } = await supabase
      .from('assignments')
      .select('id, total_points')
      .eq('class_id', classId);

    if (!assignments || assignments.length === 0) {
      return {
        averageGrade: 0,
        highestGrade: 0,
        lowestGrade: 0,
        totalAssignments: 0,
      };
    }

    // Get all grades for these assignments
    const assignmentIds = assignments.map((a) => a.id);
    const { data: grades } = await supabase
      .from('grades')
      .select('points_earned, assignment_id')
      .in('assignment_id', assignmentIds);

    if (!grades || grades.length === 0) {
      return {
        averageGrade: 0,
        highestGrade: 0,
        lowestGrade: 0,
        totalAssignments: assignments.length,
      };
    }

    // Calculate percentages
    const percentages = grades.map((grade) => {
      const assignment = assignments.find((a) => a.id === grade.assignment_id);
      if (!assignment || assignment.total_points === 0) return 0;
      return (grade.points_earned / assignment.total_points) * 100;
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
  static async getTeacherClasses(teacherId: string, academicYearId?: string) {
    return this.getClasses({ teacherId, academicYearId });
  }
}
