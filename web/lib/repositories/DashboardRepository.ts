import { BaseRepository } from './base';
import { UserRole } from '@/lib/auth/core';
import { SupabaseClient } from '@supabase/supabase-js';

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalAssignments: number;
  attendanceToday: number;
  averageGPA?: number;
  attendanceRate?: number;
  passRate?: number;
}

export interface ActivityLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: any;
  created_at: string;
  full_name: string | null;
  photo_url: string | null;
}

export class DashboardRepository extends BaseRepository<any, any, any> {
  protected readonly tableName = 'audit_logs';
  protected readonly primaryKey = 'id';

  constructor(supabase: SupabaseClient) {
    super(supabase);
  }

  /**
   * Get basic counts for the dashboard
   */
  async getBasicStats(role: UserRole, profileId: string): Promise<DashboardStats> {
    const today = new Date().toISOString().split('T')[0];

    // Determine visibility
    const isStaff = role === 'super_admin' || role === 'admin' || role === 'staff';
    const isStudent = role === 'student';

    let studentClassIds: string[] = [];
    if (isStudent) {
      const { data } = await this.supabase
        .from('enrollments')
        .select('class_id')
        .eq('student_id', profileId)
        .in('status', ['enrolled', 'active']);
      studentClassIds = data?.map((e: any) => e.class_id) || [];
    }

    const [
      studentsCount,
      teachersCount,
      classesCount,
      assignmentsCount,
      attendanceCount,
      schoolMetricsRpc,
    ] = await Promise.all([
      // 1. Total Students
      this.supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'student'),

      // 2. Total Teachers
      this.supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'teacher'),

      // 3. Classes (role-based)
      isStaff
        ? this.supabase.from('classes').select('id', {
            count: 'exact',
            head: true,
          })
        : isStudent
          ? studentClassIds.length > 0
            ? this.supabase
                .from('classes')
                .select('id', {
                  count: 'exact',
                  head: true,
                })
                .in('id', studentClassIds)
            : Promise.resolve({ count: 0 })
          : this.supabase
              .from('classes')
              .select('id', {
                count: 'exact',
                head: true,
              })
              .eq('teacher_id', profileId),

      // 4. Assignments (role-based)
      this.getAssignmentCount(isStaff, isStudent, profileId, studentClassIds),

      // 5. Attendance Today
      isStudent
        ? this.supabase
            .from('attendance')
            .select('id', { count: 'exact', head: true })
            .eq('date', today)
            .eq('student_id', profileId)
        : this.supabase
            .from('attendance')
            .select('id', { count: 'exact', head: true })
            .eq('date', today),

      // 6. Global Analytics from RPC (only needed for Staff/Teachers)
      isStaff || role === 'teacher'
        ? this.supabase.rpc('get_school_metrics')
        : Promise.resolve({ data: null }),
    ]);

    const schoolMetrics =
      schoolMetricsRpc && Array.isArray(schoolMetricsRpc?.data) && schoolMetricsRpc.data.length > 0
        ? schoolMetricsRpc.data[0]
        : null;

    return {
      totalStudents: studentsCount?.count || 0,
      totalTeachers: teachersCount?.count || 0,
      totalClasses: classesCount?.count || 0,
      totalAssignments: assignmentsCount?.count || 0,
      attendanceToday: attendanceCount?.count || 0,
      averageGPA: schoolMetrics ? parseFloat(schoolMetrics.average_gpa) : undefined,
      attendanceRate: schoolMetrics ? parseFloat(schoolMetrics.attendance_rate) : undefined,
      passRate: schoolMetrics ? parseFloat(schoolMetrics.pass_rate) : undefined,
    };
  }

  /**
   * Get recent system activity logs with filtering and pagination
   */
  async getRecentActivity(
    limit: number,
    role: UserRole,
    profileId: string,
    filters: { action?: string; entityType?: string; offset?: number } = {}
  ): Promise<{ items: ActivityLog[]; total: number }> {
    let query = this.supabase
      .from('audit_logs')
      .select(
        `
        id,
        action,
        entity_type,
        entity_id,
        metadata,
        created_at,
        profiles (full_name, photo_url)
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false });

    // Non-admin roles only see their own activity
    if (role !== 'super_admin' && role !== 'admin') {
      query = query.eq('user_id', profileId);
    }

    // Apply filters
    if (filters.action) {
      query = query.eq('action', filters.action);
    }
    if (filters.entityType) {
      query = query.eq('entity_type', filters.entityType);
    }

    // Pagination
    const offset = filters.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch activity logs: ${error.message}`);
    }

    const items = (data || []).map((item: any) => ({
      ...item,
      full_name: item.profiles?.full_name || null,
      photo_url: item.profiles?.photo_url || null,
    }));

    return { items, total: count || 0 };
  }

  private async getAssignmentCount(
    isStaff: boolean,
    isStudent: boolean,
    profileId: string,
    studentClassIds: string[] = []
  ): Promise<{ count: number }> {
    if (isStaff) {
      const { count } = await this.supabase
        .from('assignments')
        .select('id', { count: 'exact', head: true });
      return { count: count || 0 };
    }

    if (isStudent) {
      if (studentClassIds.length === 0) return { count: 0 };
      const { count } = await this.supabase
        .from('assignments')
        .select('id', { count: 'exact', head: true })
        .in('class_id', studentClassIds);
      return { count: count || 0 };
    }

    // For teachers, we need to join through classes
    const { data: teacherClasses } = await this.supabase
      .from('classes')
      .select('id')
      .eq('teacher_id', profileId);

    const classIds = teacherClasses?.map((c: any) => c.id) || [];
    if (classIds.length === 0) return { count: 0 };

    const { count } = await this.supabase
      .from('assignments')
      .select('id', { count: 'exact', head: true })
      .in('class_id', classIds);

    return { count: count || 0 };
  }
}
