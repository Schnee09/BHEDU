/**
 * Bulk Student Creation API
 * POST /api/admin/students/bulk
 *
 * Creates multiple students at once using UserService and returns credentials
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDataClient } from '@/lib/auth/dataClient';
import { createServiceClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { UserService } from '@/lib/services/userService';

export async function POST(request: NextRequest) {
  try {
    const { user } = await getDataClient(request);

    // Basic auth check
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const studentsInput = body.students; // Expected: [{ full_name: string }, ...]

    if (!Array.isArray(studentsInput) || studentsInput.length === 0) {
      return NextResponse.json({ error: 'Invalid input provided' }, { status: 400 });
    }

    if (studentsInput.length > 50) {
      return NextResponse.json({ error: 'Batch size limit exceeded (max 50)' }, { status: 400 });
    }

    const supabaseService = createServiceClient();
    const userService = new UserService(supabaseService);

    const results = [];
    const errors = [];

    // Process sequentially to ensure reliable sequence and auth account creation
    for (const student of studentsInput) {
      const fullName = student.full_name?.trim();
      if (!fullName) {
        errors.push({ full_name: 'Không xác định', error: 'Họ và tên không được để trống' });
        continue;
      }

      try {
        const created = await userService.createUser(
          {
            full_name: fullName,
            role: 'student',
            grade_level: student.grade_level || undefined,
            is_active: true,
          } as any,
          user.role,
          user.id
        );

        results.push({
          full_name: fullName,
          student_code: created.student_code,
          password: created.tempPassword,
          email: created.email,
          status: 'success',
        });
      } catch (err: any) {
        logger.error(`Failed to create student ${fullName}`, err);
        errors.push({
          full_name: fullName,
          error: err.message || 'Lỗi tạo tài khoản',
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
      errors: errors,
      message: `Đã xử lý ${results.length} học sinh thành công.`,
    });
  } catch (error: any) {
    logger.error('Bulk create error', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
