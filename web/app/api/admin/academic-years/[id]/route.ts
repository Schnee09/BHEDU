import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { adminAuth } from '@/lib/auth/adminAuth';

/**
 * GET /api/admin/academic-years/[id]
 * Get a single academic year by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await adminAuth(request);
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('academic_years')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Academic year not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching academic year:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in GET /api/admin/academic-years/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/academic-years/[id]
 * Update an academic year
 * Body: { name?, start_date?, end_date?, is_current?, terms? }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await adminAuth(request);
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, start_date, end_date, is_current, terms } = body;

    // Validate date range if both dates are provided
    if (start_date && end_date && new Date(end_date) <= new Date(start_date)) {
      return NextResponse.json(
        { error: 'end_date must be after start_date' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // If setting as current, unset any other current year
    if (is_current) {
      await supabase
        .from('academic_years')
        .update({ is_current: false })
        .eq('is_current', true)
        .neq('id', params.id); // Don't update the current record
    }

    const updates: any = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (start_date !== undefined) updates.start_date = start_date;
    if (end_date !== undefined) updates.end_date = end_date;
    if (is_current !== undefined) updates.is_current = is_current;
    if (terms !== undefined) updates.terms = terms;

    const { data, error } = await supabase
      .from('academic_years')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Academic year not found' },
          { status: 404 }
        );
      }
      console.error('Error updating academic year:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in PATCH /api/admin/academic-years/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/academic-years/[id]
 * Delete an academic year
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await adminAuth(request);
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createServiceClient();

    // Check if year exists
    const { data: existing } = await supabase
      .from('academic_years')
      .select('id')
      .eq('id', params.id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: 'Academic year not found' },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from('academic_years')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting academic year:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Academic year deleted' });
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/academic-years/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
