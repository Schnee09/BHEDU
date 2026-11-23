/**
 * Classes API (Unified)
 * GET/POST /api/classes
 *
 * Uses Repository pattern, Zod validation, CASL permissions
 */

import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { apiPaginated, apiSuccess, createApiHandler, createGetHandler } from '@/lib/api';
import { checkRateLimit, getRateLimitIdentifier, rateLimitConfigs } from '@/lib/auth/rateLimit';
import { ClassRepository } from '@/lib/repositories/ClassRepository';
import { createServiceClient } from '@/lib/supabase/server';
import { classQuerySchema, createClassSchema } from '@/lib/schemas';

export const dynamic = 'force-dynamic';

// GET /api/classes
export const GET = createGetHandler(
  { permission: 'classes.view' },
  async ({ request, user, searchParams }) => {
    logger.debug('[API/Classes] GET request received', { user: user.id, role: user.role });
    const identifier = getRateLimitIdentifier(request);
    const rateCheck = checkRateLimit(identifier, rateLimitConfigs.api);
    if (!rateCheck.allowed) {
      return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 });
    }

    const params: Record<string, any> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    const validatedQuery = classQuerySchema.parse(params);

    const supabase = createServiceClient();
    const repository = new ClassRepository(supabase);

    if (['admin', 'super_admin', 'owner'].includes(user.role)) {
      const { data, ...pagination } = await repository.findAll(validatedQuery);
      logger.debug('[API/Classes] Center-wide fetch success', { count: data.length });
      return apiPaginated(data, pagination);
    }

    if (user.role === 'student') {
      const { data, ...pagination } = await repository.findByStudent(user.id, validatedQuery);
      return apiPaginated(data, pagination);
    }

    if (user.role === 'parent') {
      return apiSuccess({
        data: [],
        pagination: { page: 1, pageSize: 0, total: 0 },
      });
    }

    // Teaching, support, and custom operational roles granted classes.view
    // only receive classes explicitly assigned to their profile.
    const { data, ...pagination } = await repository.findAll({
      ...validatedQuery,
      teacher_id: user.id,
    });
    return apiPaginated(data, pagination);
  }
);

// POST /api/classes
export const POST = createApiHandler(
  {
    permission: 'classes.create',
    bodySchema: createClassSchema,
  },
  async ({ request, body, user }) => {
    const identifier = getRateLimitIdentifier(request);
    const rateCheck = checkRateLimit(identifier, rateLimitConfigs.api);
    if (!rateCheck.allowed) {
      return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 });
    }

    const supabase = createServiceClient();
    const repository = new ClassRepository(supabase);
    const cls = await repository.create(body as any);

    logger.info('[API/Classes] Class created', { classId: cls.id, createdBy: user.id });
    return apiSuccess({ class: cls }, { _status: 201 });
  }
);
