/**
 * Grades API - Resource Detail (Unified)
 * GET/PATCH/DELETE /api/grades/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getRateLimitIdentifier, rateLimitConfigs } from '@/lib/auth/rateLimit';
import { adminAuth, teacherAuth } from '@/lib/auth/adminAuth';
import { GradeRepository } from '@/lib/repositories/GradeRepository';
import { createServiceClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { canAccessClass } from '@/lib/auth/classAccess';

export const dynamic = 'force-dynamic';

// Validation Schemas
const updateSchema = z
  .object({
    score: z.coerce.number().min(0).max(10).optional().nullable(),
    points_earned: z.coerce.number().min(0).max(10).optional().nullable(),
    feedback: z.string().max(2000).optional().nullable(),
    notes: z.string().optional().nullable(),
    graded_at: z.string().datetime().optional(),
  })
  .strict();

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Rate limit
    const identifier = getRateLimitIdentifier(request);
    const rateCheck = checkRateLimit(identifier, rateLimitConfigs.api);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        {
          status: 429,
        }
      );
    }

    // Auth
    const auth = await teacherAuth(request);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.reason || 'Unauthorized' },
        {
          status: 401,
        }
      );
    }

    const supabase = createServiceClient();
    const repository = new GradeRepository(supabase);

    const grade = await repository.findByIdWithDetails(id);
    if (!grade) {
      return NextResponse.json(
        { error: 'Grade not found' },
        {
          status: 404,
        }
      );
    }

    const canViewGrade = await canAccessClass(
      supabase,
      { id: auth.userId, role: auth.userRole },
      grade.class_id
    );
    if (!canViewGrade) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ success: true, grade });
  } catch (error) {
    console.error('[API] GET /api/grades/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Rate limit
    const identifier = getRateLimitIdentifier(request);
    const rateCheck = checkRateLimit(identifier, rateLimitConfigs.api);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        {
          status: 429,
        }
      );
    }

    // Auth - teachers or staff
    const auth = await teacherAuth(request);
    if (!auth.authorized || auth.userRole === 'student') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON' },
        {
          status: 400,
        }
      );
    }

    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          details: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const repository = new GradeRepository(supabase);

    const existing = await repository.findById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Grade not found' }, { status: 404 });
    }

    const canEditGrade = await canAccessClass(
      supabase,
      { id: auth.userId, role: auth.userRole },
      existing.class_id
    );
    if (!canEditGrade) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { notes, feedback, score, points_earned, ...metadata } = parsed.data;
    const normalizedScore = points_earned !== undefined ? points_earned : score;
    const updated = await repository.update(id, {
      ...metadata,
      ...(normalizedScore !== undefined
        ? { score: normalizedScore, points_earned: normalizedScore }
        : {}),
      ...(feedback !== undefined || notes !== undefined
        ? { feedback: feedback ?? notes ?? null }
        : {}),
    });
    return NextResponse.json({ success: true, grade: updated });
  } catch (error) {
    console.error('[API] PATCH /api/grades/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Rate limit
    const identifier = getRateLimitIdentifier(request);
    const rateCheck = checkRateLimit(identifier, rateLimitConfigs.api);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        {
          status: 429,
        }
      );
    }

    // Auth - staff/admin only
    const auth = await adminAuth(request);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.reason || 'Forbidden' },
        {
          status: 403,
        }
      );
    }

    const supabase = createServiceClient();
    const repository = new GradeRepository(supabase);

    await repository.delete(id);
    return NextResponse.json({
      success: true,
      message: 'Grade deleted successfully',
    });
  } catch (error) {
    console.error('[API] DELETE /api/grades/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      {
        status: 500,
      }
    );
  }
}
