/**
 * Student Grades Overview API (Simplified)
 * GET /api/grades/student-overview
 *
 * Get overall grades and subject breakdowns for students
 * Uses new schema: grades → subject_id + class_id
 */

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { teacherAuth } from '@/lib/auth/adminAuth';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  try {
    const authResult = await teacherAuth(request);
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.reason || 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const studentId = searchParams.get('studentId');

    if (!classId) {
      return NextResponse.json({ error: 'classId is required' }, { status: 400 });
    }

    // Verify teacher has access to this class
    const { data: classData } = await supabase
      .from('classes')
      .select('teacher_id')
      .eq('id', classId)
      .single();

    // Allow access for: class teacher, owner, admin, super_admin, or staff
    const isOwner = authResult.userRole === 'owner';
    const isSuperAdmin = authResult.userRole === 'super_admin';
    const isAdmin = authResult.userRole === 'admin';
    const isStaff = authResult.userRole === 'staff';
    const isClassTeacher = classData?.teacher_id === authResult.userId;

    if (!classData || (!isClassTeacher && !isOwner && !isSuperAdmin && !isAdmin && !isStaff)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get students to calculate grades for
    let studentIds: string[] = [];
    if (studentId) {
      studentIds = [studentId];
    } else {
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('student_id')
        .eq('class_id', classId);

      studentIds = enrollments?.map((e) => e.student_id) || [];
    }

    if (studentIds.length === 0) {
      return NextResponse.json({
        success: true,
        student_grades: [],
      });
    }

    // Get all subjects
    const { data: subjects } = await supabase.from('subjects').select('id, code, name');

    if (!subjects || subjects.length === 0) {
      return NextResponse.json({
        success: true,
        student_grades: [],
      });
    }

    // Batch fetch student profiles, grades, and timetable slots for class-wide and student-specific subjects
    const [profilesResponse, gradesResponse, timetableSlotsResponse] = await Promise.all([
      supabase.from('profiles').select('id, email, full_name, student_code').in('id', studentIds),
      supabase
        .from('grades')
        .select(
          `
          score,
          points_earned,
          component_type,
          subject_id,
          student_id
        `
        )
        .in('student_id', studentIds)
        .eq('class_id', classId),
      supabase
        .from('timetable_slots')
        .select('subject_id, student_id')
        .eq('class_id', classId),
    ]);

    const profiles = profilesResponse.data || [];
    const allGrades = gradesResponse.data || [];
    const timetableSlots = timetableSlotsResponse.data || [];

    const studentGrades = studentIds.map((sid) => {
      // Get student info from batched data
      const student = profiles.find((p) => p.id === sid);
      if (!student) return null;

      // Filter grades for this student from batched data
      const studentSpecificGrades = allGrades.filter((g) => g.student_id === sid);

      // Determine active subjects for this student:
      // 1. Class-wide subjects (no student_id set)
      // 2. Tutoring/individual subjects (student_id set to this student's ID)
      // 3. Subjects with existing grades for this student
      const studentSubjectIds = new Set<string>();

      timetableSlots.forEach((slot) => {
        if (!slot.student_id || slot.student_id === sid) {
          if (slot.subject_id) {
            studentSubjectIds.add(slot.subject_id);
          }
        }
      });

      studentSpecificGrades.forEach((g) => {
        if (g.subject_id) {
          studentSubjectIds.add(g.subject_id);
        }
      });

      // Group by subject
      const subjectGrades: Record<string, { name: string; scores: number[] }> = {};

      // Initialize only active subjects for this student
      studentSubjectIds.forEach((subId) => {
        const sub = subjects.find((s) => s.id === subId);
        if (sub) {
          subjectGrades[subId] = { name: sub.name || sub.code, scores: [] };
        }
      });

      // Add scores to subjects
      studentSpecificGrades.forEach((g) => {
        const subId = g.subject_id;
        if (subId && subjectGrades[subId]) {
          // Score is already 0-10 scale (normalized)
          const score = g.points_earned ?? g.score ?? 0;
          subjectGrades[subId].scores.push(score);
        }
      });

      // Calculate averages per subject (10-point scale → percentage)
      const category_grades = Object.entries(subjectGrades).map(([subId, data]) => {
        const hasGrades = data.scores.length > 0;
        const avgScore = hasGrades
          ? data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length
          : null;

        // 10-point scale: multiply by 10 for percentage
        const percentage = avgScore !== null ? avgScore * 10 : null;

        return {
          category_id: subId,
          category_name: data.name,
          percentage: percentage !== null ? Math.round(percentage * 10) / 10 : null,
          letter_grade: percentage !== null
            ? percentage >= 80
              ? 'A'
              : percentage >= 65
                ? 'B'
                : percentage >= 50
                  ? 'C'
                  : percentage >= 35
                    ? 'D'
                    : 'F'
            : '-',
          points_earned: avgScore !== null ? Math.round(avgScore * 10) / 10 : null,
          total_points: 10,
        };
      });

      // Overall: average of all graded subject percentages
      const gradedCategories = category_grades.filter((c) => c.percentage !== null);
      const overall_percentage =
        gradedCategories.length > 0
          ? gradedCategories.reduce((sum, c) => sum + (c.percentage || 0), 0) / gradedCategories.length
          : null;

      const letter_grade = overall_percentage !== null
        ? overall_percentage >= 80
          ? 'A'
          : overall_percentage >= 65
            ? 'B'
            : overall_percentage >= 50
              ? 'C'
              : overall_percentage >= 35
                ? 'D'
                : 'F'
        : '-';

      return {
        student_id: sid,
        student_name: student.full_name || student.email || '',
        student_number: student.student_code || '',
        overall_percentage: overall_percentage !== null ? Math.round(overall_percentage * 10) / 10 : null,
        letter_grade,
        category_grades,
      };
    });

    const validGrades = studentGrades.filter((g) => g !== null);

    return NextResponse.json({
      success: true,
      data: validGrades,
      student_grades: validGrades,
    });
  } catch (error) {
    logger.error('Student overview API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
