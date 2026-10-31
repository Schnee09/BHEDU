import { NextResponse } from 'next/server';
import { apiSuccess, createApiHandler } from '@/lib/api/apiHandler';
import { AuthorizationError } from '@/lib/api/errors';
import { checkRateLimit, rateLimitConfigs } from '@/lib/auth/rateLimit';
import { studentLookupSchema } from '@/lib/schemas';
import { studentService } from '@/lib/services/studentService';

const LOOKUP_ROLES = new Set(['parent', 'staff', 'admin', 'owner', 'super_admin']);

export const POST = createApiHandler(
  {
    requireAuth: true,
    bodySchema: studentLookupSchema,
  },
  async ({ body, user }) => {
    if (!LOOKUP_ROLES.has(user.role)) {
      throw new AuthorizationError('Bạn không có quyền tra cứu học sinh');
    }

    const rateCheck = checkRateLimit(`student-lookup:${user.id}`, rateLimitConfigs.authStrict);
    if (!rateCheck.allowed) {
      return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
    }

    const student = await studentService.getStudentByCode(body.student_code);

    return apiSuccess({
      id: student.id,
      full_name: student.full_name,
      student_code: student.student_code,
      role: 'student',
    });
  }
);
