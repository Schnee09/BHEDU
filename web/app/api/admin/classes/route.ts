/**
 * Admin Classes API (REFACTORED)
 * GET/POST /api/admin/classes
 */

import { apiPaginated, apiSuccess, createApiHandler, createGetHandler } from '@/lib/api';
import { ValidationError } from '@/lib/api/errors';
import { resolveServerPermission } from '@/lib/auth/permissionResolver';
import type { UserRole } from '@/lib/auth/core';
import { createClassSchema } from '@/lib/schemas';
import { ClassService } from '@/lib/services/classService';

// GET /api/admin/classes
export const GET = createGetHandler(
  { permission: 'classes.view' },
  async ({ searchParams, user }) => {
    const search = searchParams.get('search') || undefined;
    const teacherId = searchParams.get('teacher_id') || undefined;
    const academicYearId = searchParams.get('academic_year_id') || undefined;
    const page = Number(searchParams.get('page') || '1');
    const limit = Number(searchParams.get('limit') || '50');
    if (!Number.isInteger(page) || page < 1) {
      throw new ValidationError('page must be a positive integer');
    }
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new ValidationError('limit must be an integer between 1 and 100');
    }

    const canManageAll = await resolveServerPermission(user.id, user.role, 'classes.manage');
    const scopeRole: UserRole = canManageAll
      ? 'admin'
      : user.role === 'student' || user.role === 'parent'
        ? (user.role as UserRole)
        : 'teacher';

    const result = await ClassService.getClasses({
      search,
      teacherId,
      academicYearId,
      page,
      pageSize: limit,
      context: { role: scopeRole, profileId: user.id },
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
  }
);

// POST /api/admin/classes
export const POST = createApiHandler(
  {
    permission: 'classes.create',
    bodySchema: createClassSchema,
  },
  async ({ body }) => {
    const newClass = await ClassService.createClass(body);
    return apiSuccess(newClass, { _status: 201 });
  }
);
