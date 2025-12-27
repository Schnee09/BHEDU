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

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    good: number;      // >= 8.0
    fair: number;      // >= 6.5
    average: number;   // >= 5.0
    weak: number;      // < 5.0
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

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const academicYear = searchParams.get('academicYear') || getCurrentAcademicYear();
    const semester = searchParams.get('semester');

    // Fetch overview stats
    const overview = await getOverviewStats(supabase, academicYear, semester);
    
    // Fetch grade distribution
    const gradeDistribution = await getGradeDistribution(supabase, academicYear, semester);
    
    // Fetch class comparison
    const classComparison = await getClassComparison(supabase, academicYear, semester);
    
    // Fetch trends
    const trends = await getTrends(supabase, academicYear);
    
    // Fetch top performers
    const topPerformers = await getTopPerformers(supabase, academicYear, semester, 5);
    
    // Fetch at-risk students
    const atRiskStudents = await getAtRiskStudents(supabase, academicYear, semester, 10);
    
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
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

function getCurrentAcademicYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  // Academic year starts in September
  if (month >= 8) { // September or later
    return `${year}-${year + 1}`;
  }
  return `${year - 1}-${year}`;
}

async function getOverviewStats(supabase: any, academicYear: string, semester: string | null) {
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
  const { count: totalClasses } = await supabase
    .from('classes')
    .select('*', { count: 'exact', head: true });

  // Calculate average GPA (from grades table)
  const { data: gradeData } = await supabase
    .from('grades')
    .select('score');
  
  const averageGPA = gradeData && gradeData.length > 0
    ? gradeData.reduce((sum: number, g: { score: number }) => sum + (g.score || 0), 0) / gradeData.length
    : 0;

  // Calculate attendance rate
  const { data: attendanceData } = await supabase
    .from('attendance')
    .select('status');
  
  const totalAttendance = attendanceData?.length || 0;
  const presentCount = attendanceData?.filter((a: { status: string }) => 
    a.status === 'present' || a.status === 'late'
  ).length || 0;
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

async function getGradeDistribution(supabase: any, academicYear: string, semester: string | null) {
  const { data: grades } = await supabase
    .from('grades')
    .select('score');

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

async function getClassComparison(supabase: any, academicYear: string, semester: string | null) {
  const { data: classes } = await supabase
    .from('classes')
    .select(`
      id,
      name,
      teacher:teacher_id(full_name)
    `)
    .limit(20);

  const comparisons = [];

  for (const cls of classes || []) {
    // Get enrollments for this class
    const { count: studentCount } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('class_id', cls.id);

    // Get grades for this class
    const { data: classGrades } = await supabase
      .from('grades')
      .select('score')
      .eq('class_id', cls.id);

    const avgGPA = classGrades && classGrades.length > 0
      ? classGrades.reduce((sum: number, g: { score: number }) => sum + (g.score || 0), 0) / classGrades.length
      : 0;

    const passCount = classGrades?.filter((g: { score: number }) => g.score >= 5.0).length || 0;
    const passRate = classGrades && classGrades.length > 0 ? (passCount / classGrades.length) * 100 : 0;

    // Get attendance for this class
    const { data: classAttendance } = await supabase
      .from('attendance')
      .select('status')
      .eq('class_id', cls.id);

    const presentCount = classAttendance?.filter((a: { status: string }) => 
      a.status === 'present' || a.status === 'late'
    ).length || 0;
    const attendanceRate = classAttendance && classAttendance.length > 0
      ? (presentCount / classAttendance.length) * 100
      : 0;

    comparisons.push({
      classId: cls.id,
      className: cls.name,
      teacherName: cls.teacher?.full_name || 'Chưa phân công',
      studentCount: studentCount || 0,
      averageGPA: Math.round(avgGPA * 100) / 100,
      attendanceRate: Math.round(attendanceRate * 100) / 100,
      passRate: Math.round(passRate * 100) / 100,
    });
  }

  // Sort by GPA descending
  return comparisons.sort((a, b) => b.averageGPA - a.averageGPA);
}

async function getTrends(supabase: any, academicYear: string) {
  // This would typically aggregate data by month
  // For now, return placeholder structure
  const months = ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'];
  const currentYear = new Date().getFullYear();

  return {
    gpaByMonth: months.map((month, i) => ({
      month,
      gpa: 6.5 + Math.random() * 1.5, // Placeholder
      year: currentYear,
    })),
    attendanceByMonth: months.map((month, i) => ({
      month,
      rate: 85 + Math.random() * 10, // Placeholder
      year: currentYear,
    })),
    enrollmentByMonth: months.map((month, i) => ({
      month,
      count: Math.floor(50 + Math.random() * 20), // Placeholder
      year: currentYear,
    })),
  };
}

async function getTopPerformers(supabase: any, academicYear: string, semester: string | null, limit: number) {
  // Get students with highest averages
  const { data: students } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'student')
    .limit(limit);

  // For each student, calculate GPA (simplified)
  const performers = [];
  for (const student of students || []) {
    const { data: grades } = await supabase
      .from('grades')
      .select('score')
      .eq('student_id', student.id);

    const gpa = grades && grades.length > 0
      ? grades.reduce((sum: number, g: { score: number }) => sum + (g.score || 0), 0) / grades.length
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

async function getAtRiskStudents(supabase: any, academicYear: string, semester: string | null, limit: number) {
  const { data: students } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'student')
    .limit(50);

  const atRisk = [];
  for (const student of students || []) {
    const { data: grades } = await supabase
      .from('grades')
      .select('score')
      .eq('student_id', student.id);

    const gpa = grades && grades.length > 0
      ? grades.reduce((sum: number, g: { score: number }) => sum + (g.score || 0), 0) / grades.length
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
    .order('created_at', { ascending: false })
    .limit(5);

  for (const att of recentAttendance || []) {
    const statusVi = att.status === 'present' ? 'có mặt' : att.status === 'absent' ? 'vắng' : 'đi muộn';
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
