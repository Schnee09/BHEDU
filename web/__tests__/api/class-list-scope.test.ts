/**
 * @jest-environment node
 */
import { GET } from '@/app/api/classes/route';
import { getAuthContext } from '@/lib/auth/guard';
import { ClassRepository } from '@/lib/repositories/ClassRepository';
import { NextRequest } from 'next/server';

const findAll = jest.fn();

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn(() => ({})) }));
jest.mock('@/lib/repositories/ClassRepository', () => ({
  ClassRepository: jest.fn().mockImplementation(() => ({ findAll })),
}));

function request() {
  return new NextRequest('http://localhost/api/classes');
}

describe('GET /api/classes dynamic role scope', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    findAll.mockResolvedValue({ data: [], page: 1, pageSize: 20, total: 0, totalPages: 0 });
  });

  it.each(['teacher', 'tutor', 'staff', 'scheduler'])(
    'limits %s with classes.view to assigned classes',
    async (role) => {
      jest.mocked(getAuthContext).mockResolvedValue({
        authorized: true,
        profile: { id: `${role}-1`, email: `${role}@example.com` },
        role,
      } as any);

      const response = await GET(request(), { params: Promise.resolve({}) } as any);

      expect(response.status).toBe(200);
      expect(findAll).toHaveBeenCalledWith(expect.objectContaining({ teacher_id: `${role}-1` }));
      expect(ClassRepository).toHaveBeenCalled();
    }
  );
});
