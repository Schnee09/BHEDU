/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/classes/route';
import { getAuthContext } from '@/lib/auth/guard';
import { ClassRepository } from '@/lib/repositories/ClassRepository';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/repositories/ClassRepository');
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn(() => ({})) }));

function request(body: unknown) {
  return new NextRequest('http://localhost/api/classes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/classes dynamic authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires classes.create explicitly', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: { id: 'staff-1' },
      role: 'staff',
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await POST(request({ name: 'Lớp Toán 9' }));

    expect(response.status).toBe(403);
    expect(getAuthContext).toHaveBeenCalledWith(expect.any(NextRequest), 'classes.create');
  });

  it('allows a non-admin role granted classes.create dynamically', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'staff-1', email: 'staff@example.com' },
      role: 'staff',
      isCustomOverride: true,
    } as Awaited<ReturnType<typeof getAuthContext>>);
    const create = jest.fn().mockResolvedValue({ id: 'class-1', name: 'Lớp Toán 9' });
    jest.mocked(ClassRepository).mockImplementation(
      () =>
        ({
          create,
        }) as unknown as ClassRepository
    );

    const response = await POST(request({ name: 'Lớp Toán 9' }));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Lớp Toán 9', capacity: 40, status: 'active' })
    );
    expect(json.class.id).toBe('class-1');
  });
});
