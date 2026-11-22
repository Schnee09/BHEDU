/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/classes/route';
import { getAuthContext } from '@/lib/auth/guard';
import { createServiceClient } from '@/lib/supabase/server';
import { ClassRepository } from '@/lib/repositories/ClassRepository';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn(() => ({})) }));
jest.mock('@/lib/repositories/ClassRepository');

function request() {
  return new NextRequest('http://localhost/api/classes');
}

describe('GET /api/classes authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires classes.view before loading class data with service-role access', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: { id: 'teacher-1' },
      role: 'teacher',
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await GET(request());

    expect(response.status).toBe(403);
    expect(getAuthContext).toHaveBeenCalledWith(expect.any(NextRequest), 'classes.view');
    expect(createServiceClient).not.toHaveBeenCalled();
    expect(ClassRepository).not.toHaveBeenCalled();
  });
});
