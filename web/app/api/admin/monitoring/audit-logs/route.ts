/**
 * Audit Logs Export API
 * GET /api/admin/monitoring/audit-logs?format=json|csv&hours=24
 *
 * Export audit logs for analysis
 */

import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth/guard';
import { queryAuditLogs, exportAuditLogs, type AuditEventType } from '@/lib/auth/auditLog';

export async function GET(request: Request) {
  try {
    const auth = await getAuthContext(request, 'system.audit');
    if (!auth.profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!auth.authorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const format = (searchParams.get('format') || 'json') as 'json' | 'csv';
    const hours = parseInt(searchParams.get('hours') || '24', 10);
    const type = searchParams.get('type');
    const userId = searchParams.get('userId');

    const startTime = Date.now() - hours * 60 * 60 * 1000;

    // Query logs with filters
    const logs = queryAuditLogs({
      startTime,
      type: (type as AuditEventType | null) || undefined,
      userId: userId || undefined,
    });

    if (format === 'csv') {
      // Generate CSV
      const csv = exportAuditLogs('csv');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit-logs-${Date.now()}.csv"`,
        },
      });
    }

    // Return JSON
    return NextResponse.json({
      success: true,
      logs,
      count: logs.length,
      filters: {
        hours,
        type,
        userId,
      },
    });
  } catch (error) {
    console.error('Audit logs export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
