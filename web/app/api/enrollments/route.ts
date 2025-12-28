/**
 * Enrollments API
 * GET /api/enrollments - List enrollments
 * POST /api/enrollments - Create enrollment (enroll student in class)
 */

import { NextRequest, NextResponse } from 'next/server';
import { staffAuth, teacherAuth } from '@/lib/auth/adminAuth';
import { hasAdminAccess } from '@/lib/auth/permissions';
import { handleApiError, AuthenticationError } from '@/lib/api/errors';
import { logger } from '@/lib/logger';
import { EnrollmentService } from '@/lib/services/EnrollmentService';

export async function GET(request: NextRequest) {
  try {
    const authResult = await teacherAuth(request);
    if (!authResult.authorized) {
      throw new AuthenticationError(authResult.reason || 'Unauthorized');
    }

    const searchParams = request.nextUrl.searchParams;
    const classId = searchParams.get('classId') || undefined;
    const studentId = searchParams.get('studentId') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const enrollmentService = new EnrollmentService();
    const result = await enrollmentService.getEnrollments({
      classId,
      studentId,
      search,
      page,
      limit,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await staffAuth(request);
    if (!authResult.authorized) {
      throw new AuthenticationError(authResult.reason || 'Unauthorized');
    }

    const body = await request.json();
    const { studentId, classId, studentIds } = body;

    if (!classId) {
      return NextResponse.json(
        { success: false, error: 'Mã lớp là bắt buộc' },
        { status: 400 }
      );
    }

    const enrollmentService = new EnrollmentService();

    // Bulk enrollment
    if (studentIds && Array.isArray(studentIds)) {
      const result = await enrollmentService.bulkEnroll(classId, studentIds);
      logger.info('Bulk enrollment:', { classId, ...result });
      return NextResponse.json({ 
        success: true, 
        message: `Đã ghi danh ${result.success} học sinh, ${result.failed} thất bại`,
        ...result 
      });
    }

    // Single enrollment
    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'Mã học sinh là bắt buộc' },
        { status: 400 }
      );
    }

    const enrollment = await enrollmentService.createEnrollment({ studentId, classId });
    logger.info('Enrollment created:', { enrollmentId: enrollment.id });

    return NextResponse.json({ success: true, enrollment }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
