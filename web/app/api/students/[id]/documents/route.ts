/**
 * Student Documents API
 * GET/POST /api/students/[id]/documents
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/auth/adminAuth';
import { createServiceClient } from '@/lib/supabase/server';
import { handleApiError, AuthenticationError } from '@/lib/api/errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const DOCUMENT_BUCKET = 'student-documents';
const SIGNED_URL_TTL_SECONDS = 15 * 60;
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;
const ALLOWED_DOCUMENT_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
]);

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await adminAuth(request);
    if (!authResult.authorized) {
      throw new AuthenticationError(authResult.reason || 'Unauthorized');
    }

    const { id } = await params;
    const supabase = createServiceClient();

    const { data: documents, error } = await supabase
      .from('student_documents')
      .select(
        `
        id,
        name,
        type,
        storage_path,
        size,
        uploaded_at,
        uploaded_by,
        profiles!student_documents_uploaded_by_fkey (full_name)
      `
      )
      .eq('student_id', id)
      .order('uploaded_at', { ascending: false });

    if (error) {
      // If table doesn't exist, return empty array
      if (error.code === '42P01') {
        return NextResponse.json({ documents: [] });
      }
      throw error;
    }

    const formattedDocs = await Promise.all(
      (documents || []).map(async (document: any) => {
        let signedUrl = '';
        if (document.storage_path) {
          const { data } = await supabase.storage
            .from(DOCUMENT_BUCKET)
            .createSignedUrl(document.storage_path, SIGNED_URL_TTL_SECONDS);
          signedUrl = data?.signedUrl || '';
        }

        return {
          id: document.id,
          name: document.name,
          type: document.type,
          url: signedUrl,
          size: document.size,
          uploaded_at: document.uploaded_at,
          uploaded_by: document.profiles ? { full_name: document.profiles.full_name } : null,
        };
      })
    );

    return NextResponse.json({ documents: formattedDocs });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await adminAuth(request);
    if (!authResult.authorized) {
      throw new AuthenticationError(authResult.reason || 'Unauthorized');
    }

    const { id } = await params;

    // Handle file upload via FormData
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Không có file được tải lên' }, { status: 400 });
    }

    if (!ALLOWED_DOCUMENT_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'Chỉ hỗ trợ tệp PDF, ảnh, Word, Excel hoặc CSV' },
        { status: 400 }
      );
    }

    if (file.size > MAX_DOCUMENT_SIZE) {
      return NextResponse.json({ error: 'Tệp tải lên không được vượt quá 10 MB' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Upload file to Supabase Storage
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${id}/${Date.now()}_${safeFileName}`;
    const { error: uploadError } = await supabase.storage
      .from(DOCUMENT_BUCKET)
      .upload(fileName, file);

    if (uploadError) {
      // If bucket doesn't exist, return helpful error
      if (uploadError.message.includes('bucket')) {
        return NextResponse.json(
          {
            error:
              'Storage bucket chưa được tạo. Vui lòng tạo bucket "student-documents" trong Supabase.',
          },
          { status: 500 }
        );
      }
      throw uploadError;
    }

    // Save document metadata to database
    const { data: document, error: dbError } = await supabase
      .from('student_documents')
      .insert({
        student_id: id,
        name: file.name,
        type: file.type,
        url: '',
        size: file.size,
        storage_path: fileName,
        uploaded_by: authResult.userId,
      })
      .select()
      .single();

    if (dbError) {
      await supabase.storage.from(DOCUMENT_BUCKET).remove([fileName]);
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
