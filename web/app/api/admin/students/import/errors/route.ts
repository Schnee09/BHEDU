import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthContext } from '@/lib/auth/guard';
import { logger } from '@/lib/logger';
import { createServiceClient } from '@/lib/supabase/server';

const errorsQuerySchema = z.object({
  importLogId: z.string().uuid(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext(req, 'students.import');
    if (!auth.authorized || !auth.profile) {
      return NextResponse.json(
        { error: auth.profile ? 'Bạn không có quyền xem lỗi nhập học sinh' : 'Vui lòng đăng nhập' },
        { status: auth.profile ? 403 : 401 }
      );
    }

    const parsedQuery = errorsQuerySchema.safeParse({
      importLogId: req.nextUrl.searchParams.get('import_log_id'),
      limit: req.nextUrl.searchParams.get('limit') || undefined,
      offset: req.nextUrl.searchParams.get('offset') || undefined,
    });
    if (!parsedQuery.success) {
      return NextResponse.json({ error: 'Tham số xem lỗi không hợp lệ' }, { status: 400 });
    }
    const { importLogId, limit, offset } = parsedQuery.data;

    const supabase = createServiceClient();
    const { data: importLog, error: logError } = await supabase
      .from('import_logs')
      .select('id')
      .eq('id', importLogId)
      .eq('import_type', 'students')
      .maybeSingle();

    if (logError) {
      logger.error('Failed to verify student import log', { error: logError, importLogId });
      return NextResponse.json({ error: 'Không thể kiểm tra lượt nhập học sinh' }, { status: 500 });
    }
    if (!importLog) {
      return NextResponse.json({ error: 'Không tìm thấy lượt nhập học sinh' }, { status: 404 });
    }

    const { data, error, count } = await supabase
      .from('import_errors')
      .select(
        'id, import_log_id, row_number, field_name, error_type, error_message, severity, created_at',
        { count: 'exact' }
      )
      .eq('import_log_id', importLogId)
      .order('row_number', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('Failed to fetch student import errors', { error, importLogId });
      return NextResponse.json(
        { error: 'Không thể tải chi tiết lỗi nhập học sinh' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    });
  } catch (error) {
    logger.error('Student import errors request failed', error);
    return NextResponse.json(
      { error: 'Không thể tải chi tiết lỗi nhập học sinh' },
      { status: 500 }
    );
  }
}
