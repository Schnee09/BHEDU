import { createServiceClient } from '@/lib/supabase/server';
import { NotFoundError, ValidationError } from '@/lib/api/errors';
import type { CreateUserInput, UpdateUserInput } from '@/lib/schemas';
import type { SupabaseClient } from '@supabase/supabase-js';
import { TeacherRepository } from '../repositories/TeacherRepository';

export interface TeacherProfile {
  id: string;
  profile_id: string;
  teacher_type: 'full_time' | 'part_time' | 'tutor';
  department?: string;
  specialization?: string;
  teaching_subjects?: string[];
  hourly_rate?: number;
  bio?: string;
  created_at: string;
  updated_at: string;
}

export class TeacherService {
  private supabase: SupabaseClient;
  private repository: TeacherRepository;

  constructor(supabase?: SupabaseClient) {
    this.supabase = supabase || createServiceClient();
    this.repository = new TeacherRepository(this.supabase);
  }

  /**
   * Syncs teacher_profile data for a profile
   */
  async syncTeacherProfile(profileId: string, data: Partial<TeacherProfile>) {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // Resolve subject names/codes to UUIDs for PostgreSQL UUID[] column
    let resolvedSubjectUuids: string[] = [];
    if (Array.isArray(data.teaching_subjects) && data.teaching_subjects.length > 0) {
      const rawItems = data.teaching_subjects;
      const validUuids = rawItems.filter((item) => UUID_REGEX.test(item));
      const namesToLookup = rawItems.filter((item) => !UUID_REGEX.test(item));

      if (namesToLookup.length > 0) {
        const { data: matchedSubjects } = await this.supabase
          .from('subjects')
          .select('id, name, code');

        if (matchedSubjects) {
          for (const name of namesToLookup) {
            const trimmed = name.trim().toLowerCase();
            const found = matchedSubjects.find(
              (s) => s.name?.toLowerCase() === trimmed || s.code?.toLowerCase() === trimmed
            );
            if (found && !validUuids.includes(found.id)) {
              validUuids.push(found.id);
            }
          }
        }
      }
      resolvedSubjectUuids = validUuids;
    }

    const { error } = await this.supabase.from('teacher_profiles').upsert(
      {
        profile_id: profileId,
        teacher_type: data.teacher_type || 'full_time',
        department: data.department,
        specialization: data.specialization,
        teaching_subjects: resolvedSubjectUuids.length > 0 ? resolvedSubjectUuids : null,
        hourly_rate: data.hourly_rate,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'profile_id' }
    );

    if (error) {
      console.error('Failed to sync teacher profile:', error);
      throw new Error('Failed to sync teacher details');
    }

    // Also sync teacher_subjects join table if any
    if (resolvedSubjectUuids.length > 0) {
      try {
        await this.supabase.from('teacher_subjects').delete().eq('profile_id', profileId);

        const joinRows = resolvedSubjectUuids.map((subId, idx) => ({
          profile_id: profileId,
          subject_id: subId,
          is_primary: idx === 0,
        }));

        await this.supabase.from('teacher_subjects').insert(joinRows);
      } catch (joinErr) {
        console.warn('Could not sync teacher_subjects join table:', joinErr);
      }
    }
  }

  /**
   * Gets a teacher profile by profile_id
   */
  async getTeacherProfile(profileId: string): Promise<TeacherProfile | null> {
    return this.getTeacherProfileByProfileId(profileId);
  }

  /**
   * Helper to get teacher profile
   */
  private async getTeacherProfileByProfileId(profileId: string): Promise<TeacherProfile | null> {
    const { data, error } = await this.supabase
      .from('teacher_profiles')
      .select('*')
      .eq('profile_id', profileId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching teacher profile:', error);
      throw error;
    }

    return data;
  }

  /**
   * Lists teachers with their profiles and class counts
   */
  async getTeachersWithStats(
    filters: {
      search?: string;
      include_staff?: boolean;
      teacher_type?: 'full_time' | 'part_time' | 'tutor' | 'all';
      page?: number;
      limit?: number;
    } = {}
  ) {
    return this.repository.findTeachersWithStats(filters);
  }

  /**
   * Lists teachers with their profiles, department, active classes, student counts, and weekly sessions
   */
  async getTeachers(filters?: { search?: string; department?: string }) {
    let query = this.supabase
      .from('profiles')
      .select(
        `
        id,
        user_id,
        full_name,
        first_name,
        last_name,
        email,
        phone,
        role,
        teacher_code,
        photo_url,
        is_active,
        created_at,
        teacher_profiles (
          department,
          specialization,
          teaching_subjects,
          bio
        ),
        classes:classes!classes_teacher_id_fkey (
          id,
          name,
          status,
          room,
          schedule,
          capacity,
          sessions_per_week,
          enrollments (
            id,
            status
          )
        )
      `
      )
      .eq('role', 'teacher')
      .is('deleted_at', null);

    if (filters?.search) {
      query = query.or(
        `full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,teacher_code.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query.order('full_name', { ascending: true });

    if (error) {
      console.error('Error fetching teachers in getTeachers:', error);
      throw error;
    }

    let results = (data || []).map((item: any) => {
      const tp = Array.isArray(item.teacher_profiles)
        ? item.teacher_profiles[0]
        : item.teacher_profiles;

      const rawClasses = Array.isArray(item.classes) ? item.classes : [];
      const activeClasses = rawClasses
        .filter((c: any) => c.status !== 'archived' && c.status !== 'deleted')
        .map((c: any) => {
          const activeEnrolls = Array.isArray(c.enrollments)
            ? c.enrollments.filter((e: any) => e.status !== 'dropped' && !e.deleted_at)
            : [];
          return {
            id: c.id,
            name: c.name,
            status: c.status,
            room: c.room,
            schedule: c.schedule,
            capacity: c.capacity,
            sessions_per_week: c.sessions_per_week || 2,
            student_count: activeEnrolls.length,
          };
        });

      const totalStudents = activeClasses.reduce(
        (sum: number, c: any) => sum + (c.student_count || 0),
        0
      );
      const weeklySessions = activeClasses.reduce(
        (sum: number, c: any) => sum + (c.sessions_per_week || 2),
        0
      );

      return {
        id: item.id,
        user_id: item.user_id,
        full_name: item.full_name,
        first_name: item.first_name,
        last_name: item.last_name,
        email: item.email,
        phone: item.phone,
        role: item.role,
        teacher_code: item.teacher_code,
        photo_url: item.photo_url,
        is_active: item.is_active,
        created_at: item.created_at,
        department: tp?.department || null,
        specialization: tp?.specialization || null,
        bio: tp?.bio || null,
        classes: activeClasses,
        class_count: activeClasses.length,
        total_students: totalStudents,
        weekly_sessions: weeklySessions,
      };
    });

    if (filters?.department) {
      results = results.filter(
        (t) => t.department?.toLowerCase() === filters.department?.toLowerCase()
      );
    }

    return results;
  }

  /**
   * Creates a new teacher (profile + teacher_profile)
   */
  async createTeacher(input: any) {
    const fullYear = new Date().getFullYear().toString();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const teacherCode = input.teacher_code || `GV${fullYear}${randomNum}`;

    // Create base profile
    const { data: profile, error: profileError } = await this.supabase
      .from('profiles')
      .insert({
        full_name: input.full_name,
        email: input.email || null,
        phone: input.phone || null,
        role: 'teacher',
        teacher_code: teacherCode,
        is_active: input.is_active !== undefined ? input.is_active : true,
      })
      .select()
      .single();

    if (profileError) {
      throw profileError;
    }

    // Create teacher profile
    const { error: teacherError } = await this.supabase.from('teacher_profiles').insert({
      profile_id: profile.id,
      teacher_type: input.teacher_type || 'full_time',
      department: input.department || null,
      specialization: input.specialization || null,
      bio: input.bio || null,
    });

    if (teacherError) {
      // Rollback
      await this.supabase.from('profiles').delete().eq('id', profile.id);
      throw teacherError;
    }

    return {
      ...profile,
      teacher_type: input.teacher_type || 'full_time',
      department: input.department,
      specialization: input.specialization,
      class_count: 0,
      classes: [],
    };
  }

  /**
   * Lists tutors with their profiles and teacher details
   */
  async getTutors(filters?: { search?: string }) {
    let query = this.supabase
      .from('profiles')
      .select(
        `
                *,
                teacher_profiles (
                    teacher_type,
                    department,
                    specialization,
                    teaching_subjects,
                    hourly_rate,
                    bio
                ),
                timetable_slots:timetable_slots!timetable_slots_teacher_id_fkey (
                    id,
                    student_id,
                    day_of_week
                )
            `
      )
      .eq('role', 'tutor')
      .is('deleted_at', null);

    if (filters?.search) {
      query = query.or(
        `full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,teacher_code.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query.order('full_name', { ascending: true }).limit(100);

    if (error) {
      console.error('Error fetching tutors:', error);
      const fallback = await this.repository.findTeachersWithStats({
        search: filters?.search,
        teacher_type: 'tutor',
        limit: 100,
      });
      return fallback.data.map((item) => ({
        id: item.id,
        full_name: item.full_name,
        email: item.email,
        phone: item.phone,
        photo_url: (item as any).photo_url,
        teacher_type: item.teacher_type,
        specialization: item.specialization,
        teaching_subjects: (item as any).teaching_subjects || [],
        hourly_rate: item.hourly_rate,
        bio: (item as any).bio,
        tutoring_student_count: 0,
      }));
    }

    // Query subjects to map UUIDs -> names
    const { data: allSubjects } = await this.supabase.from('subjects').select('id, name, code');
    const subjectMap = new Map<string, string>();
    (allSubjects || []).forEach((s: any) => {
      subjectMap.set(s.id, s.name);
    });

    return (data || []).map((item: any) => {
      const tp = Array.isArray(item.teacher_profiles)
        ? item.teacher_profiles[0]
        : item.teacher_profiles;
      const rawSubjects = tp?.teaching_subjects || [];
      const resolvedSubjects: string[] = [];
      if (Array.isArray(rawSubjects)) {
        for (const s of rawSubjects) {
          if (subjectMap.has(s)) {
            resolvedSubjects.push(subjectMap.get(s)!);
          } else {
            resolvedSubjects.push(s);
          }
        }
      }
      if (resolvedSubjects.length === 0 && tp?.department) {
        resolvedSubjects.push(
          ...tp.department
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean)
        );
      }

      const activeSlots = Array.isArray(item.timetable_slots)
        ? item.timetable_slots.filter((slot: any) => !!slot.student_id)
        : [];
      const uniqueStudentIds = new Set(activeSlots.map((slot: any) => slot.student_id));

      return {
        id: item.id,
        full_name: item.full_name,
        email: item.email,
        phone: item.phone,
        role: 'tutor',
        teacher_code: item.teacher_code || null,
        photo_url: item.photo_url || null,
        teacher_type: 'tutor',
        specialization: tp?.specialization || tp?.department || null,
        teaching_subjects: Array.from(new Set(resolvedSubjects)),
        hourly_rate: tp?.hourly_rate || null,
        bio: tp?.bio || null,
        tutoring_slots_count: activeSlots.length,
        tutoring_student_count: uniqueStudentIds.size,
      };
    });
  }

  /**
   * Creates a new tutor (profile + teacher_profile)
   */
  async createTutor(input: any) {
    const fullYear = new Date().getFullYear().toString();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const teacherCode = input.teacher_code || `GS${fullYear}${randomNum}`;

    // Create base profile
    const { data: profile, error: profileError } = await this.supabase
      .from('profiles')
      .insert({
        full_name: input.full_name,
        email: input.email || null,
        phone: input.phone || null,
        role: 'tutor',
        teacher_code: teacherCode,
        is_active: true,
      })
      .select()
      .single();

    if (profileError) {
      throw profileError;
    }

    // Create teacher profile
    const { error: teacherError } = await this.supabase.from('teacher_profiles').insert({
      profile_id: profile.id,
      teacher_type: 'tutor',
      specialization: input.specialization || null,
      teaching_subjects: input.teaching_subjects || [],
      hourly_rate: input.hourly_rate || null,
      bio: input.bio || null,
    });

    if (teacherError) {
      // Rollback
      await this.supabase.from('profiles').delete().eq('id', profile.id);
      throw teacherError;
    }

    return {
      ...profile,
      teacher_type: 'tutor',
      specialization: input.specialization,
      teaching_subjects: input.teaching_subjects,
    };
  }

  // ============================================================
  // STATIC METHODS FOR BACKWARD COMPATIBILITY
  // ============================================================

  static async syncTeacherProfile(profileId: string, data: Partial<TeacherProfile>) {
    return teacherService.syncTeacherProfile(profileId, data);
  }

  static async getTeacherProfile(profileId: string) {
    return teacherService.getTeacherProfile(profileId);
  }

  static async getTeachersWithStats(filters: any) {
    return teacherService.getTeachersWithStats(filters);
  }
}

// Default singleton instance
export const teacherService = new TeacherService();
