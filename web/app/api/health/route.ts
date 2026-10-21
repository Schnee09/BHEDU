import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/auth/guard';

export async function GET(request: NextRequest) {
  const start = Date.now();
  const auth = await getAuthContext(request, 'system.settings');
  const canViewDetails = auth.authorized && !!auth.profile;
  const checks: Record<string, any> = {
    timestamp: new Date().toISOString(),
  };

  try {
    // 1. Check External Connectivity (Ping Google)
    const googleStart = Date.now();
    try {
      const googleRes = await fetch('https://www.google.com', {
        method: 'HEAD',
        signal: AbortSignal.timeout(2000),
      });
      checks.external = {
        status: googleRes.ok ? 'healthy' : 'degraded',
        latency_ms: Date.now() - googleStart,
      };
    } catch {
      checks.external = { status: 'unreachable', latency_ms: Date.now() - googleStart };
    }

    // 2. Check Database Connectivity (Supabase)
    const dbStart = Date.now();
    try {
      const supabase = createServiceClient();
      const { data, error } = await supabase.from('profiles').select('count').limit(1);

      if (error) throw error;

      checks.database = {
        status: 'healthy',
        latency_ms: Date.now() - dbStart,
        connected: true,
      };
    } catch (dbErr: any) {
      checks.database = {
        status: 'unhealthy',
        error: dbErr.message,
        latency_ms: Date.now() - dbStart,
        connected: false,
      };
    }

    // 3. System Info
    checks.system = {
      nodeVersion: process.version,
      env: process.env.NODE_ENV,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };

    const overallStatus = checks.database.status === 'healthy' ? 'ok' : 'degraded';

    const publicHealth = {
      status: overallStatus,
      duration_total_ms: Date.now() - start,
      timestamp: checks.timestamp,
    };

    return NextResponse.json(canViewDetails ? { ...publicHealth, ...checks } : publicHealth);
  } catch (err: any) {
    return NextResponse.json(
      {
        status: 'error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Health check failed',
        timestamp: checks.timestamp,
      },
      { status: 500 }
    );
  }
}
