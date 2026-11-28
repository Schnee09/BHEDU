import { getCurriculumActionAccess } from '@/lib/auth/curriculumActionAccess';
import type { PermissionCode } from '@/lib/auth/core';

function accessFor(...permissions: PermissionCode[]) {
  return getCurriculumActionAccess((permission) => permissions.includes(permission));
}

describe('getCurriculumActionAccess', () => {
  it('keeps curriculum.view read-only', () => {
    expect(accessFor('curriculum.view')).toEqual({
      canManage: false,
      canDelete: false,
    });
  });

  it('maps curriculum.manage to create and edit access', () => {
    expect(accessFor('curriculum.view', 'curriculum.manage')).toEqual({
      canManage: true,
      canDelete: false,
    });
  });

  it('keeps curriculum.delete independent from management access', () => {
    expect(accessFor('curriculum.view', 'curriculum.delete')).toEqual({
      canManage: false,
      canDelete: true,
    });
  });
});
