/**
 * @jest-environment node
 */
import { GET } from '@/app/api/admin/classes/route';
import { getAuthContext } from '@/lib/auth/guard';
import { resolveServerPermission } from '@/lib/auth/permissionResolver';
import { ClassService } from '@/lib/services/classService';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/auth/permissionResolver', () => ({ resolveServerPermission: jest.fn() }));
jest.mock('@/lib/services/classService', () => ({
  ClassService: { getClasses: jest.fn(), getClassById: jest.fn() },
}));

function request(search = '') {
  const value: any = new Request(`http://localhost/api/admin/classes${search}`);
  value.nextUrl = new URL(value.url);
  return value;
}

describe('GET /api/admin/classes scope', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(ClassService.getClasses).mockResolvedValue({
      classes: [],
      total: 0,
      page: 1,
      pageSize: 50,
    });
  });

  it('scopes a custom viewer to classes assigned to their profile', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'coordinator-1' },
      role: 'academic_coordinator',
    } as Awaited<ReturnType<typeof getAuthContext>>);
    jest.mocked(resolveServerPermission).mockResolvedValue(false);

    const response = await GET(request(), { params: Promise.resolve({}) } as any);

    expect(response.status).toBe(200);
    expect(ClassService.getClasses).toHaveBeenCalledWith(
      expect.objectContaining({
        context: { role: 'teacher', profileId: 'coordinator-1' },
      })
    );
  });

  it('uses center-wide scope when classes.manage is granted', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'manager-1' },
      role: 'class_manager',
    } as Awaited<ReturnType<typeof getAuthContext>>);
    jest.mocked(resolveServerPermission).mockResolvedValue(true);

    const response = await GET(request(), { params: Promise.resolve({}) } as any);

    expect(response.status).toBe(200);
    expect(ClassService.getClasses).toHaveBeenCalledWith(
      expect.objectContaining({ context: { role: 'admin', profileId: 'manager-1' } })
    );
  });

  it.each(['?page=0', '?limit=0', '?limit=101', '?limit=abc'])(
    'rejects invalid pagination: %s',
    async (search) => {
      jest.mocked(getAuthContext).mockResolvedValue({
        authorized: true,
        profile: { id: 'admin-1' },
        role: 'admin',
      } as Awaited<ReturnType<typeof getAuthContext>>);

      const response = await GET(request(search), { params: Promise.resolve({}) } as any);

      expect(response.status).toBe(400);
      expect(ClassService.getClasses).not.toHaveBeenCalled();
    }
  );
});
