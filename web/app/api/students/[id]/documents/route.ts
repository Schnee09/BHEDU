/**
 * Student Documents API
 * GET/POST /api/students/[id]/documents
 */

import { NextRequest, NextResponse } from 'next/server';
import { staffAuth } from '@/lib/auth/adminAuth';
import { createServiceClient } from '@/lib/supabase/server';
import { handleApiError, AuthenticationError } from '@/lib/api/errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await staffAuth(request);
    if (!authResult.authorized) {
      throw new AuthenticationError(authResult.reason || 'Unauthorized');
    }

    const { id } = await params;
    const supabase = createServiceClient();

    const { data: documents, error } = await supabase
      .from('student_documents')
      .select(`
        id,
        name,
        type,
        url,
        size,
        uploaded_at,
        uploaded_by,
        profiles!student_documents_uploaded_by_fkey (full_name)
      `)
      .eq('student_id', id)
      .order('uploaded_at', { ascending: false });

    if (error) {
      // If table doesn't exist, return empty array
      if (error.code === '42P01') {
        return NextResponse.json({ documents: [] });
      }
      throw error;
    }

    const formattedDocs = (documents || []).map((d: any) => ({
      id: d.id,
      name: d.name,
      type: d.type,
      url: d.url,
      size: d.size,
      uploaded_at: d.uploaded_at,
      uploaded_by: d.profiles ? { full_name: d.profiles.full_name } : null
    }));

    return NextResponse.json({ documents: formattedDocs });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await staffAuth(request);
    if (!authResult.authorized) {
      throw new AuthenticationError(authResult.reason || 'Unauthorized');
    }

    const { id } = await params;
    
    // Handle file upload via FormData
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'Không có file được tải lên' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Upload file to Supabase Storage
    const fileName = `${id}/${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('student-documents')
      .upload(fileName, file);

    if (uploadError) {
      // If bucket doesn't exist, return helpful error
      if (uploadError.message.includes('bucket')) {
        return NextResponse.json(
          { error: 'Storage bucket chưa được tạo. Vui lòng tạo bucket "student-documents" trong Supabase.' },
          { status: 500 }
        );
      }
      throw uploadError;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('student-documents')
      .getPublicUrl(fileName);

    // Save document metadata to database
    const { data: document, error: dbError } = await supabase
      .from('student_documents')
      .insert({
        student_id: id,
        name: file.name,
        type: file.type,
        url: urlData.publicUrl,
        size: file.size,
        storage_path: fileName,
        uploaded_by: authResult.userId,
      })
      .select()
      .single();

    if (dbError) {
      // If table doesn't exist
      if (dbError.code === '42P01') {
        return NextResponse.json(
          { error: 'Bảng student_documents chưa được tạo. Vui lòng chạy migration.' },
          { status: 500 }
        );
      }
      throw dbError;
    }

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
