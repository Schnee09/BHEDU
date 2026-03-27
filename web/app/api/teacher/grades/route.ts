import { apiPaginated, createGetHandler } from '@/lib/api';
import { gradeService, classService, studentService } from '@/lib/services';
import { GradeRepository } from '@/lib/repositories/GradeRepository';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Teacher Grades API
 * GET /api/teacher/grades
 *
 * Returns grade records for students in classes taught by the authenticated teacher
 */
export const GET = createGetHandler(
  { allowedRoles: ['teacher'] },
  async ({ user, searchParams }) => {
    // 1. Get classes taught by this teacher to enforce scoping
    const { classes: teacherClasses } = await classService.getClasses({ teacherId: user.id });
    const classIds = teacherClasses.map((c) => c.id);

    if (classIds.length === 0) {
      return apiPaginated([], { page: 1, pageSize: 20, total: 0 });
    }

    // 2. Extract and validate requested classId
    const requestedClassId = searchParams.get('classId');
    if (requestedClassId && !classIds.includes(requestedClassId)) {
      return apiPaginated([], { page: 1, pageSize: 20, total: 0 });
    }

    // Use studentService to get grades for these classes or specific student
    const studentId = searchParams.get('studentId') || undefined;

    // For now, if no studentId and no classId, we'd need a multi-class grade fetch
    // But typically grades are viewed per class or per student.

    if (studentId) {
      const grades = await studentService.getStudentGrades(
        studentId,
        requestedClassId || undefined
      );
      return apiPaginated(grades, { page: 1, pageSize: grades.length, total: grades.length });
    }

    if (requestedClassId) {
      const supabase = createServiceClient();
      const repo = new GradeRepository(supabase);
      const result = await repo.findAll({ class_id: requestedClassId });
      return apiPaginated(result.data, {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
      });
    }

    return apiPaginated([], { page: 1, pageSize: 20, total: 0 });
  }
);
