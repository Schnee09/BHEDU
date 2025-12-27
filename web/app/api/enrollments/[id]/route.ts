/**
 * Single Enrollment API
 * DELETE /api/enrollments/[id] - Remove enrollment
 */

import { NextRequest, NextResponse } from 'next/server';
import { staffAuth } from '@/lib/auth/adminAuth';
import { handleApiError, AuthenticationError } from '@/lib/api/errors';
import { logger } from '@/lib/logger';
import { EnrollmentService } from '@/lib/services/EnrollmentService';

interface RouteParams {
  params: { id: string };
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await staffAuth(request);
    if (!authResult.authorized) {
      throw new AuthenticationError(authResult.reason || 'Unauthorized');
    }

    const { id } = params;
    const enrollmentService = new EnrollmentService();

    await enrollmentService.deleteEnrollment(id);
    logger.info('Enrollment deleted:', { enrollmentId: id });

    return NextResponse.json({ success: true, message: 'Đã hủy ghi danh' });
  } catch (error) {
    return handleApiError(error);
  }
}
