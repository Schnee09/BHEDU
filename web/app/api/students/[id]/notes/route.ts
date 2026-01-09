/**
 * Student Notes API
 * GET/POST /api/students/[id]/notes
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

    const { data: notes, error } = await supabase
      .from('student_notes')
      .select(`
        id,
        content,
        created_at,
        created_by,
        profiles!student_notes_created_by_fkey (full_name)
      `)
      .eq('student_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      // If table doesn't exist, return empty array
      if (error.code === '42P01') {
        return NextResponse.json({ notes: [] });
      }
      throw error;
    }

    const formattedNotes = (notes || []).map((n: any) => ({
      id: n.id,
      content: n.content,
      created_at: n.created_at,
      created_by: n.profiles ? { full_name: n.profiles.full_name } : null
    }));

    return NextResponse.json({ notes: formattedNotes });
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
    const body = await request.json();
    const { content } = body;

    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'Nội dung ghi chú không được để trống' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    const { data: note, error } = await supabase
      .from('student_notes')
      .insert({
        student_id: id,
        content: content.trim(),
        created_by: authResult.userId,
      })
      .select()
      .single();

    if (error) {
      // If table doesn't exist, create it inline
      if (error.code === '42P01') {
        return NextResponse.json(
          { error: 'Bảng student_notes chưa được tạo. Vui lòng chạy migration.' },
          { status: 500 }
        );
      }
      throw error;
    }

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
