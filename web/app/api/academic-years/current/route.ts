import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/academic-years/current
 * Get the current active academic year
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: academicYear, error } = await supabase
      .from('academic_years')
      .select('*')
      .eq('is_current', true)
      .maybeSingle();

    if (error) {
      console.error('Error fetching current academic year:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch academic year' },
        { status: 500 }
      );
    }

    if (!academicYear) {
      return NextResponse.json(
        { success: false, error: 'No active academic year found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      academicYear,
    });
  } catch (error: any) {
    console.error('Error in academic-years/current GET:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
