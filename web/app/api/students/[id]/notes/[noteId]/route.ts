/**
 * Single Student Note API
 * DELETE /api/students/[id]/notes/[noteId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { staffAuth } from '@/lib/auth/adminAuth';
import { createServiceClient } from '@/lib/supabase/server';
import { handleApiError, AuthenticationError } from '@/lib/api/errors';

interface RouteParams {
  params: Promise<{ id: string; noteId: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await staffAuth(request);
    if (!authResult.authorized) {
      throw new AuthenticationError(authResult.reason || 'Unauthorized');
    }

    const { id, noteId } = await params;
    const supabase = createServiceClient();

    const { error } = await supabase
      .from('student_notes')
      .delete()
      .eq('id', noteId)
      .eq('student_id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
