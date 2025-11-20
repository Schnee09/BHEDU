/**
 * Individual course API endpoint
 */

import { NextRequest } from 'next/server';
import { withAuth, withAdmin } from '@/lib/api/middleware';
import { success, noContent } from '@/lib/api/responses';
import { updateCourseSchema, uuidSchema } from '@/lib/api/schemas';
import { CourseService } from '@/lib/services/courseService';
import { handleApiError } from '@/lib/api/errors';

/**
 * GET /api/courses/[id]
 * Get a single course by ID
 */
export const GET = withAuth(
  async (_request: NextRequest, context: { params?: Promise<Record<string, string>> }) => {
    try {
      const params = await context.params;
      const id = uuidSchema.parse(params?.id);

      const course = await CourseService.getCourseById(id);

      return success(course);
    } catch (error) {
      return handleApiError(error);
    }
  }
);

/**
 * PATCH /api/courses/[id]
 * Update a course (admin only)
 */
export const PATCH = withAdmin(
  async (request: NextRequest, context: { params?: Promise<Record<string, string>> }) => {
    try {
      const params = await context.params;
      const id = uuidSchema.parse(params?.id);
      const body = await request.json();
      const validatedData = updateCourseSchema.parse(body);

      const course = await CourseService.updateCourse(id, validatedData);

      return success(course, 'Course updated successfully');
    } catch (error) {
      return handleApiError(error);
    }
  }
);

/**
 * DELETE /api/courses/[id]
 * Delete a course (admin only)
 */
export const DELETE = withAdmin(
  async (_request: NextRequest, context: { params?: Promise<Record<string, string>> }) => {
    try {
      const params = await context.params;
      const id = uuidSchema.parse(params?.id);

      await CourseService.deleteCourse(id);

      return noContent();
    } catch (error) {
      return handleApiError(error);
    }
  }
);
