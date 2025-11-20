import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { success } from '@/lib/api/responses';
import { handleApiError } from '@/lib/api/errors';
import { uuidSchema } from '@/lib/api/schemas';
import { StudentService } from '@/lib/services/studentService';
import { withLogging } from '@/lib/api/logging';

/**
 * GET /api/v1/students/[id]/attendance
 * Get attendance records for a student
 */
export const GET = withLogging(
  withAuth(async (_request: NextRequest, context: { params?: Promise<Record<string, string>> }) => {
    try {
      const params = await context.params;
      const studentId = uuidSchema.parse(params?.id);

      const attendance = await StudentService.getStudentAttendance(studentId);

      return success(attendance);
    } catch (error) {
      return handleApiError(error);
    }
  })
);
