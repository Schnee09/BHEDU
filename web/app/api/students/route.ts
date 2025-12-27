/**
 * Role-aware Students API
 * GET/POST /api/students
 *
 * Access rules:
 * - admin: can list all students; can create/edit/delete
 * - staff: can list all students; can create/edit/delete
 * - teacher: can list students in their assigned classes only
 *
 * Refactored to use StudentService for data access
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateQuery } from '@/lib/api/validation';
import { studentQuerySchema } from '@/lib/schemas/students';
import { handleApiError } from '@/lib/api/errors';
import { getDataClient } from '@/lib/auth/dataClient';
import { adminAuth, staffAuth, teacherAuth } from '@/lib/auth/adminAuth';
import { GET as adminGET, POST as adminPOST } from '@/app/api/admin/students/route';
import { StudentService } from '@/lib/students/services/StudentService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await teacherAuth(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.reason || 'Unauthorized' }, { status: 401 });
    }

    // Admin and staff use the existing admin endpoint
    if (auth.userRole === 'admin' || auth.userRole === 'staff') {
      return adminGET(request);
    }

    // Teachers only
    if (auth.userRole !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Use service client for teachers - RLS is bypassed, filtering done in service
    const { createServiceClient } = await import('@/lib/supabase/server');
    const supabase = createServiceClient();
    const queryParams = validateQuery(request, studentQuerySchema);

    const studentService = new StudentService(supabase);
    const result = await studentService.getStudentsForTeacher(auth.userId!, {
      search: queryParams.search,
      page: queryParams.page,
      limit: queryParams.limit,
      status: queryParams.status,
      grade_level: queryParams.grade_level,
      gender: queryParams.gender,
    });

    return NextResponse.json({
      success: true,
      students: result.students,
      total: result.total,
      statistics: result.statistics,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  // Create is staff/admin only
  const isStaff = await staffAuth(request);
  const isAdmin = await adminAuth(request);
  if (!isStaff.authorized && !isAdmin.authorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return adminPOST(request);
}
