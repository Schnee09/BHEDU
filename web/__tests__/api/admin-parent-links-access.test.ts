/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET, PATCH } from '@/app/api/admin/parent-links/route';
import { getAuthContext } from '@/lib/auth/guard';
import { linkService } from '@/lib/services/linkService';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/services/linkService', () => ({
  linkService: {
    getLinks: jest.fn(),
    updateLinkStatus: jest.fn(),
  },
}));

const linkId = '11111111-1111-4111-8111-111111111111';

function request(method: 'GET' | 'PATCH') {
  return new NextRequest('http://localhost/api/admin/parent-links', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: method === 'PATCH' ? JSON.stringify({ id: linkId, status: 'approved' }) : undefined,
  });
}

describe('admin parent link authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires the dedicated view permission', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: { id: 'staff-1' },
      role: 'staff',
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await GET(request('GET'));

    expect(response.status).toBe(403);
    expect(getAuthContext).toHaveBeenCalledWith(expect.any(NextRequest), 'parent_links.view');
    expect(linkService.getLinks).not.toHaveBeenCalled();
  });

  it('requires the dedicated approval permission', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: { id: 'staff-1' },
      role: 'staff',
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await PATCH(request('PATCH'));

    expect(response.status).toBe(403);
    expect(getAuthContext).toHaveBeenCalledWith(expect.any(NextRequest), 'parent_links.approve');
    expect(linkService.updateLinkStatus).not.toHaveBeenCalled();
  });

  it('records the authenticated reviewer when approving a request', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'admin-1', email: 'admin@bhedu.vn' },
      role: 'admin',
    } as Awaited<ReturnType<typeof getAuthContext>>);
    jest.mocked(linkService.updateLinkStatus).mockResolvedValue({
      id: linkId,
      status: 'approved',
    } as never);

    const response = await PATCH(request('PATCH'));

    expect(response.status).toBe(200);
    expect(linkService.updateLinkStatus).toHaveBeenCalledWith(
      { id: linkId, status: 'approved' },
      'admin-1'
    );
  });
});
