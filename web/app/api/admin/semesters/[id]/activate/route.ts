/**
 * Admin Semester Activation API
 * POST /api/admin/semesters/[id]/activate - Activate a semester
 */

import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth/guard';
import { getDataClient } from '@/lib/auth/dataClient';
import { logger } from '@/lib/logger';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await getAuthContext(request, 'classes.manage');
    if (!auth.profile) {
      return NextResponse.json({ error: auth.reason || 'Unauthorized' }, { status: 401 });
    }
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.reason || 'Forbidden' }, { status: 403 });
    }

    const { supabase } = await getDataClient(request);

    // Set all semesters to inactive
    const { error: deactivateError } = await supabase
      .from('semesters')
      .update({ is_active: false })
      .eq('is_active', true);

    if (deactivateError) {
      logger.error('Error deactivating semesters:', deactivateError);
      return NextResponse.json({ error: 'Failed to deactivate other semesters' }, { status: 500 });
    }

    // Activate the selected semester
    const { data: semester, error: activateError } = await supabase
      .from('semesters')
      .update({ is_active: true })
      .eq('id', id)
      .select()
      .single();

    if (activateError) {
      logger.error('Error activating semester:', activateError);
      return NextResponse.json({ error: 'Failed to activate semester' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      semester,
      message: 'Semester activated successfully',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error in POST /api/admin/semesters/[id]/activate:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}
