import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { created, noContent } from '@/lib/api/responses';
import { handleApiError } from '@/lib/api/errors';
import { uuidSchema } from '@/lib/api/schemas';
import { StudentService } from '@/lib/services/studentService';
import { withLogging } from '@/lib/api/logging';
import { z } from 'zod';

const enrollmentSchema = z.object({
  classId: z.string().uuid(),
});

/**
 * POST /api/v1/students/[id]/enroll
 * Enroll student in a class
 * Body: { classId }
 */
export const POST = withLogging(
  withAuth(async (request: NextRequest, context: { params?: Promise<Record<string, string>> }) => {
    try {
      const params = await context.params;
      const studentId = uuidSchema.parse(params?.id);

      const body = await request.json();
      const { classId } = enrollmentSchema.parse(body);

      const enrollment = await StudentService.enrollStudent(studentId, classId);

      return created(enrollment, 'Student enrolled successfully');
    } catch (error) {
      return handleApiError(error);
    }
  })
);

/**
 * DELETE /api/v1/students/[id]/enroll
 * Unenroll student from a class
 * Body: { classId }
 */
export const DELETE = withLogging(
  withAuth(async (request: NextRequest, context: { params?: Promise<Record<string, string>> }) => {
    try {
      const params = await context.params;
      const studentId = uuidSchema.parse(params?.id);

      const body = await request.json();
      const { classId } = enrollmentSchema.parse(body);

      await StudentService.unenrollStudent(studentId, classId);

      return noContent();
    } catch (error) {
      return handleApiError(error);
    }
  })
);
