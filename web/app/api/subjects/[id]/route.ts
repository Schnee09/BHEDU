/**
 * Single Subject API
 * GET /api/subjects/[id] - Get subject details
 * PUT /api/subjects/[id] - Update subject
 * DELETE /api/subjects/[id] - Delete subject
 */

import { NextRequest, NextResponse } from 'next/server';
import { staffAuth, teacherAuth } from '@/lib/auth/adminAuth';
import { handleApiError, AuthenticationError, NotFoundError } from '@/lib/api/errors';
import { SubjectService } from '@/lib/services/SubjectService';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await teacherAuth(request);
    if (!authResult.authorized) {
      throw new AuthenticationError(authResult.reason || 'Unauthorized');
    }

    const { id } = await params;
    const subjectService = new SubjectService();
    const subject = await subjectService.getSubjectById(id);

    if (!subject) {
      throw new NotFoundError('Không tìm thấy môn học');
    }

    return NextResponse.json({ success: true, subject });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await staffAuth(request);
    if (!authResult.authorized) {
      throw new AuthenticationError(authResult.reason || 'Unauthorized');
    }

    const { id } = await params;
    const body = await request.json();
    const { name, code, description, credits, isActive } = body;

    const subjectService = new SubjectService();
    
    const existing = await subjectService.getSubjectById(id);
    if (!existing) {
      throw new NotFoundError('Không tìm thấy môn học');
    }

    const updated = await subjectService.updateSubject(id, {
      name,
      code,
      description,
      credits,
      isActive,
    });

    return NextResponse.json({ success: true, subject: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await staffAuth(request);
    if (!authResult.authorized) {
      throw new AuthenticationError(authResult.reason || 'Unauthorized');
    }

    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const hardDelete = searchParams.get('hard') === 'true';

    const subjectService = new SubjectService();
    
    const existing = await subjectService.getSubjectById(id);
    if (!existing) {
      throw new NotFoundError('Không tìm thấy môn học');
    }

    await subjectService.deleteSubject(id, hardDelete);

    return NextResponse.json({ 
      success: true, 
      message: hardDelete ? 'Đã xóa môn học' : 'Đã vô hiệu hóa môn học' 
    });
  } catch (error) {
    return handleApiError(error);
  }
}

