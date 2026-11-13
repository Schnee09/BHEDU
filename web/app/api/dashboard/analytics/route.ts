/**
 * Dashboard Analytics API Endpoint
 *
 * Provides aggregated statistics for the main dashboard:
 * - School-wide metrics
 * - Class comparisons
 * - Grade distributions
 * - Attendance trends
 * - Revenue summary
 */

import { NextResponse } from 'next/server';
import { createGetHandler } from '@/lib/api';
import { createClient } from '@/lib/supabase/server';
import { ValidationError } from '@/lib/api/errors';
import { analyticsQuerySchema } from '@/lib/schemas';
import { getGradeSemesterAliases, normalizeGradeSemester } from '@/lib/grades/semester';

export interface DashboardAnalytics {
  overview: {
    totalStudents: number;
    totalTeachers: number;
    totalClasses: number;
    averageGPA: number;
    attendanceRate: number;
    passRate: number;
  };
  gradeDistribution: {
    excellent: number; // >= 9.0
    good: number; // >= 8.0
    fair: number; // >= 6.5
    average: number; // >= 5.0
    weak: number; // < 5.0
  };
  classComparison: Array<{
    classId: string;
    className: string;
    teacherName: string;
    studentCount: number;
    averageGPA: number;
    attendanceRate: number;
    passRate: number;
  }>;
  trends: {
    gpaByMonth: Array<{ month: string; gpa: number; year: number }>;
    attendanceByMonth: Array<{ month: string; rate: number; year: number }>;
    enrollmentByMonth: Array<{ month: string; count: number; year: number }>;
  };
  topPerformers: Array<{
    studentId: string;
    studentName: string;
    className: string;
    gpa: number;
  }>;
  atRiskStudents: Array<{
    studentId: string;
    studentName: string;
    className: string;
    gpa: number;
    riskLevel: 'medium' | 'high' | 'critical';
  }>;
  recentActivity: Array<{
    type: 'grade' | 'attendance' | 'enrollment' | 'payment';
    description: string;
    timestamp: string;
  }>;
}

interface AttendanceDateRange {
  from: string;
  to: string;
}

export const GET = createGetHandler({ allowedRoles: ['admin'] }, async ({ request }) => {
  const supabase = await createClient();
  // Get query params and validate
  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  const validatedParams = analyticsQuerySchema.safeParse(searchParams);

  if (!validatedParams.success) {
    throw new ValidationError(validatedParams.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ');
  }

  const scholasticYear = validatedParams.data.academicYear || getCurrentAcademicYear();
  const scholasticSemester = validatedParams.data.semester || null;
  const academicYearId = await resolveAcademicYearId(supabase, scholasticYear);
  if (!academicYearId) {
    throw new ValidationError('Năm học không tồn tại');
  }
  const attendanceDateRange = await resolveAttendanceDateRange(
    supabase,
    academicYearId,
    scholasticSemester
  );

  // Fetch overview stats
  const overview = await getOverviewStats(
    supabase,
    academicYearId,
    scholasticSemester,
    attendanceDateRange
  );

  // Fetch grade distribution
  const gradeDistribution = await getGradeDistribution(
    supabase,
    academicYearId,
    scholasticSemester
  );

  // Fetch class comparison
  const classComparison = await getClassComparison(
    supabase,
    academicYearId,
    scholasticSemester,
    attendanceDateRange
  );

  // Fetch trends
  const trends = await getTrends(supabase, scholasticYear);

  // Fetch top performers
  const topPerformers = await getTopPerformers(supabase, academicYearId, scholasticSemester, 5);

  // Fetch at-risk students
  const atRiskStudents = await getAtRiskStudents(supabase, academicYearId, scholasticSemester, 10);

  // Fetch recent activity
  const recentActivity = await getRecentActivity(supabase, 10);

  const analytics: DashboardAnalytics = {
    overview,
    gradeDistribution,
    classComparison,
    trends,
    topPerformers,
    atRiskStudents,
    recentActivity,
  };

  return NextResponse.json(analytics);
});

function getCurrentAcademicYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  // Academic year starts in September
  if (month >= 8) {
    // September or later
    return `${year}-${year + 1}`;
  }
  return `${year - 1}-${year}`;
}

async function resolveAcademicYearId(supabase: any, academicYear: string): Promise<string | null> {
  let query = supabase.from('academic_years').select('id');
  query = isUuid(academicYear) ? query.eq('id', academicYear) : query.eq('name', academicYear);
  const { data } = await query.maybeSingle();
  return data?.id || null;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function resolveAttendanceDateRange(
  supabase: any,
  academicYearId: string,
  semester: string | null
): Promise<AttendanceDateRange | null> {
  const { data: academicYear } = await supabase
    .from('academic_years')
    .select('start_date, end_date')
    .eq('id', academicYearId)
    .maybeSingle();

  if (semester) {
    const aliases = getGradeSemesterAliases(semester);
    const canonicalSemester = normalizeGradeSemester(semester);
    let semesterQuery = supabase
      .from('semesters')
      .select('start_date, end_date')
      .is('deleted_at', null);

    if (academicYear?.start_date && academicYear?.end_date) {
      semesterQuery = semesterQuery
        .gte('start_date', academicYear.start_date)
        .lte('end_date', academicYear.end_date);
    }

    semesterQuery =
      canonicalSemester === '1' || canonicalSemester === '2'
        ? semesterQuery.ilike('code', `%HK${canonicalSemester}`)
        : semesterQuery.in('code', aliases);

    const { data: semesterRecord } = await semesterQuery.maybeSingle();

    if (semesterRecord?.start_date && semesterRecord?.end_date) {
      return { from: semesterRecord.start_date, to: semesterRecord.end_date };
    }
  }

  return academicYear?.start_date && academicYear?.end_date
    ? { from: academicYear.start_date, to: academicYear.end_date }
    : null;
}

export function applyAttendanceScope(query: any, dateRange: AttendanceDateRange | null) {
  query = query.is('deleted_at', null);
  if (dateRange) {
    query = query.gte('date', dateRange.from).lte('date', dateRange.to);
  }
  return query;
}

export function applyGradeScope(
  query: any,
  academicYearId: string | null,
  semester: string | null
) {
  if (academicYearId) query = query.eq('academic_year_id', academicYearId);
  if (semester) {
    const aliases = getGradeSemesterAliases(semester);
    query = aliases.length > 0 ? query.in('semester', aliases) : query.in('semester', []);
  }
  return query;
}

async function getOverviewStats(
  supabase: any,
  academicYearId: string | null,
  semester: string | null,
  attendanceDateRange: AttendanceDateRange | null
) {
  // Count students
  const { count: totalStudents } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'student');

  // Count teachers
  const { count: totalTeachers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'teacher');

  // Count classes
  let classesQuery = supabase.from('classes').select('*', { count: 'exact', head: true });
  if (academicYearId) classesQuery = classesQuery.eq('academic_year_id', academicYearId);
  const { count: totalClasses } = await classesQuery;

  // Calculate average GPA (from grades table)
  let gradeQuery = supabase.from('grades').select('score').is('deleted_at', null);
  gradeQuery = applyGradeScope(gradeQuery, academicYearId, semester);
  const { data: gradeData } = await gradeQuery;

  const averageGPA =
    gradeData && gradeData.length > 0
      ? gradeData.reduce((sum: number, g: { score: number }) => sum + (g.score || 0), 0) /
        gradeData.length
      : 0;

  // Calculate attendance rate
  let attendanceQuery = supabase.from('attendance').select('status');
  attendanceQuery = applyAttendanceScope(attendanceQuery, attendanceDateRange);
  const { data: attendanceData } = await attendanceQuery;

  const totalAttendance = attendanceData?.length || 0;
  const presentCount =
    attendanceData?.filter((a: { status: string }) => a.status === 'present' || a.status === 'late')
      .length || 0;
  const attendanceRate = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0;

  // Calculate pass rate
  const passCount = gradeData?.filter((g: { score: number }) => g.score >= 5.0).length || 0;
  const passRate = gradeData && gradeData.length > 0 ? (passCount / gradeData.length) * 100 : 0;

  return {
    totalStudents: totalStudents || 0,
    totalTeachers: totalTeachers || 0,
    totalClasses: totalClasses || 0,
    averageGPA: Math.round(averageGPA * 100) / 100,
    attendanceRate: Math.round(attendanceRate * 100) / 100,
    passRate: Math.round(passRate * 100) / 100,
  };
}

async function getGradeDistribution(
  supabase: any,
  academicYearId: string | null,
  semester: string | null
) {
  let query = supabase.from('grades').select('score').is('deleted_at', null);
  query = applyGradeScope(query, academicYearId, semester);
  const { data: grades } = await query;

  const distribution = {
    excellent: 0,
    good: 0,
    fair: 0,
    average: 0,
    weak: 0,
  };

  if (grades) {
    for (const g of grades) {
      const score = g.score || 0;
      if (score >= 9.0) distribution.excellent++;
      else if (score >= 8.0) distribution.good++;
      else if (score >= 6.5) distribution.fair++;
      else if (score >= 5.0) distribution.average++;
      else distribution.weak++;
    }
  }

  return distribution;
}

async function getClassComparison(
  supabase: any,
  academicYearId: string | null,
  semester: string | null,
  attendanceDateRange: AttendanceDateRange | null
) {
  let classesQuery = supabase.from('classes').select(
    `
      id,
      name,
      teacher:teacher_id(full_name)
    `
  );
  if (academicYearId) classesQuery = classesQuery.eq('academic_year_id', academicYearId);
  const { data: classes } = await classesQuery.limit(20);

  if (!classes || classes.length === 0) return [];

  const classIds = classes.map((c: any) => c.id);

  // Batch fetch enrollments
  const { data: allEnrollments } = await supabase
    .from('enrollments')
    .select('class_id')
    .in('class_id', classIds);

  // Batch fetch grades
  let gradesQuery = supabase
    .from('grades')
    .select('class_id, score')
    .in('class_id', classIds)
    .is('deleted_at', null);
  gradesQuery = applyGradeScope(gradesQuery, academicYearId, semester);
  const { data: allGrades } = await gradesQuery;

  // Batch fetch attendance
  let attendanceQuery = supabase
    .from('attendance')
    .select('class_id, status')
    .in('class_id', classIds);
  attendanceQuery = applyAttendanceScope(attendanceQuery, attendanceDateRange);
  const { data: allAttendance } = await attendanceQuery;

  const comparisons = classes.map((cls: any) => {
    const classId = cls.id;

    // Aggregate enrollments
    const studentCount = allEnrollments?.filter((e: any) => e.class_id === classId).length || 0;

    // Aggregate grades
    const classGrades = allGrades?.filter((g: any) => g.class_id === classId) || [];
    const avgGPA =
      classGrades.length > 0
        ? classGrades.reduce((sum: number, g: any) => sum + (g.score || 0), 0) / classGrades.length
        : 0;

    const passCount = classGrades.filter((g: any) => g.score >= 5.0).length;
    const passRate = classGrades.length > 0 ? (passCount / classGrades.length) * 100 : 0;

    // Aggregate attendance
    const classAttendance = allAttendance?.filter((a: any) => a.class_id === classId) || [];
    const presentCount = classAttendance.filter(
      (a: any) => a.status === 'present' || a.status === 'late'
    ).length;
    const attendanceRate =
      classAttendance.length > 0 ? (presentCount / classAttendance.length) * 100 : 0;

    return {
      classId,
      className: cls.name,
      teacherName: cls.teacher?.full_name || 'Chưa phân công',
      studentCount,
      averageGPA: Math.round(avgGPA * 100) / 100,
      attendanceRate: Math.round(attendanceRate * 100) / 100,
      passRate: Math.round(passRate * 100) / 100,
    };
  });

  return comparisons.sort((a: any, b: any) => b.averageGPA - a.averageGPA);
}

async function getTrends(supabase: any, academicYear: string) {
  // Do not present generated placeholder values as operational data.
  // These arrays remain empty until monthly aggregation is implemented.
  void supabase;
  void academicYear;
  return {
    gpaByMonth: [],
    attendanceByMonth: [],
    enrollmentByMonth: [],
  };
}

async function getTopPerformers(
  supabase: any,
  academicYearId: string | null,
  semester: string | null,
  limit: number
) {
  // Get students with highest averages
  const { data: students } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'student')
    .limit(limit);

  // For each student, calculate GPA (simplified)
  const performers = [];
  for (const student of students || []) {
    let gradesQuery = supabase
      .from('grades')
      .select('score')
      .eq('student_id', student.id)
      .is('deleted_at', null);
    gradesQuery = applyGradeScope(gradesQuery, academicYearId, semester);
    const { data: grades } = await gradesQuery;

    const gpa =
      grades && grades.length > 0
        ? grades.reduce((sum: number, g: { score: number }) => sum + (g.score || 0), 0) /
          grades.length
        : 0;

    performers.push({
      studentId: student.id,
      studentName: student.full_name,
      className: 'N/A', // Would need to join with enrollments
      gpa: Math.round(gpa * 100) / 100,
    });
  }

  return performers.sort((a, b) => b.gpa - a.gpa).slice(0, limit);
}

async function getAtRiskStudents(
  supabase: any,
  academicYearId: string | null,
  semester: string | null,
  limit: number
) {
  const { data: students } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'student')
    .limit(50);

  const atRisk = [];
  for (const student of students || []) {
    let gradesQuery = supabase
      .from('grades')
      .select('score')
      .eq('student_id', student.id)
      .is('deleted_at', null);
    gradesQuery = applyGradeScope(gradesQuery, academicYearId, semester);
    const { data: grades } = await gradesQuery;

    const gpa =
      grades && grades.length > 0
        ? grades.reduce((sum: number, g: { score: number }) => sum + (g.score || 0), 0) /
          grades.length
        : 0;

    if (gpa < 6.5 && gpa > 0) {
      let riskLevel: 'medium' | 'high' | 'critical';
      if (gpa < 4.0) riskLevel = 'critical';
      else if (gpa < 5.0) riskLevel = 'high';
      else riskLevel = 'medium';

      atRisk.push({
        studentId: student.id,
        studentName: student.full_name,
        className: 'N/A',
        gpa: Math.round(gpa * 100) / 100,
        riskLevel,
      });
    }
  }

  return atRisk.sort((a, b) => a.gpa - b.gpa).slice(0, limit);
}

async function getRecentActivity(supabase: any, limit: number) {
  const activities: Array<{
    type: 'grade' | 'attendance' | 'enrollment' | 'payment';
    description: string;
    timestamp: string;
  }> = [];

  // Get recent grades
  const { data: recentGrades } = await supabase
    .from('grades')
    .select('created_at, score, student:student_id(full_name)')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(5);

  for (const grade of recentGrades || []) {
    activities.push({
      type: 'grade',
      description: `Điểm ${grade.score} được nhập cho ${grade.student?.full_name || 'học sinh'}`,
      timestamp: grade.created_at,
    });
  }

  // Get recent attendance
  const { data: recentAttendance } = await supabase
    .from('attendance')
    .select('created_at, status, student:student_id(full_name)')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(5);

  for (const att of recentAttendance || []) {
    const statusVi =
      att.status === 'present' ? 'có mặt' : att.status === 'absent' ? 'vắng' : 'đi muộn';
    activities.push({
      type: 'attendance',
      description: `${att.student?.full_name || 'Học sinh'} được điểm danh ${statusVi}`,
      timestamp: att.created_at,
    });
  }

  // Sort by timestamp and return
  return activities
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}
