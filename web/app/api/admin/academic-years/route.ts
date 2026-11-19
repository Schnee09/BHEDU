/**
 * Academic Years API
 * GET /api/admin/academic-years - Get all academic years
 * POST /api/admin/academic-years - Create academic year
 * PUT /api/admin/academic-years/[id] - Update academic year
 * DELETE /api/admin/academic-years/[id] - Delete academic year
 */

import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth/guard';
import { getDataClient } from '@/lib/auth/dataClient';

export async function GET(request: Request) {
  try {
    const auth = await getAuthContext(request, 'classes.view');
    if (!auth.profile) {
      return NextResponse.json({ error: auth.reason || 'Unauthorized' }, { status: 401 });
    }
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.reason || 'Forbidden' }, { status: 403 });
    }

    const { supabase } = await getDataClient(request);

    const { data: years, error } = await supabase
      .from('academic_years')
      .select('*')
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Error fetching academic years:', error);
      return NextResponse.json({ error: 'Failed to fetch academic years' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: years,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/academic-years:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthContext(request, 'classes.manage');
    if (!auth.profile) {
      return NextResponse.json({ error: auth.reason || 'Unauthorized' }, { status: 401 });
    }
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.reason || 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, start_date, end_date, is_current, terms } = body;

    if (!name || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'Missing required fields: name, start_date, end_date' },
        { status: 400 }
      );
    }

    const { supabase } = await getDataClient(request);

    // If this is set as current, unset other current years
    if (is_current) {
      await supabase.from('academic_years').update({ is_current: false }).eq('is_current', true);
    }

    const insertData: Record<string, any> = {
      name,
      start_date,
      end_date,
      is_current: is_current || false,
      terms: terms || [],
      created_by: auth.profile.id,
    };

    const { data: year, error } = await supabase
      .from('academic_years')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating academic year:', error);
      return NextResponse.json({ error: 'Failed to create academic year' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: year,
      message: 'Academic year created successfully',
    });
  } catch (error) {
    console.error('Error in POST /api/admin/academic-years:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
