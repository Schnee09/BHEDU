/**
 * Attendance API - Resource Detail (Unified)
 * GET/PATCH/DELETE /api/attendance/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getRateLimitIdentifier, rateLimitConfigs } from '@/lib/auth/rateLimit';
import { getAuthContext } from '@/lib/auth/guard';
import { AttendanceRepository } from '@/lib/repositories/AttendanceRepository';
import { createServiceClient } from '@/lib/supabase/server';
import { canAccessClass } from '@/lib/auth/classAccess';
import { updateAttendanceSchema } from '@/lib/schemas';

export const dynamic = 'force-dynamic';

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
    const auth = await getAuthContext(request, 'attendance.view');
    if (!auth.profile) {
      return NextResponse.json({ error: auth.reason || 'Unauthorized' }, { status: 401 });
    }
    if (!auth.authorized || !auth.role) {
      return NextResponse.json({ error: auth.reason || 'Forbidden' }, { status: 403 });
    }

    const supabase = createServiceClient();
    const repository = new AttendanceRepository(supabase);

    const record = await repository.findByIdWithDetails(id);
    if (!record) {
      return NextResponse.json(
        { error: 'Attendance record not found' },
        {
          status: 404,
        }
      );
    }

    const canViewRecord = await canAccessClass(
      supabase,
      { id: auth.profile.id, role: auth.role },
      record.class_id
    );
    if (!canViewRecord) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error('[API] GET /api/attendance/[id] error:', error);
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
    const auth = await getAuthContext(request, 'attendance.manage');
    if (!auth.profile) {
      return NextResponse.json({ error: auth.reason || 'Unauthorized' }, { status: 401 });
    }
    if (!auth.authorized || !auth.role) {
      return NextResponse.json({ error: auth.reason || 'Forbidden' }, { status: 403 });
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

    const parsed = updateAttendanceSchema.safeParse(body);
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
    const repository = new AttendanceRepository(supabase);

    const existing = await repository.findById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 });
    }

    const canEditRecord = await canAccessClass(
      supabase,
      { id: auth.profile.id, role: auth.role },
      existing.class_id
    );
    if (!canEditRecord) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updated = await repository.update(id, parsed.data);
    return NextResponse.json({ success: true, record: updated });
  } catch (error) {
    console.error('[API] PATCH /api/attendance/[id] error:', error);
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
    const auth = await getAuthContext(request, 'attendance.manage');
    if (!auth.profile) {
      return NextResponse.json({ error: auth.reason || 'Unauthorized' }, { status: 401 });
    }
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.reason || 'Forbidden' }, { status: 403 });
    }

    const supabase = createServiceClient();
    const repository = new AttendanceRepository(supabase);

    await repository.delete(id);
    return NextResponse.json({
      success: true,
      message: 'Attendance record deleted',
    });
  } catch (error) {
    console.error('[API] DELETE /api/attendance/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      {
        status: 500,
      }
    );
  }
}
