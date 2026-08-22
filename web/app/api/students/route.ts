/**
 * Students API (Unified)
 * GET/POST /api/students
 *
 * Uses Repository pattern, Zod validation, CASL permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiPaginated, apiSuccess, createApiHandler, createGetHandler } from '@/lib/api';
import { checkRateLimit, getRateLimitIdentifier, rateLimitConfigs } from '@/lib/auth/rateLimit';
import { StudentRepository } from '@/lib/repositories/StudentRepository';
import { createServiceClient } from '@/lib/supabase/server';
import { createAbility } from '@/lib/auth/permissions';
import {
  type CreateStudentInput,
  createStudentSchema,
  type StudentQuery,
  studentQuerySchema,
} from '@/lib/schemas';

export const dynamic = 'force-dynamic';

// GET /api/students
export const GET = createGetHandler(
  { requireAuth: true },
  async ({ request, user, searchParams }) => {
    const identifier = getRateLimitIdentifier(request);
    const rateCheck = checkRateLimit(identifier, rateLimitConfigs.api);
    if (!rateCheck.allowed) {
      return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 });
    }

    const params: Record<string, any> = {};
    searchParams.forEach((value, key) => {
      if (key === 'search' && value.trim() === '') return;
      params[key] = value;
    });

    const validatedQuery = studentQuerySchema.parse(params);
    const queryOpts = {
      ...validatedQuery,
      pageSize: validatedQuery.limit,
    };

    const supabase = createServiceClient();
    const repository = new StudentRepository(supabase);

    const ability = createAbility({
      userId: user.id,
      role: user.role,
      classIds: [],
    });

    if (ability.can('read', 'Student')) {
      if (
        user.role === 'admin' ||
        user.role === ('admin' as any) ||
        user.role === 'super_admin' ||
        user.role === 'owner'
      ) {
        const { data, ...pagination } = await repository.findAll(queryOpts);
        return apiPaginated(data, pagination);
      }

      if (user.role === 'teacher' || user.role === 'tutor') {
        const { data, ...pagination } = await repository.findByTeacher(user.id, queryOpts);
        return apiPaginated(data, pagination);
      }

      if (user.role === 'student') {
        const student = await repository.findById(user.id);
        return apiPaginated(student ? [student] : [], {
          page: 1,
          pageSize: 1,
          total: student ? 1 : 0,
        });
      }

      if (user.role === 'parent') {
        return apiPaginated([], { page: 1, pageSize: 0, total: 0 });
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: ability.reasonFor('read', 'Student') || 'Forbidden',
      },
      { status: 403 }
    );
  }
);

// POST /api/students
export const POST = createApiHandler(
  {
    allowedRoles: ['admin', 'super_admin', 'owner', 'staff'],
    bodySchema: createStudentSchema,
  },
  async ({ request, body, user }) => {
    const identifier = getRateLimitIdentifier(request);
    const rateCheck = checkRateLimit(identifier, rateLimitConfigs.api);
    if (!rateCheck.allowed) {
      return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 });
    }

    const ability = createAbility({ userId: user.id, role: user.role });
    if (ability.cannot('create', 'Student')) {
      return NextResponse.json(
        {
          success: false,
          error:
            ability.reasonFor('create', 'Student') ||
            'You do not have permission to create students',
        },
        { status: 403 }
      );
    }

    const { UserService } = await import('@/lib/services/userService');
    const userService = new UserService();
    const result = await userService.createUser(
      {
        ...body,
        role: 'student',
      } as any,
      user.role,
      user.id
    );

    return apiSuccess(result, { _status: 201 });
  }
);
