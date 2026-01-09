/**
 * Single Student Document API
 * DELETE /api/students/[id]/documents/[docId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { staffAuth } from '@/lib/auth/adminAuth';
import { createServiceClient } from '@/lib/supabase/server';
import { handleApiError, AuthenticationError } from '@/lib/api/errors';

interface RouteParams {
  params: Promise<{ id: string; docId: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await staffAuth(request);
    if (!authResult.authorized) {
      throw new AuthenticationError(authResult.reason || 'Unauthorized');
    }

    const { id, docId } = await params;
    const supabase = createServiceClient();

    // Get document to find storage path
    const { data: doc } = await supabase
      .from('student_documents')
      .select('storage_path')
      .eq('id', docId)
      .eq('student_id', id)
      .single();

    if (doc?.storage_path) {
      // Delete from storage
      await supabase.storage
        .from('student-documents')
        .remove([doc.storage_path]);
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
