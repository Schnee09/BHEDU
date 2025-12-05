/**
 * Individual Student API
 * GET /api/students/[id]
 * 
 * Fetch individual student details
 */

import { NextResponse } from 'next/server';
import { createClientFromRequest } from '@/lib/supabase/server';
import { teacherAuth } from '@/lib/auth/adminAuth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const authResult = await teacherAuth(request);
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.reason || 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createClientFromRequest(request as any);

    const { data: student, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', resolvedParams.id)
      .eq('role', 'student')
      .single();

    if (error || !student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      student,
    });
  } catch (error: any) {
    console.error('Error fetching student:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
