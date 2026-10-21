import type { UserRole } from './core';
import type { RequestStatus } from '@/lib/repositories/StudentRequestRepository';

const REQUEST_ADMIN_ROLES = new Set<UserRole>(['admin', 'owner', 'super_admin', 'staff']);

export function canSubmitStudentRequest(
  role: UserRole,
  actorProfileId: string,
  studentId: string,
  hasApprovedParentLink = false
): boolean {
  if (role === 'student') return actorProfileId === studentId;
  if (role === 'parent') return hasApprovedParentLink;
  return REQUEST_ADMIN_ROLES.has(role);
}

export function canChangeStudentRequestStatus(input: {
  role: UserRole;
  currentStatus: RequestStatus;
  nextStatus: 'approved' | 'rejected' | 'cancelled';
  isOwner: boolean;
  isAssignedTeacher: boolean;
}): boolean {
  if (input.currentStatus !== 'pending') return false;

  if (input.role === 'student' || input.role === 'parent') {
    return input.isOwner && input.nextStatus === 'cancelled';
  }

  if (input.role === 'teacher') {
    return input.isAssignedTeacher && input.nextStatus !== 'cancelled';
  }

  return REQUEST_ADMIN_ROLES.has(input.role);
}
