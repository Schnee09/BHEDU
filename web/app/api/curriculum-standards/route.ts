import { NextRequest, NextResponse } from 'next/server';
import { createClientFromRequest } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
const createCurriculumStandardSchema = z.object({
  subject_id: z.string().uuid(),
  grade_level: z.string(),
  academic_year_id: z.string().uuid(),
  standard_code: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  learning_objectives: z.array(z.string()),
  competencies: z.array(z.string()),
  assessment_criteria: z.array(z.string())
});

const _updateCurriculumStandardSchema = createCurriculumStandardSchema.partial();

// GET /api/curriculum-standards - List curriculum standards with filters
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClientFromRequest(request);
    const { searchParams } = new URL(request.url);

    const subject_id = searchParams.get('subject_id');
    const grade_level = searchParams.get('grade_level');
    const academic_year_id = searchParams.get('academic_year_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    let query = supabase
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
      .order('grade_level', { ascending: true })
      .order('standard_code', { ascending: true })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (subject_id) {
      query = query.eq('subject_id', subject_id);
    }
    if (grade_level) {
      query = query.eq('grade_level', grade_level);
    }
    if (academic_year_id) {
      query = query.eq('academic_year_id', academic_year_id);
    }

    const { data: standards, error, count } = await query;

    if (error) {
      console.error('Error fetching curriculum standards:', error);
      return NextResponse.json(
        { error: 'Failed to fetch curriculum standards' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      standards,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Error in GET /api/curriculum-standards:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/curriculum-standards - Create new curriculum standard
export async function POST(request: NextRequest) {
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
    const validatedData = createCurriculumStandardSchema.parse(body);

    // Check if standard code already exists for this subject and grade
    const { data: existing } = await supabase
      .from('curriculum_standards')
      .select('id')
      .eq('subject_id', validatedData.subject_id)
      .eq('grade_level', validatedData.grade_level)
      .eq('academic_year_id', validatedData.academic_year_id)
      .eq('standard_code', validatedData.standard_code)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Curriculum standard with this code already exists' },
        { status: 409 }
      );
    }

    const { data: standard, error } = await supabase
      .from('curriculum_standards')
      .insert(validatedData)
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
      console.error('Error creating curriculum standard:', error);
      return NextResponse.json(
        { error: 'Failed to create curriculum standard' },
        { status: 500 }
      );
    }

    return NextResponse.json(standard, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error in POST /api/curriculum-standards:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}