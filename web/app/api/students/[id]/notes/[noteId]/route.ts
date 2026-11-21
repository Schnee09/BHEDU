/**
 * Single Student Note API
 * DELETE /api/students/[id]/notes/[noteId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth/guard';
import { canAccessStudent } from '@/lib/auth/classAccess';
import { createServiceClient } from '@/lib/supabase/server';
import { handleApiError, AuthenticationError, AuthorizationError } from '@/lib/api/errors';

interface RouteParams {
  params: Promise<{ id: string; noteId: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await getAuthContext(request, 'students.edit');
    if (!auth.profile) {
      throw new AuthenticationError(auth.reason || 'Unauthorized');
    }
    if (!auth.authorized || !auth.role) {
      throw new AuthorizationError(auth.reason || 'Forbidden');
    }

    const { id, noteId } = await params;
    const supabase = createServiceClient();
    if (!(await canAccessStudent(supabase, { id: auth.profile.id, role: auth.role }, id))) {
      throw new AuthorizationError('Forbidden');
    }

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
