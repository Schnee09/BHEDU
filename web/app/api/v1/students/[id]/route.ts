import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { success, noContent } from '@/lib/api/responses';
import { handleApiError, NotFoundError } from '@/lib/api/errors';
import { updateStudentSchema, uuidSchema } from '@/lib/api/schemas';
import { StudentService } from '@/lib/services/studentService';
import { withLogging } from '@/lib/api/logging';

/**
 * GET /api/v1/students/[id]
 * Get student by ID with enrollments
 */
export const GET = withLogging(
  withAuth(async (_request: NextRequest, context: { params?: Promise<Record<string, string>> }) => {
    try {
      const params = await context.params;
      const id = uuidSchema.parse(params?.id);

      const student = await StudentService.getStudentById(id);

      if (!student) {
        throw new NotFoundError('Student not found');
      }

      return success(student);
    } catch (error) {
      return handleApiError(error);
    }
  })
);

/**
 * PATCH /api/v1/students/[id]
 * Update student information
 * Body: { firstName?, lastName?, dateOfBirth?, address?, phoneNumber?, parentContact? }
 */
export const PATCH = withLogging(
  withAuth(async (request: NextRequest, context: { params?: Promise<Record<string, string>> }) => {
    try {
      const params = await context.params;
      const id = uuidSchema.parse(params?.id);

      const body = await request.json();
      const validData = updateStudentSchema.parse(body);

      const student = await StudentService.updateStudent(id, validData);

      return success(student, 'Student updated successfully');
    } catch (error) {
      return handleApiError(error);
    }
  })
);

/**
 * DELETE /api/v1/students/[id]
 * Delete student (validates no active enrollments)
 */
export const DELETE = withLogging(
  withAuth(async (_request: NextRequest, context: { params?: Promise<Record<string, string>> }) => {
    try {
      const params = await context.params;
      const id = uuidSchema.parse(params?.id);

      await StudentService.deleteStudent(id);

      return noContent();
    } catch (error) {
      return handleApiError(error);
    }
  })
);
