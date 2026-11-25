/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/classes/[id]/route';
import { getAuthContext } from '@/lib/auth/guard';
import { resolveServerPermission } from '@/lib/auth/permissionResolver';
import { ClassService } from '@/lib/services/classService';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/auth/permissionResolver', () => ({ resolveServerPermission: jest.fn() }));
jest.mock('@/lib/services/classService', () => ({
  ClassService: {
    getClassById: jest.fn(),
  },
}));

const routeContext = { params: Promise.resolve({ id: 'class-1' }) };

function request() {
  return new NextRequest('http://localhost/api/admin/classes/class-1');
}

function authenticate(id: string, role: string) {
  jest.mocked(getAuthContext).mockResolvedValue({
    authorized: true,
    profile: { id, role, email: `${id}@example.com`, is_active: true },
    role,
  } as Awaited<ReturnType<typeof getAuthContext>>);
}

describe('GET /api/admin/classes/[id] scope', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(ClassService.getClassById).mockResolvedValue({
      id: 'class-1',
      teacher_id: 'teacher-1',
    } as Awaited<ReturnType<typeof ClassService.getClassById>>);
  });

  it('allows a dynamically granted class manager to view any class', async () => {
    authenticate('staff-1', 'staff');
    jest.mocked(resolveServerPermission).mockResolvedValue(true);

    const response = await GET(request(), routeContext);

    expect(response.status).toBe(200);
    expect(resolveServerPermission).toHaveBeenCalledWith('staff-1', 'staff', 'classes.manage');
  });

  it('allows assigned teaching staff without global management permission', async () => {
    authenticate('teacher-1', 'teacher');
    jest.mocked(resolveServerPermission).mockResolvedValue(false);

    const response = await GET(request(), routeContext);

    expect(response.status).toBe(200);
  });

  it('allows an assigned custom role without global management permission', async () => {
    authenticate('teacher-1', 'academic_coordinator');
    jest.mocked(resolveServerPermission).mockResolvedValue(false);

    const response = await GET(request(), routeContext);

    expect(response.status).toBe(200);
  });

  it('rejects an unassigned viewer without global management permission', async () => {
    authenticate('teacher-2', 'teacher');
    jest.mocked(resolveServerPermission).mockResolvedValue(false);

    const response = await GET(request(), routeContext);
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.error).toBeDefined();
  });
});
