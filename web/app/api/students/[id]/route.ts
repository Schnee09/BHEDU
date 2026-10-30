/**
 * Students API - Resource Detail (Unified)
 * GET/PATCH/DELETE /api/students/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiSuccess, createApiHandler, createGetHandler } from '@/lib/api';
import { checkRateLimit, getRateLimitIdentifier, rateLimitConfigs } from '@/lib/auth/rateLimit';
import { StudentRepository } from '@/lib/repositories/StudentRepository';
import { createServiceClient } from '@/lib/supabase/server';
import { updateStudentSchema } from '@/lib/schemas';
import { AuthorizationError, NotFoundError } from '@/lib/api/errors';
import { canAccessStudent } from '@/lib/auth/classAccess';

const GLOBAL_STUDENT_DIRECTORY_ROLES = new Set(['super_admin', 'owner', 'admin', 'staff']);

// GET /api/students/[id]
export const GET = createGetHandler({ requireAuth: true }, async ({ params, request, user }) => {
  const identifier = getRateLimitIdentifier(request);
  const rateCheck = checkRateLimit(identifier, rateLimitConfigs.api);
  if (!rateCheck.allowed) {
    return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 });
  }

  const id = params.id as string;
  const supabase = createServiceClient();
  const repository = new StudentRepository(supabase);

  const canViewStudent =
    GLOBAL_STUDENT_DIRECTORY_ROLES.has(user.role) ||
    (await canAccessStudent(supabase, { id: user.id, role: user.role }, id));
  if (!canViewStudent) {
    throw new AuthorizationError('Forbidden');
  }

  const student = await repository.findByIdWithEnrollments(id);
  if (!student) {
    throw new NotFoundError('Student not found');
  }

  return apiSuccess(student);
});

// PATCH /api/students/[id]
export const PATCH = createApiHandler(
  {
    allowedRoles: ['admin', 'super_admin', 'owner', 'staff'],
    bodySchema: updateStudentSchema,
  },
  async ({ params, request, body }) => {
    const identifier = getRateLimitIdentifier(request);
    const rateCheck = checkRateLimit(identifier, rateLimitConfigs.api);
    if (!rateCheck.allowed) {
      return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 });
    }

    const id = params.id as string;
    const supabase = createServiceClient();
    const repository = new StudentRepository(supabase);

    const updated = await repository.update(id, body);
    return apiSuccess(updated);
  }
);

// DELETE /api/students/[id]
export const DELETE = createGetHandler(
  { allowedRoles: ['admin', 'super_admin', 'owner'] },
  async ({ params, request }) => {
    const identifier = getRateLimitIdentifier(request);
    const rateCheck = checkRateLimit(identifier, rateLimitConfigs.api);
    if (!rateCheck.allowed) {
      return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 });
    }

    const id = params.id as string;
    const supabase = createServiceClient();
    const repository = new StudentRepository(supabase);

    await repository.softDelete(id);
    return apiSuccess(null, { message: 'Student archived successfully' });
  }
);
