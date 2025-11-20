import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { success, created } from '@/lib/api/responses';
import { handleApiError } from '@/lib/api/errors';
import { createStudentSchema } from '@/lib/api/schemas';
import { StudentService } from '@/lib/services/studentService';
import { withLogging } from '@/lib/api/logging';
import { getPaginationParams, getQueryParam } from '@/lib/api/middleware';

/**
 * GET /api/v1/students
 * Get list of students with pagination and search
 * Query params: page, pageSize, search
 */
export const GET = withLogging(
  withAuth(async (request: NextRequest) => {
    try {
      const { page, pageSize } = getPaginationParams(request);
      const search = getQueryParam(request, 'search');

      const result = await StudentService.getStudents({
        page,
        pageSize,
        search: search || undefined,
      });

      return success(result);
    } catch (error) {
      return handleApiError(error);
    }
  })
);

/**
 * POST /api/v1/students
 * Create a new student
 * Body: { email, password, firstName, lastName, dateOfBirth, address?, phoneNumber?, parentContact? }
 */
export const POST = withLogging(
  withAuth(async (request: NextRequest) => {
    try {
      const body = await request.json();
      
      // Validate input
      const validData = createStudentSchema.parse(body);

      // Create student
      const student = await StudentService.createStudent(validData);

      return created(student, 'Student created successfully');
    } catch (error) {
      return handleApiError(error);
    }
  })
);
