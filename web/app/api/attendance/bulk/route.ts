/**
 * Attendance Bulk API (Unified)
 * POST /api/attendance/bulk
 *
 * Uses Repository pattern, Zod validation, CASL permissions
 */

import { NextResponse } from 'next/server';
import { apiSuccess, createApiHandler } from '@/lib/api';
import { checkRateLimit, getRateLimitIdentifier, rateLimitConfigs } from '@/lib/auth/rateLimit';
import { AttendanceRepository } from '@/lib/repositories/AttendanceRepository';
import { createServiceClient } from '@/lib/supabase/server';
import { createAbility } from '@/lib/auth/permissions';
import { type BulkAttendanceInput, bulkAttendanceSchema } from '@/lib/schemas';

// POST /api/attendance/bulk
export const POST = createApiHandler(
  {
    allowedRoles: ['admin', 'staff', 'super_admin', 'owner', 'teacher', 'tutor'],
    bodySchema: bulkAttendanceSchema,
  },
  async ({ request, body, user }) => {
    const identifier = getRateLimitIdentifier(request);
    const rateCheck = checkRateLimit(identifier, rateLimitConfigs.api);
    if (!rateCheck.allowed) {
      return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 });
    }

    const ability = createAbility({ userId: user.id, role: user.role });
    if (ability.cannot('create', 'Attendance')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const supabase = createServiceClient();
    const repository = new AttendanceRepository(supabase);
    const result = await repository.createBulk({
      ...body,
      marked_by: body.marked_by || user.id,
    } as BulkAttendanceInput);

    return apiSuccess(result, { _status: 201 });
  }
);
