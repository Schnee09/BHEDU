import { NextRequest, NextResponse } from 'next/server';
import { createClientFromRequest } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema for updates
const updateCurriculumStandardSchema = z.object({
  subject_id: z.string().uuid().optional(),
  grade_level: z.string().optional(),
  academic_year_id: z.string().uuid().optional(),
  standard_code: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  learning_objectives: z.array(z.string()).optional(),
  competencies: z.array(z.string()).optional(),
  assessment_criteria: z.array(z.string()).optional()
});

// GET /api/curriculum-standards/[id] - Get specific curriculum standard
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabase = await createClientFromRequest(request);

    const { data: standard, error } = await supabase
      .from('curriculum_standards')
      .select(`
        *,
        subjects (
          id,
          name,
          code,
          category
        ),
        academic_years (
          id,
          name,
          start_year,
          end_year
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Curriculum standard not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching curriculum standard:', error);
      return NextResponse.json(
        { error: 'Failed to fetch curriculum standard' },
        { status: 500 }
      );
    }

    return NextResponse.json(standard);

  } catch (error) {
    console.error('Error in GET /api/curriculum-standards/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/curriculum-standards/[id] - Update curriculum standard
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabase = await createClientFromRequest(request);

    // Check if user is authenticated and has permission
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has admin or teacher role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'teacher'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateCurriculumStandardSchema.parse(body);

    // Check if the standard exists
    const { data: existing, error: checkError } = await supabase
      .from('curriculum_standards')
      .select('id, subject_id, grade_level, academic_year_id, standard_code')
      .eq('id', id)
      .single();

    if (checkError || !existing) {
      return NextResponse.json(
        { error: 'Curriculum standard not found' },
        { status: 404 }
      );
    }

    // If updating standard_code, check for conflicts
    if (validatedData.standard_code && validatedData.standard_code !== existing.standard_code) {
      const conflictCheck = await supabase
        .from('curriculum_standards')
        .select('id')
        .eq('subject_id', validatedData.subject_id || existing.subject_id)
        .eq('grade_level', validatedData.grade_level || existing.grade_level)
        .eq('academic_year_id', validatedData.academic_year_id || existing.academic_year_id)
        .eq('standard_code', validatedData.standard_code)
        .neq('id', id)
        .single();

      if (conflictCheck.data) {
        return NextResponse.json(
          { error: 'Curriculum standard with this code already exists' },
          { status: 409 }
        );
      }
    }

    const { data: standard, error } = await supabase
      .from('curriculum_standards')
      .update(validatedData)
      .eq('id', id)
      .select(`
        *,
        subjects (
          id,
          name,
          code,
          category
        ),
        academic_years (
          id,
          name,
          start_year,
          end_year
        )
      `)
      .single();

    if (error) {
      console.error('Error updating curriculum standard:', error);
      return NextResponse.json(
        { error: 'Failed to update curriculum standard' },
        { status: 500 }
      );
    }

    return NextResponse.json(standard);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error in PUT /api/curriculum-standards/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/curriculum-standards/[id] - Delete curriculum standard
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabase = await createClientFromRequest(request);

    // Check if user is authenticated and has permission
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has admin role (only admins can delete)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only admins can delete curriculum standards.' },
        { status: 403 }
      );
    }

    // Check if the standard exists
    const { data: existing, error: checkError } = await supabase
      .from('curriculum_standards')
      .select('id, title')
      .eq('id', id)
      .single();

    if (checkError || !existing) {
      return NextResponse.json(
        { error: 'Curriculum standard not found' },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from('curriculum_standards')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting curriculum standard:', error);
      return NextResponse.json(
        { error: 'Failed to delete curriculum standard' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Curriculum standard deleted successfully',
      deleted_standard: existing
    });

  } catch (error) {
    console.error('Error in DELETE /api/curriculum-standards/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}