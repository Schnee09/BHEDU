import { canAccessStudent } from '@/lib/auth/classAccess';
import { resolveServerPermission } from '@/lib/auth/permissionResolver';
import { resolveStudentDetailAccess } from '@/lib/auth/studentDetailAccess';

jest.mock('@/lib/auth/classAccess', () => ({ canAccessStudent: jest.fn() }));
jest.mock('@/lib/auth/permissionResolver', () => ({ resolveServerPermission: jest.fn() }));

const supabase = {} as any;

describe('resolveStudentDetailAccess', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(canAccessStudent).mockResolvedValue(true);
  });

  it('rejects an operational role when students.view has been denied', async () => {
    jest.mocked(resolveServerPermission).mockResolvedValue(false);

    await expect(
      resolveStudentDetailAccess(supabase, { id: 'staff-1', role: 'staff' }, 'student-1')
    ).resolves.toEqual({ allowed: false, canViewFinance: false });

    expect(canAccessStudent).not.toHaveBeenCalled();
  });

  it('keeps finance hidden when the viewer only has students.view', async () => {
    jest.mocked(resolveServerPermission).mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    await expect(
      resolveStudentDetailAccess(supabase, { id: 'teacher-1', role: 'teacher' }, 'student-1')
    ).resolves.toEqual({ allowed: true, canViewFinance: false });
  });

  it.each(['student', 'parent'] as const)(
    'allows an in-scope %s to view the linked financial summary',
    async (role) => {
      jest.mocked(resolveServerPermission).mockResolvedValue(false);

      await expect(
        resolveStudentDetailAccess(supabase, { id: `${role}-1`, role }, 'student-1')
      ).resolves.toEqual({ allowed: true, canViewFinance: true });
    }
  );

  it('rejects a parent outside the approved student scope', async () => {
    jest.mocked(resolveServerPermission).mockResolvedValue(false);
    jest.mocked(canAccessStudent).mockResolvedValue(false);

    await expect(
      resolveStudentDetailAccess(supabase, { id: 'parent-1', role: 'parent' }, 'student-1')
    ).resolves.toEqual({ allowed: false, canViewFinance: false });
  });
});
