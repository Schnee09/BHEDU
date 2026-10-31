/**
 * Bulk Student Import API
 * POST /api/admin/students/import
 *
 * Handles bulk student creation with validation and error tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth/guard';
import { createServiceClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { UserService } from '@/lib/services/userService';
import { formatVietnameseName } from '@/lib/utils/names';
import { studentImportRequestSchema } from '@/lib/schemas/requests/studentImport';

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext(req, 'students.import');
    if (!auth.authorized || !auth.profile || !auth.role) {
      return NextResponse.json(
        { error: auth.profile ? 'Bạn không có quyền nhập học sinh' : 'Vui lòng đăng nhập' },
        { status: auth.profile ? 403 : 401 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Dữ liệu JSON không hợp lệ' }, { status: 400 });
    }

    const parsed = studentImportRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Dữ liệu nhập học sinh không hợp lệ',
          details: parsed.error.issues.slice(0, 20).map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }
    const { students } = parsed.data;

    const supabase = createServiceClient();
    const userService = new UserService(supabase);

    logger.info(`Starting bulk import of ${students.length} students`, {
      userId: auth.profile.id,
      count: students.length,
    });

    // Create import log
    const { data: importLog, error: logError } = await supabase
      .from('import_logs')
      .insert({
        imported_by: auth.profile.id,
        import_type: 'students',
        total_rows: students.length,
        status: 'processing',
      })
      .select()
      .single();

    if (logError || !importLog) {
      logger.error('Failed to create import log', logError);
      return NextResponse.json({ error: 'Không thể tạo nhật ký nhập dữ liệu' }, { status: 500 });
    }

    const results = {
      importLogId: importLog.id,
      success: [] as string[],
      errors: [] as { row: number; email: string; error: string }[],
      successCount: 0,
      errorCount: 0,
    };

    // Process students in batches
    const BATCH_SIZE = 50;
    for (let i = 0; i < students.length; i += BATCH_SIZE) {
      const batch = students.slice(i, i + BATCH_SIZE);

      for (const [batchIndex, student] of batch.entries()) {
        const rowNumber = i + batchIndex + 2; // +2 for header row and 0-index

        try {
          // 1. Check if student already exists by email if provided
          if (student.email) {
            const { data: existingUser } = await supabase
              .from('profiles')
              .select('id')
              .eq('email', student.email.toLowerCase())
              .maybeSingle();

            if (existingUser) {
              results.errors.push({
                row: rowNumber,
                email: student.email,
                error: 'Email đã được sử dụng bởi một hồ sơ khác',
              });
              results.errorCount++;

              await supabase.from('import_errors').insert({
                import_log_id: importLog.id,
                row_number: rowNumber,
                field_name: 'email',
                error_type: 'duplicate',
                error_message: 'Email đã được sử dụng bởi một hồ sơ khác',
                row_data: student,
                severity: 'error',
              });
              continue;
            }
          }

          // 2. Use centralized UserService for consistent student creation
          const createdUser = await userService.createUser(
            {
              first_name: student.firstName,
              last_name: student.lastName,
              full_name: formatVietnameseName(student.firstName, student.lastName) || undefined,
              email: student.email || undefined,
              role: 'student',
              phone: student.phone,
              address: student.address,
              date_of_birth: student.dateOfBirth,
              gender: student.gender,
              enrollment_date: student.enrollmentDate,
              student_id: student.studentId,
              grade_level: student.gradeLevel,
              status: (student.status as any) || 'active',
              is_managed: true,
            },
            auth.role,
            auth.profile.id
          );

          const studentId = createdUser.id;

          // 3. Create guardian record if guardian information provided
          if (student.guardianName) {
            const { error: guardianError } = await supabase.from('guardians').insert({
              student_id: studentId,
              name: student.guardianName,
              relationship: student.guardianRelationship || null,
              phone: student.guardianPhone || null,
              email: student.guardianEmail || null,
              address: student.guardianAddress || null,
              is_primary_contact: student.isPrimaryContact || false,
              is_emergency_contact: student.isEmergencyContact || false,
            });

            if (guardianError) {
              logger.warn(`Failed to create guardian for row ${rowNumber}`, {
                error: guardianError.message,
                code: guardianError.code,
              });
              await supabase.from('import_errors').insert({
                import_log_id: importLog.id,
                row_number: rowNumber,
                field_name: 'guardian',
                error_type: 'database_error',
                error_message: guardianError.message || 'Failed to create guardian',
                row_data: { guardianName: student.guardianName },
                severity: 'warning',
              });
            }
          }

          results.success.push(studentId);
          results.successCount++;
          logger.info(`Successfully imported student: ${student.email || studentId}`);
        } catch (error: unknown) {
          logger.error(`Import failed for row ${rowNumber}`, error);

          results.errors.push({
            row: rowNumber,
            email: student.email,
            error: 'Không thể tạo hồ sơ học sinh',
          });
          results.errorCount++;

          await supabase.from('import_errors').insert({
            import_log_id: importLog.id,
            row_number: rowNumber,
            field_name: 'user_creation',
            error_type: 'service_error',
            error_message: error instanceof Error ? error.message : 'Không thể tạo hồ sơ học sinh',
            row_data: student,
            severity: 'error',
          });
        }
      }
    }

    // Update import log with final results
    await supabase
      .from('import_logs')
      .update({
        processed_rows: students.length,
        success_count: results.successCount,
        error_count: results.errorCount,
        status:
          results.errorCount === 0
            ? 'completed'
            : results.successCount > 0
              ? 'completed'
              : 'failed',
        error_summary:
          results.errors.length > 0 ? JSON.stringify(results.errors.slice(0, 10)) : null,
      })
      .eq('id', importLog.id);

    // Log audit
    await supabase.from('audit_logs').insert({
      actor_id: auth.profile.id,
      action: 'bulk_import_students',
      resource_type: 'student',
      details: {
        import_log_id: importLog.id,
        total: students.length,
        success: results.successCount,
        errors: results.errorCount,
      },
    });

    return NextResponse.json({
      success: true,
      importLogId: importLog.id,
      results: {
        total: students.length,
        successCount: results.successCount,
        errorCount: results.errorCount,
        errors: results.errors,
      },
    });
  } catch (error) {
    logger.error('Bulk import error', error);
    return NextResponse.json({ error: 'Không thể nhập danh sách học sinh' }, { status: 500 });
  }
}
