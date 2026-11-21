/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET as GET_INCIDENTS, POST as POST_INCIDENT } from '@/app/api/admin/incidents/route';
import { GET as GET_AUDIT_LOGS } from '@/app/api/admin/monitoring/audit-logs/route';
import { GET as GET_AUTH_MONITORING } from '@/app/api/admin/monitoring/auth/route';
import { getAuthContext } from '@/lib/auth/guard';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/incidentLogger', () => ({
  getRecentIncidents: jest.fn(() => []),
  recordIncident: jest.fn(),
}));
jest.mock('@/lib/auth/cache', () => ({
  getCacheStats: jest.fn(),
}));
jest.mock('@/lib/auth/auditLog', () => ({
  exportAuditLogs: jest.fn(),
  getAuditStats: jest.fn(),
  queryAuditLogs: jest.fn(),
}));
jest.mock('@/lib/auth/rateLimit', () => ({
  getAllRateLimits: jest.fn(),
}));

type MonitoringHandler = (request: NextRequest) => Promise<Response>;

const handlers: Array<[string, MonitoringHandler, 'GET' | 'POST']> = [
  ['incident list', GET_INCIDENTS, 'GET'],
  ['incident creation', POST_INCIDENT, 'POST'],
  ['audit log export', GET_AUDIT_LOGS, 'GET'],
  ['authentication monitoring', GET_AUTH_MONITORING, 'GET'],
];

function request(method: 'GET' | 'POST') {
  return new NextRequest('http://localhost/api/admin/monitoring', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: method === 'POST' ? JSON.stringify({ message: 'Test incident' }) : undefined,
  });
}

describe('admin monitoring authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each(handlers)('returns 401 for %s without a profile', async (_name, handler, method) => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: null,
      role: null,
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await handler(request(method));

    expect(response.status).toBe(401);
    expect(getAuthContext).toHaveBeenCalledWith(expect.any(NextRequest), 'system.audit');
  });

  it.each(handlers)('returns 403 for %s without system.audit', async (_name, handler, method) => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: { id: 'admin-1' },
      role: 'admin',
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await handler(request(method));

    expect(response.status).toBe(403);
    expect(getAuthContext).toHaveBeenCalledWith(expect.any(NextRequest), 'system.audit');
  });
});
