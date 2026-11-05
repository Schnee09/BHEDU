import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/auth/adminAuth';
import { getDataClient } from '@/lib/auth/dataClient';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await adminAuth(request);
    if (!authResult.authorized)
      return NextResponse.json({ error: authResult.reason || 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { supabase } = await getDataClient(request);

    const { data: grade, error } = await supabase
      .from('grades')
      .select(
        `
        *,
        student:profiles(id, full_name, email),
        assignment:assignments(*, class:classes(id,name,code), category:assignment_categories(id,name))
      `
      )
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      console.error('Error fetching grade details:', error);
      return NextResponse.json({ error: 'Failed to fetch grade details' }, { status: 500 });
    }

    if (!grade) return NextResponse.json({ error: 'Grade not found' }, { status: 404 });

    // Optionally calculate percentage
    const totalPoints = grade.assignment?.max_points ?? grade.assignment?.total_points;
    if (grade.points_earned != null && totalPoints) {
      grade.percentage = (grade.points_earned / totalPoints) * 100;
    }

    return NextResponse.json({ success: true, data: grade });
  } catch (err) {
    console.error('Error in admin/details/grades/[id]:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
