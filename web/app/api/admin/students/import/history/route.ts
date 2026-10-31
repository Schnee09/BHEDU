import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthContext } from '@/lib/auth/guard';
import { logger } from '@/lib/logger';
import { createServiceClient } from '@/lib/supabase/server';

const historyQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext(req, 'students.import');
    if (!auth.authorized || !auth.profile) {
      return NextResponse.json(
        {
          error: auth.profile
            ? 'Bạn không có quyền xem lịch sử nhập học sinh'
            : 'Vui lòng đăng nhập',
        },
        { status: auth.profile ? 403 : 401 }
      );
    }

    const parsedQuery = historyQuerySchema.safeParse({
      limit: req.nextUrl.searchParams.get('limit') || undefined,
      offset: req.nextUrl.searchParams.get('offset') || undefined,
    });
    if (!parsedQuery.success) {
      return NextResponse.json({ error: 'Tham số phân trang không hợp lệ' }, { status: 400 });
    }
    const { limit, offset } = parsedQuery.data;

    const supabase = createServiceClient();
    const {
      data: logs,
      error,
      count,
    } = await supabase
      .from('import_logs')
      .select(
        `
          id,
          import_type,
          status,
          total_rows,
          processed_rows,
          success_count,
          error_count,
          created_at,
          completed_at,
          importer:profiles!import_logs_imported_by_fkey(id, full_name)
        `,
        { count: 'exact' }
      )
      .eq('import_type', 'students')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('Failed to fetch student import history', { error });
      return NextResponse.json({ error: 'Không thể tải lịch sử nhập học sinh' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      logs: logs || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    });
  } catch (error) {
    logger.error('Student import history error', error);
    return NextResponse.json({ error: 'Không thể tải lịch sử nhập học sinh' }, { status: 500 });
  }
}
