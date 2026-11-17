import { createGetHandler, apiSuccess } from '@/lib/api';

export const GET = createGetHandler({ requireAuth: true }, async ({ request }) => {
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

  // Supabase does not expose a complete per-user session list here. Return only
  // metadata from the authenticated request instead of inventing other devices.
  return apiSuccess({
    sessions: [
      {
        id: 'current-session',
        device: isSetup,
        browser: browser,
        ip: ip,
        location: 'Không xác định',
        current: true,
      },
    ],
    logs: [],
  });
});
