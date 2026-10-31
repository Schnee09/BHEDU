import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/auth/guard';
import { logAuditAction } from '@/lib/auditLog';
import { CsvImportError, MAX_CSV_BYTES, parseCsvImport } from '@/lib/imports/parseCsvImport';
import { UserService } from '@/lib/services/userService';
import { StudentService } from '@/lib/services/studentService';

export async function POST(request: Request) {
  try {
    const auth = await getAuthContext(request, 'users.bulk_import');
    if (!auth.authorized || !auth.profile || !auth.role) {
      return NextResponse.json(
        { error: auth.profile ? 'Bạn không có quyền nhập dữ liệu' : 'Vui lòng đăng nhập' },
        {
          status: auth.profile ? 403 : 401,
        }
      );
    }

    const supabase = createServiceClient();
    const userService = new UserService(supabase);
    const studentService = new StudentService(supabase);

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file');
    const type = formData.get('type') as string;

    if (!(file instanceof File) || !type) {
      return NextResponse.json(
        { error: 'Vui lòng chọn file CSV cần nhập' },
        {
          status: 400,
        }
      );
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json({ error: 'Chỉ hỗ trợ file CSV' }, { status: 400 });
    }

    if (file.size > MAX_CSV_BYTES) {
      return NextResponse.json({ error: 'File CSV không được vượt quá 2 MB' }, { status: 413 });
    }

    // Read file content
    const text = await file.text();
    let headers: string[];
    let rows: string[][];
    try {
      ({ headers, rows } = parseCsvImport(text, type));
    } catch (error) {
      if (error instanceof CsvImportError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      throw error;
    }

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    // Process based on type
    if (type === 'students') {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row) continue;
        try {
          const data: Record<string, string> = {};
          headers.forEach((header, idx) => {
            data[header] = row[idx] || '';
          });

          if (!data.full_name?.trim()) {
            throw new Error('Họ và tên là bắt buộc');
          }

          const created = await userService.createUser(
            {
              full_name: data.full_name.trim(),
              email: data.email || undefined,
              phone: data.phone || undefined,
              date_of_birth: data.date_of_birth || undefined,
              role: 'student',
              status: 'active',
              is_managed: true,
            },
            auth.role,
            auth.profile.id
          );

          if (data.class_id) {
            await studentService.enrollStudent(created.id, data.class_id);
          }

          success++;
        } catch (err) {
          failed++;
          errors.push(`Dòng ${i + 2}: ${err instanceof Error ? err.message : 'Không thể xử lý'}`);
        }
      }
    } else {
      return NextResponse.json(
        { error: 'Loại dữ liệu nhập không hợp lệ' },
        {
          status: 400,
        }
      );
    }

    // Standardized audit logging using centralized helper
    await logAuditAction({
      actor_id: auth.profile.id,
      action: 'import',
      resource_type: type,
      resource_id: 'bulk-import',
      details: { success, failed, total: rows.length },
    });

    return NextResponse.json({ success, failed, errors });
  } catch (error) {
    console.error('Bulk import error:', error);
    return NextResponse.json({ error: 'Không thể xử lý file nhập dữ liệu' }, { status: 500 });
  }
}
