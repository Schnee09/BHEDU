import { createGetHandler, apiSuccess } from '@/lib/api';

export const GET = createGetHandler({ requireAuth: true }, async ({ request, user }) => {
  // Try to parse User-Agent
  const userAgent = request.headers.get('user-agent') || 'Unknown Device';
  const ip =
    request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown IP';

  const isSetup = userAgent.includes('Mac OS')
    ? 'MacBook'
    : userAgent.includes('Windows')
      ? 'Windows PC'
      : userAgent.includes('iPhone')
        ? 'iPhone'
        : 'Unknown Device';
  const browser = userAgent.includes('Chrome')
    ? 'Chrome'
    : userAgent.includes('Safari')
      ? 'Safari'
      : userAgent.includes('Firefox')
        ? 'Firefox'
        : 'Browser';

  // Mocking real session array and logs since Supabase GoTrue doesn't easily expose session lists to the standard client without admin keys
  // In a real production system, this would query a discrete user_sessions table and audit_logs table
  return apiSuccess({
    sessions: [
      {
        id: 'current-session',
        device: isSetup,
        browser: browser,
        ip: ip,
        location: 'Đang phân tích...',
        current: true,
      },
    ],
    logs: [], // Empty state for logs until an audit_log system is fully wired
  });
});
