/**
 * Admin Classes API (REFACTORED)
 * GET/POST /api/admin/classes
 */

import { NextResponse } from 'next/server';
import { apiPaginated, apiSuccess, createApiHandler, createGetHandler } from '@/lib/api';
import { createClassSchema } from '@/lib/schemas';
import { ClassService } from '@/lib/services/classService';

// GET /api/admin/classes
export const GET = createGetHandler({ allowedRoles: ['admin'] }, async ({ searchParams }) => {
  const search = searchParams.get('search') || undefined;
  const teacherId = searchParams.get('teacher_id') || undefined;
  const academicYearId = searchParams.get('academic_year_id') || undefined;
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  const result = await ClassService.getClasses({
    search,
    teacherId,
    academicYearId,
    page,
    pageSize: limit,
  });

  // Enrichment: Add enrollment count for each class (preserving legacy requirement)
  // Note: This could be optimized further in ClassService, but for now we follow the existing pattern
  const classesWithStats = await Promise.all(
    result.classes.map(async (cls: any) => {
      const { _count } = await ClassService.getClassById(cls.id);
      return {
        ...cls,
        enrollment_count: _count?.enrollments || 0,
      };
    })
  );

  return apiPaginated(classesWithStats, {
    page: result.page,
    pageSize: result.pageSize,
    total: result.total,
  });
});

// POST /api/admin/classes
export const POST = createApiHandler(
  {
    allowedRoles: ['admin'],
    bodySchema: createClassSchema,
  },
  async ({ body }) => {
    const newClass = await ClassService.createClass(body);
    return apiSuccess(newClass, { _status: 201 });
  }
);
