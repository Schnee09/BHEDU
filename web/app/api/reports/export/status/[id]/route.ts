import { NextResponse } from 'next/server';
import { createGetHandler } from '@/lib/api';
import { createServiceClient } from '@/lib/supabase/server';
import { enforceRateLimit } from '@/lib/api/rateLimit';
import { rateLimitConfigs } from '@/lib/auth/rateLimit';

export const dynamic = 'force-dynamic';

const MANAGEMENT_ROLES = new Set(['super_admin', 'owner', 'admin']);

export const GET = createGetHandler({ requireAuth: true }, async ({ request, params, user }) => {
  const limited = enforceRateLimit(request, {
    bucketConfig: rateLimitConfigs.apiBucket,
    keyPrefix: 'reports-export-status',
  });
  if (limited) return limited.response;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('report_exports')
    .select(
      'id, status, created_at, started_at, finished_at, result_url, error_message, requested_by'
    )
    .eq('id', params.id)
    .maybeSingle();

  if (error) throw new Error(`Failed to load export status: ${error.message}`);
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const ownsJob = data.requested_by === user.id;
  const canManageAll = MANAGEMENT_ROLES.has(user.role);
  if (!ownsJob && !canManageAll) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({
    success: true,
    job: {
      id: data.id,
      status: data.status,
      created_at: data.created_at,
      started_at: data.started_at,
      finished_at: data.finished_at,
      downloadUrl: data.result_url || null,
      error: data.error_message || null,
    },
  });
});
