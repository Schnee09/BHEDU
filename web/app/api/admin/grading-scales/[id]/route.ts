import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { adminAuth } from '@/lib/auth/adminAuth';

/**
 * GET /api/admin/grading-scales/[id]
 * Get a single grading scale by ID
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
      .from('grading_scales')
      .select('*')
      .eq('id', resolvedParams.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Grading scale not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching grading scale:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in GET /api/admin/grading-scales/[id]:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/grading-scales/[id]
 * Update a grading scale
 * Body: { name?, description?, scale?, is_default? }
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
    const { name, description, scale, is_default } = body;

    // Validate scale array if provided
    if (scale !== undefined) {
      if (!Array.isArray(scale) || scale.length === 0) {
        return NextResponse.json(
          { error: 'scale must be a non-empty array' },
          { status: 400 }
        );
      }

      // Validate each grade entry
      for (const grade of scale) {
        if (!grade.letter || grade.min === undefined || grade.max === undefined) {
          return NextResponse.json(
            { error: 'Each grade must have letter, min, and max properties' },
            { status: 400 }
          );
        }
        if (grade.min < 0 || grade.max > 100 || grade.min > grade.max) {
          return NextResponse.json(
            { error: 'Invalid grade range: min must be 0-100 and less than or equal to max' },
            { status: 400 }
          );
        }
      }
    }

    const supabase = createServiceClient();

    // If setting as default, unset any other default scale
    if (is_default) {
      await supabase
        .from('grading_scales')
        .update({ is_default: false })
        .eq('is_default', true)
        .neq('id', resolvedParams.id);
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (scale !== undefined) updates.scale = scale;
    if (is_default !== undefined) updates.is_default = is_default;

    const { data, error } = await supabase
      .from('grading_scales')
      .update(updates)
      .eq('id', resolvedParams.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Grading scale not found' },
          { status: 404 }
        );
      }
      console.error('Error updating grading scale:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in PATCH /api/admin/grading-scales/[id]:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/grading-scales/[id]
 * Delete a grading scale
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

    // Check if scale exists
    const { data: existing } = await supabase
      .from('grading_scales')
      .select('id, is_default')
      .eq('id', resolvedParams.id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: 'Grading scale not found' },
        { status: 404 }
      );
    }

    // Prevent deleting the default scale
    if (existing.is_default) {
      return NextResponse.json(
        { error: 'Cannot delete the default grading scale. Set another scale as default first.' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('grading_scales')
      .delete()
      .eq('id', resolvedParams.id);

    if (error) {
      console.error('Error deleting grading scale:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Grading scale deleted' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in DELETE /api/admin/grading-scales/[id]:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
