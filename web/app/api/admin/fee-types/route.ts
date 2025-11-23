import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { adminAuth } from '@/lib/auth/adminAuth';

/**
 * GET /api/admin/fee-types
 * List all fee types with optional filters
 * Query params:
 * - is_active: boolean
 * - academic_year_id: uuid (filter by academic year)
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await adminAuth(request);
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);
    
    const is_active = searchParams.get('is_active');
    const academic_year_id = searchParams.get('academic_year_id');

    let query = supabase
      .from('fee_types')
      .select('*, academic_years(name)')
      .order('name', { ascending: true });

    // Apply filters
    if (is_active !== null) {
      query = query.eq('is_active', is_active === 'true');
    }

    if (academic_year_id) {
      query = query.eq('academic_year_id', academic_year_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching fee types:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: any) {
    console.error('Error in GET /api/admin/fee-types:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/fee-types
 * Create a new fee type
 * Body: { 
 *   name, 
 *   description?, 
 *   amount,
 *   is_active?,
 *   academic_year_id?
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await adminAuth(request);
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, amount, is_active, academic_year_id } = body;

    // Validation
    if (!name || amount === undefined) {
      return NextResponse.json(
        { error: 'name and amount are required' },
        { status: 400 }
      );
    }

    if (amount < 0) {
      return NextResponse.json(
        { error: 'amount must be greater than or equal to 0' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('fee_types')
      .insert({
        name,
        description,
        amount,
        is_active: is_active !== undefined ? is_active : true,
        academic_year_id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating fee type:', error);
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'A fee type with this name already exists for this academic year' },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/admin/fee-types:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
