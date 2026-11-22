/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/calendar/route';
import { DELETE, PUT } from '@/app/api/calendar/[id]/route';
import { getAuthContext } from '@/lib/auth/guard';
import { createServiceClient } from '@/lib/supabase/server';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn() }));

const context = { params: Promise.resolve({ id: 'event-1' }) };
const event = {
  title: 'Thi giữa kỳ',
  event_type: 'exam',
  start_date: '2026-11-25',
  is_all_day: true,
};

function request(method: 'POST' | 'PUT' | 'DELETE', body?: unknown) {
  return new NextRequest('http://localhost/api/calendar/event-1', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe('calendar management authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    ['create', POST, 'POST', undefined],
    ['update', PUT, 'PUT', context],
    ['delete', DELETE, 'DELETE', context],
  ] as const)('requires calendar.manage to %s an event', async (_name, handler, method, ctx) => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: { id: 'staff-1' },
      role: 'staff',
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await handler(
      request(method, method === 'DELETE' ? undefined : event),
      ctx as never
    );

    expect(response.status).toBe(403);
    expect(getAuthContext).toHaveBeenCalledWith(expect.any(NextRequest), 'calendar.manage');
    expect(createServiceClient).not.toHaveBeenCalled();
  });

  it('allows staff granted calendar.manage through database role permissions', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'staff-1', email: 'staff@example.com' },
      role: 'staff',
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const single = jest.fn().mockResolvedValue({ data: { id: 'event-1', ...event }, error: null });
    const select = jest.fn(() => ({ single }));
    const insert = jest.fn(() => ({ select }));
    jest.mocked(createServiceClient).mockReturnValue({
      from: jest.fn(() => ({ insert })),
    } as unknown as ReturnType<typeof createServiceClient>);

    const response = await POST(request('POST', event));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ ...event, created_by: 'staff-1' })
    );
    expect(json.event.id).toBe('event-1');
  });
});
