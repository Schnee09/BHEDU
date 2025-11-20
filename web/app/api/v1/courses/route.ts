/**
 * Courses API endpoint with full CRUD operations
 * Demonstrates best practices for Next.js Route Handlers
 */

import { NextRequest } from 'next/server';
import { withAuth, withAdmin, getPaginationParams, getQueryParam } from '@/lib/api/middleware';
import { success, created } from '@/lib/api/responses';
import { createCourseSchema } from '@/lib/api/schemas';
import { CourseService } from '@/lib/services/courseService';
import { handleApiError } from '@/lib/api/errors';

/**
 * GET /api/courses
 * List all courses with optional filtering and pagination
 */
export const GET = withAuth(async (request: NextRequest) => {
  try {
    const { page, pageSize } = getPaginationParams(request);
    const search = getQueryParam(request, 'search');
    const subjectId = getQueryParam(request, 'subjectId');

    const result = await CourseService.getCourses({
      page,
      pageSize,
      search,
      subjectId,
    });

    return success({
      courses: result.courses,
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        totalItems: result.total,
        totalPages: Math.ceil(result.total / result.pageSize),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
});

/**
 * POST /api/courses
 * Create a new course (admin only)
 */
export const POST = withAdmin(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const validatedData = createCourseSchema.parse(body);

    const course = await CourseService.createCourse(validatedData);

    return created(course, 'Course created successfully');
  } catch (error) {
    return handleApiError(error);
  }
});
