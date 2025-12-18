import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/academic-years
 * Get all academic years
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: academicYears, error } = await supabase
      .from('academic_years')
      .select('*')
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Error fetching academic years:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch academic years' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      years: academicYears
    });

  } catch (error) {
    console.error('Error in GET /api/academic-years:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}