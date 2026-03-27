import { apiSuccess, createGetHandler } from '@/lib/api';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * System Health API
 * GET /api/admin/system/health
 *
 * Checks database connectivity and returns basic system status
 */
export const GET = createGetHandler({ allowedRoles: ['admin', 'super_admin'] }, async () => {
  const supabase = createServiceClient();
  const startTime = Date.now();

  // Check database connectivity
  const { error: dbError } = await supabase.from('academic_years').select('id').limit(1);

  if (dbError) {
    console.error('System health check - Database error:', dbError);
    return Response.json(
      {
        success: false,
        status: 'unhealthy',
        checks: {
          database: {
            status: 'down',
            error: dbError.message,
          },
        },
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }

  const latency = Date.now() - startTime;

  return apiSuccess({
    status: 'healthy',
    checks: {
      database: {
        status: 'up',
        latency: `${latency}ms`,
      },
    },
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});
