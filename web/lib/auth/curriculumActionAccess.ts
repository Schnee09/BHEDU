import type { PermissionCode } from '@/lib/auth/core';

type PermissionCheck = (permission: PermissionCode) => boolean;

export function getCurriculumActionAccess(can: PermissionCheck) {
  return {
    canManage: can('curriculum.manage'),
    canDelete: can('curriculum.delete'),
  };
}
