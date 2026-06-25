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
    const isStaff = role === 'super_admin' || role === 'owner' || role === 'admin';
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

  /**
   * Get teacher-specific dashboard stats
   */
  async getTeacherStats(teacherId: string): Promise<{
    myClassCount: number;
    myStudentCount: number;
    myClassesAvgGPA: number;
    todayAttendanceMarked: boolean;
    todaySlotsCount: number;
  }> {
    const today = new Date().toISOString().split('T')[0];
    const jsDay = new Date().getDay();
    const dayIndex = jsDay === 0 ? 6 : jsDay - 1;

    // 1. Get class list
    const { data: classesData } = await this.supabase
      .from('classes')
      .select('id')
      .eq('teacher_id', teacherId);

    const classIds = classesData?.map((c: any) => c.id) || [];
    const myClassCount = classIds.length;

    // 2. Student count (unique students enrolled in these classes)
    let myStudentCount = 0;
    if (myClassCount > 0) {
      const { data: enrollmentsData } = await this.supabase
        .from('enrollments')
        .select('student_id')
        .in('class_id', classIds)
        .in('status', ['enrolled', 'active']);
      const studentIds = enrollmentsData?.map((e: any) => e.student_id) || [];
      myStudentCount = new Set(studentIds).size;
    }

    // 3. Average GPA
    let myClassesAvgGPA = 0;
    const { data: classAverages } = await this.supabase.rpc('get_class_averages', {
      p_teacher_id: teacherId,
    });
    if (classAverages && classAverages.length > 0) {
      const sum = classAverages.reduce(
        (acc: number, item: any) => acc + (parseFloat(item.average_gpa) || 0),
        0
      );
      myClassesAvgGPA = parseFloat((sum / classAverages.length).toFixed(2));
    }

    // 4. Attendance Today marked
    let todayAttendanceMarked = false;
    if (myClassCount > 0) {
      const { count } = await this.supabase
        .from('attendance')
        .select('id', { count: 'exact', head: true })
        .eq('date', today)
        .in('class_id', classIds);
      todayAttendanceMarked = (count || 0) > 0;
    }

    // 5. Today's slots count
    const { count: slotsCount } = await this.supabase
      .from('timetable_slots')
      .select('id', { count: 'exact', head: true })
      .eq('teacher_id', teacherId)
      .eq('day_of_week', dayIndex)
      .is('deleted_at', null);

    const todaySlotsCount = slotsCount || 0;

    return {
      myClassCount,
      myStudentCount,
      myClassesAvgGPA,
      todayAttendanceMarked,
      todaySlotsCount,
    };
  }

  /**
   * Get student-specific dashboard stats
   */
  async getStudentStats(studentId: string): Promise<{
    gpa: number;
    rank: number;
    totalRanked: number;
    attendanceRate: number;
    totalClasses: number;
    upcomingAssignments: number;
    upcomingAssignmentsList: any[];
    trend: 'up' | 'down' | 'stable';
  }> {
    // 1. Get GPA and Rank from rankings
    const { data: rankings } = await this.supabase.rpc('get_student_rankings', { p_limit: 1000 });
    const myRank = rankings?.find((r: any) => r.student_id === studentId);

    const gpa = myRank ? parseFloat(myRank.average) : 0;
    const rank = myRank ? parseInt(myRank.rank) : 0;
    const totalRanked = rankings?.length || 0;

    // 2. Total classes enrolled
    const { data: enrollments } = await this.supabase
      .from('enrollments')
      .select('class_id')
      .eq('student_id', studentId)
      .in('status', ['enrolled', 'active']);
    const classIds = enrollments?.map((e: any) => e.class_id) || [];
    const totalClasses = classIds.length;

    // 3. Attendance rate
    const { data: attData } = await this.supabase
      .from('attendance')
      .select('status')
      .eq('student_id', studentId);

    let attendanceRate = 100;
    if (attData && attData.length > 0) {
      const presentCount = attData.filter((a: any) => a.status === 'present').length;
      attendanceRate = parseFloat(((presentCount / attData.length) * 100).toFixed(1));
    }

    // 4. Upcoming assignments due in 7 days
    const today = new Date();
    const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const todayStr = today.toISOString().split('T')[0];
    const sevenDaysLaterStr = sevenDaysLater.toISOString().split('T')[0];

    let upcomingAssignmentsCount = 0;
    let upcomingAssignmentsList: any[] = [];
    if (classIds.length > 0) {
      const { data: assignments } = await this.supabase
        .from('assignments')
        .select(
          `
          id,
          title,
          due_date,
          class:classes(
            name,
            course:courses(
              subject:subjects(name, code)
            )
          )
        `
        )
        .in('class_id', classIds)
        .gte('due_date', todayStr)
        .lte('due_date', sevenDaysLaterStr)
        .order('due_date', { ascending: true })
        .limit(5);

      upcomingAssignmentsList = (assignments || []).map((a: any) => ({
        id: a.id,
        title: a.title,
        dueDate: a.due_date,
        className: a.class?.name || '',
        subjectName: a.class?.course?.subject?.name || '',
        subjectCode: a.class?.course?.subject?.code || '',
      }));
      upcomingAssignmentsCount = upcomingAssignmentsList.length;
    }

    // 5. Trend
    const { data: recentGrades } = await this.supabase
      .from('grades')
      .select('score, created_at')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(5);

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (recentGrades && recentGrades.length >= 3) {
      const scores = recentGrades.map((g: any) => parseFloat(g.score) || 0);
      const score0 = scores[0] ?? 0;
      const score1 = scores[1] ?? score0;
      const recentAvg = (score0 + score1) / 2;
      const olderAvg =
        scores.slice(2).reduce((sum: number, s: number) => sum + s, 0) / scores.slice(2).length;
      if (recentAvg > olderAvg + 0.1) {
        trend = 'up';
      } else if (recentAvg < olderAvg - 0.1) {
        trend = 'down';
      }
    }

    return {
      gpa,
      rank,
      totalRanked,
      attendanceRate,
      totalClasses,
      upcomingAssignments: upcomingAssignmentsCount,
      upcomingAssignmentsList,
      trend,
    };
  }

  /**
   * Get strategic dashboard statistics for Owner role
   */
  async getOwnerStats(): Promise<{
    studentsCount: number;
    studentGrowth: { name: string; count: number }[];
    classesCount: number;
    classUtilization: {
      classId: string;
      className: string;
      teacherName: string;
      subjectName: string;
      studentCount: number;
      maxCapacity: number;
      utilizationRate: number;
    }[];
    teachersCount: number;
    tutorsCount: number;
    announcements: {
      total: number;
      published: number;
      draft: number;
    };
  }> {
    // 1. Get Student Profiles count and creation date
    const { data: studentsData } = await this.supabase
      .from('profiles')
      .select('created_at, is_active')
      .eq('role', 'student');

    // 2. Get classes list with capacity and enrolled count
    const { data: classesData } = await this.supabase.from('classes').select(`
        id,
        name,
        max_capacity,
        teacher:profiles!classes_teacher_id_fkey(full_name),
        course:courses(name),
        enrollments(id, status)
      `);

    // 3. Get announcements
    const { data: announcementsData } = await this.supabase
      .from('announcements')
      .select('is_published');

    // 4. Get exact count of teachers
    const { count: teachersCount } = await this.supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'teacher');

    // 5. Get exact count of tutors
    const { count: tutorsCount } = await this.supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'tutor');

    // STUDENT GROWTH TREND
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        name: `T${d.getMonth() + 1}`,
      });
    }

    const growthMap: Record<string, number> = {};
    months.forEach((m) => {
      growthMap[m.key] = 0;
    });

    studentsData?.forEach((stud: any) => {
      if (!stud.created_at) return;
      const date = new Date(stud.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (growthMap[key] !== undefined) {
        growthMap[key]++;
      }
    });

    let cumulativeStudents =
      studentsData?.filter((s: any) => {
        if (!s.created_at) return false;
        const date = new Date(s.created_at);
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        return date < sixMonthsAgo;
      }).length || 0;

    const studentGrowth = months.map((m) => {
      cumulativeStudents += growthMap[m.key] || 0;
      return {
        name: m.name,
        count: cumulativeStudents,
      };
    });

    // CLASS UTILIZATION
    const classUtilization = (classesData || []).map((cls: any) => {
      const activeEnrollments =
        cls.enrollments?.filter((e: any) => e.status === 'enrolled' || e.status === 'active') || [];
      const studentCount = activeEnrollments.length;
      const maxCapacity = cls.max_capacity || 12;
      const utilizationRate =
        maxCapacity > 0 ? parseFloat(((studentCount / maxCapacity) * 100).toFixed(1)) : 0;

      return {
        classId: cls.id,
        className: cls.name,
        teacherName: cls.teacher?.full_name || 'Chưa phân công',
        subjectName: cls.course?.name || 'Khác',
        studentCount,
        maxCapacity,
        utilizationRate,
      };
    });

    // ANNOUNCEMENTS
    const totalAnnouncements = announcementsData?.length || 0;
    const publishedAnnouncements =
      announcementsData?.filter((a: any) => a.is_published).length || 0;
    const draftAnnouncements = totalAnnouncements - publishedAnnouncements;

    return {
      studentsCount: studentsData?.length || 0,
      studentGrowth,
      classesCount: classesData?.length || 0,
      classUtilization,
      teachersCount: teachersCount || 0,
      tutorsCount: tutorsCount || 0,
      announcements: {
        total: totalAnnouncements,
        published: publishedAnnouncements,
        draft: draftAnnouncements,
      },
    };
  }
}
