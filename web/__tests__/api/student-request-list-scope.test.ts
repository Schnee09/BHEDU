/**
 * @jest-environment node
 */
import { GET } from '@/app/api/requests/route';
import { createClientFromRequest, createServiceClient } from '@/lib/supabase/server';
import { studentRequestRepository } from '@/lib/repositories/StudentRequestRepository';

jest.mock('@/lib/supabase/server', () => ({
  createClientFromRequest: jest.fn(),
  createServiceClient: jest.fn(),
}));
jest.mock('@/lib/repositories/StudentRequestRepository', () => ({
  studentRequestRepository: { findRequests: jest.fn() },
}));
jest.mock('@/lib/services/StudentRequestService', () => ({ studentRequestService: {} }));

const profileQuery = { select: jest.fn(), eq: jest.fn(), maybeSingle: jest.fn() };
const classQuery = { select: jest.fn(), eq: jest.fn() };

function request(search = '') {
  return new Request(`http://localhost/api/requests${search}`);
}

describe('GET /api/requests role scope', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(createClientFromRequest).mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'auth-1' } }, error: null }),
      },
    } as any);
    profileQuery.select.mockReturnValue(profileQuery);
    profileQuery.eq.mockReturnValue(profileQuery);
    profileQuery.maybeSingle.mockResolvedValue({
      data: { id: 'coordinator-1', user_id: 'auth-1', role: 'academic_coordinator' },
      error: null,
    });
    classQuery.select.mockReturnValue(classQuery);
    classQuery.eq.mockResolvedValue({ data: [{ id: 'class-1' }], error: null });
    jest.mocked(createServiceClient).mockReturnValue({
      from: jest.fn((table: string) => (table === 'profiles' ? profileQuery : classQuery)),
    } as any);
    jest.mocked(studentRequestRepository.findRequests).mockResolvedValue({ data: [], total: 0 });
  });

  it('scopes a custom operational role to assigned classes', async () => {
    const response = await GET(request());

    expect(response.status).toBe(200);
    expect(classQuery.eq).toHaveBeenCalledWith('teacher_id', 'coordinator-1');
    expect(studentRequestRepository.findRequests).toHaveBeenCalledWith(
      expect.objectContaining({ class_ids: ['class-1'] })
    );
  });

  it('rejects a requested class outside the custom role scope', async () => {
    const response = await GET(request('?class_id=class-2'));

    expect(response.status).toBe(403);
    expect(studentRequestRepository.findRequests).not.toHaveBeenCalled();
  });
});
