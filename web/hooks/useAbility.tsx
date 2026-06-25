/**
 * useAbility Hook
 * React hook for permission checking
 * Aligned with BH-EDU v5.0 Architecture
 */

'use client';

import { useMemo } from 'react';
import { useProfile } from './useProfile';
import { createAbility, AbilityService } from '@/lib/auth/permissions';
import type { UserRole } from '@/lib/auth/core';

/**
 * Hook to get ability instance for current user
 *
 * @example
 * function GradeRow({ grade }) {
 *   const ability = useAbility();
 *
 *   return (
 *     <tr>
 *       <td>{grade.score}</td>
 *       {ability.can('update', grade) && (
 *         <td><EditButton /></td>
 *       )}
 *     </tr>
 *   );
 * }
 */
export function useAbility(): AbilityService {
  const { profile } = useProfile();

  return useMemo(() => {
    if (!profile) {
      // Return ability with no permissions for unauthenticated users
      return createAbility({
        userId: '',
        role: 'student' as UserRole, // Most restrictive
        classIds: [],
      });
    }

    // Get user's class IDs if they're a teacher
    const classIds =
      profile.role === 'teacher' || profile.role === 'tutor' ? (profile as any).classIds || [] : [];

    return createAbility({
      userId: profile.id,
      role: profile.role as UserRole,
      classIds,
      metadata: {
        email: profile.email,
        fullName: profile.full_name,
      },
    });
  }, [profile]);
}

/**
 * Hook to check a specific permission
 * Useful for conditional rendering
 *
 * @example
 * function DeleteButton({ grade }) {
 *   const canDelete = usePermission('delete', grade);
 *
 *   if (!canDelete) return null;
 *   return <button>Delete</button>;
 * }
 */
export function usePermission(
  action: import('@/lib/auth/permissions').Action,
  subject: import('@/lib/auth/permissions').Subject | object,
  field?: string
): boolean {
  const ability = useAbility();

  return useMemo(() => {
    return ability.can(action, subject, field);
  }, [ability, action, subject, field]);
}

/**
 * Hook to get filtered array based on permissions
 *
 * @example
 * function GradeList({ grades }) {
 *   const editableGrades = usePermissionFilter('update', grades);
 *
 *   return (
 *     <div>
 *       {editableGrades.map(grade => (
 *         <GradeRow key={grade.id} grade={grade} editable />
 *       ))}
 *     </div>
 *   );
 * }
 */
export function usePermissionFilter<T extends object>(
  action: import('@/lib/auth/permissions').Action,
  subjects: T[]
): T[] {
  const ability = useAbility();

  return useMemo(() => {
    return ability.filter(action, subjects);
  }, [ability, action, subjects]);
}
