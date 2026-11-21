/**
 * @jest-environment node
 */
import { GET } from '@/app/api/admin/details/classes/[id]/route';
import { getAuthContext } from '@/lib/auth/guard';
import { getDataClient } from '@/lib/auth/dataClient';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/auth/dataClient', () => ({ getDataClient: jest.fn() }));

const context = { params: Promise.resolve({ id: 'class-1' }) };
const request = new Request('http://localhost/api/admin/details/classes/class-1');

describe('GET /api/admin/details/classes/[id] authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when no authenticated profile is available', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: null,
      role: null,
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await GET(request, context);

    expect(response.status).toBe(401);
    expect(getAuthContext).toHaveBeenCalledWith(request, 'classes.view');
    expect(getDataClient).not.toHaveBeenCalled();
  });

  it('returns 403 when the profile lacks classes.view', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: { id: 'student-1' },
      role: 'student',
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await GET(request, context);

    expect(response.status).toBe(403);
    expect(getDataClient).not.toHaveBeenCalled();
  });
});
