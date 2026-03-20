/**
 * Single Class API (REFACTORED)
 *
 * Uses the new createApiHandler pattern for cleaner code.
 *
 * GET /api/classes/[classId] - Get class details
 * PUT /api/classes/[classId] - Update class
 * DELETE /api/classes/[classId] - Delete class
 */

import { NextResponse } from 'next/server';
import { apiSuccess, createApiHandler, createGetHandler } from '@/lib/api';
import { updateClassSchema } from '@/lib/schemas';
import { ClassService } from '@/lib/services/classService';
import { AuthorizationError, NotFoundError } from '@/lib/api/errors';
import { hasPermission } from '@/lib/auth/core';
import { createServiceClient } from '@/lib/supabase/server';

// GET /api/classes/[classId]
export const GET = createGetHandler({ permission: 'classes.view' }, async ({ params, user }) => {
  const classId = params.classId as string;
  const classData = await ClassService.getClassById(classId);

  if (!classData) {
    throw new NotFoundError('Không tìm thấy lớp học');
  }

  // Access Control Logic
  const canManageAll = hasPermission(user.role, 'classes.manage');

  if (!canManageAll) {
    if (user.role === 'teacher') {
      // Teacher can only view their own classes
      if (classData.teacher?.id !== user.id) {
        throw new AuthorizationError('Không có quyền truy cập lớp này');
      }
    } else if (user.role === 'student') {
      // Students can only view classes they are enrolled in
      const client = createServiceClient();
      const { data: enrollment } = await client
        .from('enrollments')
        .select('id')
        .eq('student_id', user.id)
        .eq('class_id', classId)
        .eq('status', 'active')
        .maybeSingle();

      if (!enrollment) {
        throw new AuthorizationError('Không có quyền truy cập lớp này');
      }
    } else {
      throw new AuthorizationError('Forbidden');
    }
  }

  return apiSuccess(classData);
});

// PUT /api/classes/[classId]
export const PUT = createApiHandler(
  {
    permission: 'classes.manage',
    bodySchema: updateClassSchema,
  },
  async ({ params, body }) => {
    const classId = params.classId as string;
    const existing = await ClassService.getClassById(classId);
    if (!existing) {
      throw new NotFoundError('Không tìm thấy lớp học');
    }

    const updated = await ClassService.updateClass(classId, body);
    return apiSuccess(updated);
  }
);

// DELETE /api/classes/[classId]
export const DELETE = createGetHandler({ permission: 'classes.manage' }, async ({ params }) => {
  const classId = params.classId as string;
  const existing = await ClassService.getClassById(classId);
  if (!existing) {
    throw new NotFoundError('Không tìm thấy lớp học');
  }

  await ClassService.deleteClass(classId);
  return NextResponse.json({ success: true, message: 'Đã xóa lớp học' });
});
