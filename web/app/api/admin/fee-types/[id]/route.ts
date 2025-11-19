import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { adminAuth } from '@/lib/auth/adminAuth';

/**
 * GET /api/admin/fee-types/[id]
 * Get a single fee type by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await adminAuth(request);
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('fee_types')
      .select('*, academic_years(name)')
      .eq('id', resolvedParams.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Fee type not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching fee type:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in GET /api/admin/fee-types/[id]:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/fee-types/[id]
 * Update a fee type
 * Body: { name?, description?, amount?, category?, is_mandatory?, is_active?, academic_year_id? }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await adminAuth(request);
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const body = await request.json();
    const { name, description, amount, category, is_mandatory, is_active, academic_year_id } = body;

    // Validate amount if provided
    if (amount !== undefined && amount < 0) {
      return NextResponse.json(
        { error: 'amount must be greater than or equal to 0' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (amount !== undefined) updates.amount = amount;
    if (category !== undefined) updates.category = category;
    if (is_mandatory !== undefined) updates.is_mandatory = is_mandatory;
    if (is_active !== undefined) updates.is_active = is_active;
    if (academic_year_id !== undefined) updates.academic_year_id = academic_year_id;

    const { data, error } = await supabase
      .from('fee_types')
      .update(updates)
      .eq('id', resolvedParams.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Fee type not found' },
          { status: 404 }
        );
      }
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A fee type with this name already exists for this academic year' },
          { status: 400 }
        );
      }
      console.error('Error updating fee type:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in PATCH /api/admin/fee-types/[id]:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/fee-types/[id]
 * Delete a fee type
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await adminAuth(request);
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const supabase = createServiceClient();

    // Check if fee type exists
    const { data: existing } = await supabase
      .from('fee_types')
      .select('id')
      .eq('id', resolvedParams.id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: 'Fee type not found' },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from('fee_types')
      .delete()
      .eq('id', resolvedParams.id);

    if (error) {
      console.error('Error deleting fee type:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Fee type deleted' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in DELETE /api/admin/fee-types/[id]:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
