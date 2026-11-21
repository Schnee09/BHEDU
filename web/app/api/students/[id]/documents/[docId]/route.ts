/**
 * Single Student Document API
 * DELETE /api/students/[id]/documents/[docId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth/guard';
import { canAccessStudent } from '@/lib/auth/classAccess';
import { createServiceClient } from '@/lib/supabase/server';
import { handleApiError, AuthenticationError, AuthorizationError } from '@/lib/api/errors';

interface RouteParams {
  params: Promise<{ id: string; docId: string }>;
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

    const { id, docId } = await params;
    const supabase = createServiceClient();
    if (!(await canAccessStudent(supabase, { id: auth.profile.id, role: auth.role }, id))) {
      throw new AuthorizationError('Forbidden');
    }

    // Get document to find storage path
    const { data: doc } = await supabase
      .from('student_documents')
      .select('storage_path')
      .eq('id', docId)
      .eq('student_id', id)
      .single();

    if (doc?.storage_path) {
      // Delete from storage
      await supabase.storage.from('student-documents').remove([doc.storage_path]);
    }

    // Delete from database
    const { error } = await supabase
      .from('student_documents')
      .delete()
      .eq('id', docId)
      .eq('student_id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
