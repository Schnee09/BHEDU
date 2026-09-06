/**
 * Class Repository
 *
 * Handles all database operations for classes.
 * Follows Single Responsibility Principle - only data access, no business logic.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { BaseRepository, type PaginatedResult, type PaginationParams } from './base';

// ============================================
// Types
// ============================================

export interface Class {
  id: string;
  name: string;
  teacher_id: string | null;
  subject_id: string | null;
  course_id?: string | null;
  room: string | null;
  schedule: string | null;
  capacity: number | null;
  academic_year_id: string | null;
  grade_level: string | null;
  status: 'active' | 'inactive' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface ClassWithDetails extends Class {
  teacher?: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    full_name?: string | null;
    email?: string;
  } | null;
  subject?: {
    id: string;
    name: string;
    code: string;
  } | null;
  course?: {
    id: string;
    name: string;
    code: string;
  } | null;
  academic_year?: {
    id: string;
    name: string;
  } | null;
  _count?: {
    enrollments: number;
  };
  enrollment_count?: number; // Backward compatibility
  code?: string | null; // Flattened from course/subject code
}

export interface ClassFilters extends PaginationParams {
  search?: string;
  status?: string;
  teacher_id?: string;
  academic_year_id?: string;
}

export interface CreateClassInput {
  name: string;
  teacher_id?: string | null;
  subject_id?: string | null;
  course_id?: string | null;
  room?: string | null;
  schedule?: string | null;
  capacity?: number | null;
  academic_year_id?: string | null;
  status?: 'active' | 'inactive';
  days_of_week?: number[];
  auto_schedule?: boolean;
}

export interface UpdateClassInput {
  name?: string;
  teacher_id?: string | null;
  subject_id?: string | null;
  course_id?: string | null;
  room?: string | null;
  schedule?: string | null;
  capacity?: number | null;
  academic_year_id?: string | null;
  status?: 'active' | 'inactive' | 'completed';
}

// ============================================
// Repository Interface (for DIP)
// ============================================

export interface IClassRepository {
  findById(id: string): Promise<Class | null>;
  findByIdWithDetails(id: string): Promise<ClassWithDetails | null>;
  findAll(filters?: ClassFilters): Promise<PaginatedResult<ClassWithDetails>>;
  findByTeacher(teacherId: string): Promise<Class[]>;
  findByStudent(
    studentId: string,
    filters?: ClassFilters
  ): Promise<PaginatedResult<ClassWithDetails>>;
  create(data: CreateClassInput): Promise<Class>;
  update(id: string, data: UpdateClassInput): Promise<Class>;
  delete(id: string): Promise<void>;
  getEnrollmentCount(classId: string): Promise<number>;
  getClassStudents(classId: string): Promise<any[]>;
}

// ============================================
// Repository Implementation
// ============================================

export class ClassRepository
  extends BaseRepository<Class, CreateClassInput, UpdateClassInput>
  implements IClassRepository
{
  protected override readonly tableName = 'classes';
  protected override readonly primaryKey = 'id';
  protected override readonly useSoftDelete = false;

  constructor(supabase: SupabaseClient) {
    super(supabase);
  }

  /**
   * Find class by ID with teacher and course details
   * Optimized to use parallel queries for maximum resilience
   */
  async findByIdWithDetails(id: string): Promise<ClassWithDetails | null> {
    const { data: cls, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !cls) return null;

    const subjectOrCourseId = cls.subject_id || cls.course_id;

    const [teacherRes, subjectRes, academicYearRes, countRes] = await Promise.all([
      cls.teacher_id
        ? this.supabase
            .from('profiles')
            .select('id, first_name, last_name, full_name, email')
            .eq('id', cls.teacher_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      subjectOrCourseId
        ? this.supabase
            .from('subjects')
            .select('id, name, code')
            .eq('id', subjectOrCourseId)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      cls.academic_year_id
        ? this.supabase
            .from('academic_years')
            .select('id, name')
            .eq('id', cls.academic_year_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      this.supabase
        .from('enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('class_id', id),
    ]);

    const subject = subjectRes.data || null;

    return {
      ...cls,
      teacher: teacherRes.data || null,
      subject,
      course: subject,
      code: cls.code || subject?.code || null,
      academic_year: academicYearRes.data || null,
      enrollment_count: countRes.count || 0,
      _count: { enrollments: countRes.count || 0 },
    } as ClassWithDetails;
  }

  /**
   * Helper to enrich an array of raw classes with relations
   */
  private async enrichClasses(classesList: any[]): Promise<ClassWithDetails[]> {
    if (classesList.length === 0) return [];

    const teacherIds = Array.from(new Set(classesList.map((c) => c.teacher_id).filter(Boolean)));
    const subjectIds = Array.from(
      new Set(classesList.map((c) => c.subject_id || c.course_id).filter(Boolean))
    );
    const academicYearIds = Array.from(
      new Set(classesList.map((c) => c.academic_year_id).filter(Boolean))
    );
    const classIds = classesList.map((c) => c.id);

    const [teachersRes, subjectsRes, yearsRes, enrollmentsRes] = await Promise.all([
      teacherIds.length > 0
        ? this.supabase
            .from('profiles')
            .select('id, first_name, last_name, full_name, email')
            .in('id', teacherIds)
        : Promise.resolve({ data: [] }),
      subjectIds.length > 0
        ? this.supabase.from('subjects').select('id, name, code').in('id', subjectIds)
        : Promise.resolve({ data: [] }),
      academicYearIds.length > 0
        ? this.supabase.from('academic_years').select('id, name').in('id', academicYearIds)
        : Promise.resolve({ data: [] }),
      classIds.length > 0
        ? this.supabase.from('enrollments').select('class_id')
        : Promise.resolve({ data: [] }),
    ]);

    const teacherMap = new Map((teachersRes.data || []).map((t: any) => [t.id, t]));
    const subjectMap = new Map((subjectsRes.data || []).map((s: any) => [s.id, s]));
    const yearMap = new Map((yearsRes.data || []).map((y: any) => [y.id, y]));

    const countMap = new Map<string, number>();
    (enrollmentsRes.data || []).forEach((e: any) => {
      countMap.set(e.class_id, (countMap.get(e.class_id) || 0) + 1);
    });

    return classesList.map((cls: any) => {
      const teacher = cls.teacher_id ? teacherMap.get(cls.teacher_id) || null : null;
      const subjectOrCourseId = cls.subject_id || cls.course_id;
      const subject = subjectOrCourseId ? subjectMap.get(subjectOrCourseId) || null : null;
      const academicYear = cls.academic_year_id ? yearMap.get(cls.academic_year_id) || null : null;
      const enrollmentCount = countMap.get(cls.id) || 0;

      return {
        ...cls,
        teacher,
        subject,
        course: subject,
        academic_year: academicYear,
        code: cls.code || subject?.code || null,
        enrollment_count: enrollmentCount,
        _count: { enrollments: enrollmentCount },
      };
    }) as ClassWithDetails[];
  }

  /**
   * Find all classes with filters and pagination
   */
  async findAll(filters: ClassFilters = {}): Promise<PaginatedResult<ClassWithDetails>> {
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;

    let query = this.supabase.from(this.tableName).select('*', { count: 'exact' });

    // Apply filters
    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.teacher_id) {
      query = query.eq('teacher_id', filters.teacher_id);
    }

    if (filters.academic_year_id) {
      query = query.eq('academic_year_id', filters.academic_year_id);
    }

    const { data, error, count } = await query.range(start, end).order('name', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch classes: ${error.message}`);
    }

    const resultData = await this.enrichClasses(data || []);

    return {
      data: resultData,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }

  /**
   * Find classes assigned to a teacher
   */
  async findByTeacher(teacherId: string): Promise<Class[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('teacher_id', teacherId)
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch teacher's classes: ${error.message}`);
    }

    return (data || []) as Class[];
  }

  /**
   * Find all classes a student is enrolled in
   */
  async findByStudent(
    studentId: string,
    filters: ClassFilters = {}
  ): Promise<PaginatedResult<ClassWithDetails>> {
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;

    // First, get the class IDs the student is enrolled in
    const { data: enrollments } = await this.supabase
      .from('enrollments')
      .select('class_id')
      .eq('student_id', studentId)
      .in('status', ['enrolled', 'active']);

    const classIds = enrollments?.map((e: any) => e.class_id) || [];

    if (classIds.length === 0) {
      return {
        data: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
      };
    }

    let query = this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact' })
      .in('id', classIds);

    // Apply filters matching findAll
    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.teacher_id) {
      query = query.eq('teacher_id', filters.teacher_id);
    }

    if (filters.academic_year_id) {
      query = query.eq('academic_year_id', filters.academic_year_id);
    }

    const { data, error, count } = await query.range(start, end).order('name', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch student classes: ${error.message}`);
    }

    const resultData = await this.enrichClasses(data || []);

    return {
      data: resultData,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }

  private sanitizeClassPayload(data: Record<string, any>) {
    const payload: Record<string, any> = {};

    if (data.name !== undefined) payload.name = data.name;
    if (data.teacher_id !== undefined) payload.teacher_id = data.teacher_id;
    if (data.subject_id !== undefined) payload.subject_id = data.subject_id;
    if (data.academic_year_id !== undefined) payload.academic_year_id = data.academic_year_id;
    if (data.room !== undefined) payload.room = data.room;
    if (data.schedule !== undefined) payload.schedule = data.schedule;
    if (data.status !== undefined) payload.status = data.status;
    if (data.grade_level !== undefined) payload.grade_level = data.grade_level;

    const capacityVal = data.capacity !== undefined ? data.capacity : data.max_capacity;
    if (capacityVal !== undefined) {
      payload.capacity = capacityVal;
      payload.max_capacity = capacityVal;
    }

    return payload;
  }

  override async create(data: CreateClassInput): Promise<Class> {
    const dbData = this.sanitizeClassPayload(data as any);

    const { data: created, error } = await this.supabase
      .from(this.tableName)
      .insert(dbData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create class: ${error.message}`);
    }

    const createdClass = created as Class;

    // Auto-create timetable slots if schedule is defined and auto_schedule is not disabled
    if (data.schedule && data.auto_schedule !== false) {
      try {
        const timeMatch = data.schedule.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
        if (timeMatch && timeMatch[1] && timeMatch[2]) {
          const startTime = timeMatch[1].padStart(5, '0') + ':00';
          const endTime = timeMatch[2].padStart(5, '0') + ':00';
          const daysToSchedule: number[] =
            Array.isArray(data.days_of_week) && data.days_of_week.length > 0
              ? data.days_of_week
              : [0, 2, 4]; // Default: T2, T4, T6

          const { data: activeSemester } = await this.supabase
            .from('semesters')
            .select('id')
            .eq('is_active', true)
            .maybeSingle();

          const slotsToInsert = daysToSchedule.map((day: number) => ({
            class_id: createdClass.id,
            subject_id: data.subject_id || null,
            teacher_id: data.teacher_id || null,
            room: data.room || null,
            day_of_week: day,
            start_time: startTime,
            end_time: endTime,
            semester_id: activeSemester?.id || null,
          }));

          await this.supabase.from('timetable_slots').insert(slotsToInsert);
        }
      } catch (slotErr) {
        console.warn('[ClassRepository] Auto timetable slot generation failed:', slotErr);
      }
    }

    return createdClass;
  }

  /**
   * Delete class with cleanup for related records
   */
  override async delete(id: string): Promise<void> {
    const now = new Date().toISOString();

    // Clean up associated enrollments and timetable slots
    await Promise.allSettled([
      this.supabase.from('enrollments').update({ status: 'cancelled' }).eq('class_id', id),
      this.supabase.from('timetable_slots').delete().eq('class_id', id),
    ]);

    await super.delete(id);
  }

  override async update(id: string, data: UpdateClassInput): Promise<Class> {
    const dbData = this.sanitizeClassPayload(data as any);

    const { data: updated, error } = await this.supabase
      .from(this.tableName)
      .update(dbData)
      .eq(this.primaryKey, id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update class: ${error.message}`);
    }

    // Cascade updates to existing timetable_slots for this class
    const slotUpdates: Record<string, any> = {};
    if ('teacher_id' in data) slotUpdates.teacher_id = data.teacher_id || null;
    if ('subject_id' in data) slotUpdates.subject_id = data.subject_id || null;
    if ('room' in data) slotUpdates.room = data.room || null;

    if (Object.keys(slotUpdates).length > 0) {
      await this.supabase.from('timetable_slots').update(slotUpdates).eq('class_id', id);
    }

    return updated as Class;
  }

  /**
   * Get enrollment count for a class
   */
  async getEnrollmentCount(classId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('class_id', classId)
      .in('status', ['enrolled', 'active']);

    if (error) {
      throw new Error(`Failed to count enrollments: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * Get all students in a class
   */
  async getClassStudents(classId: string): Promise<any[]> {
    const { data: enrollments, error } = await this.supabase
      .from('enrollments')
      .select(
        `
        id,
        student_id,
        status,
        enrollment_date,
        profiles:student_id (
          id,
          email,
          full_name,
          student_code,
          grade_level
        )
      `
      )
      .eq('class_id', classId);

    if (error) {
      throw new Error(`Failed to fetch class students: ${error.message}`);
    }

    // Flatten for consistent API response ensuring student UUID is preserved
    return (enrollments || [])
      .map((e) => {
        const profile = (e.profiles as any) || {};
        const studentUuid = e.student_id || profile.id;
        return {
          id: studentUuid,
          student_id: studentUuid,
          user_id: studentUuid,
          enrollment_id: e.id,
          status: e.status || 'active',
          enrollment_date: e.enrollment_date,
          full_name: profile.full_name,
          email: profile.email,
          student_code: profile.student_code,
          grade_level: profile.grade_level,
          cid: profile.student_id || null,
        };
      })
      .filter((s) => s.full_name && s.id);
  }
}
