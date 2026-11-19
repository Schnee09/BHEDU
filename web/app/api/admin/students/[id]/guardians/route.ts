/**
 * Guardians Management API
 * GET /api/admin/students/[id]/guardians - List all guardians / parent links for a student
 * POST /api/admin/students/[id]/guardians - Add a new guardian
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDataClient } from '@/lib/auth/dataClient';
import { getAuthContext } from '@/lib/auth/guard';
import { logger } from '@/lib/logger';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await getAuthContext(req, 'students.view');
    if (!auth.profile) {
      return NextResponse.json({ error: auth.reason || 'Unauthorized' }, { status: 401 });
    }
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.reason || 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const { supabase } = await getDataClient(req);

    // Verify student exists
    const { data: student } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', id)
      .eq('role', 'student')
      .maybeSingle();

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // 1. First try parent_student_links (the official active schema table)
    const { data: links, error: linkErr } = await supabase
      .from('parent_student_links')
      .select(
        `
        id,
        relationship,
        status,
        notes,
        created_at,
        parent_id,
        parent:profiles!parent_student_links_parent_id_fkey (
          id,
          full_name,
          email,
          phone,
          address,
          occupation
        )
      `
      )
      .eq('student_id', id);

    if (!linkErr && links && links.length > 0) {
      const mapped = links.map((l: any) => ({
        id: l.id,
        student_id: id,
        name: l.parent?.full_name || 'Phụ huynh',
        relationship: l.relationship || 'guardian',
        phone: l.parent?.phone || null,
        email: l.parent?.email || null,
        address: l.parent?.address || null,
        is_primary_contact: true,
        is_emergency_contact: true,
        occupation: l.parent?.occupation || null,
        workplace: null,
        work_phone: null,
        notes: l.notes || null,
        created_at: l.created_at,
        updated_at: l.created_at,
      }));
      return NextResponse.json({ success: true, data: mapped });
    }

    // 2. Fallback to guardians table if parent_student_links had no records
    const { data: guardians, error: guardErr } = await supabase
      .from('guardians')
      .select('*')
      .eq('student_id', id)
      .order('is_primary_contact', { ascending: false })
      .order('created_at', { ascending: false });

    if (!guardErr && guardians) {
      return NextResponse.json({ success: true, data: guardians });
    }

    logger.error('Failed to fetch guardians table:', { error: guardErr?.message });
    return NextResponse.json(
      { success: false, error: 'Không thể tải thông tin người giám hộ.' },
      { status: 500 }
    );
  } catch (error) {
    logger.error('Failed to fetch guardians:', error);
    return NextResponse.json(
      { success: false, error: 'Không thể tải thông tin người giám hộ.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await getAuthContext(req, 'students.edit');
    if (!auth.profile) {
      return NextResponse.json({ error: auth.reason || 'Unauthorized' }, { status: 401 });
    }
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.reason || 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const { supabase } = await getDataClient(req);
    const body = await req.json();

    // Verify student exists
    const { data: student } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', id)
      .eq('role', 'student')
      .maybeSingle();

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { error: 'Tên người giám hộ / phụ huynh là bắt buộc' },
        { status: 400 }
      );
    }

    // Try inserting into guardians table
    const { data: newGuardian, error: insertError } = await supabase
      .from('guardians')
      .insert({
        student_id: id,
        name: body.name.trim(),
        relationship: body.relationship || 'guardian',
        phone: body.phone || null,
        email: body.email || null,
        address: body.address || null,
        is_primary_contact: body.is_primary_contact || false,
        is_emergency_contact: body.is_emergency_contact || false,
        occupation: body.occupation || null,
        workplace: body.workplace || null,
        work_phone: body.work_phone || null,
        notes: body.notes || null,
      })
      .select()
      .maybeSingle();

    if (insertError) {
      logger.error('Failed to persist guardian:', {
        error: insertError.message,
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Không thể lưu thông tin người giám hộ. Vui lòng thử lại.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: newGuardian,
      message: 'Người giám hộ đã được thêm thành công',
    });
  } catch (error) {
    logger.error('Failed to create guardian:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
