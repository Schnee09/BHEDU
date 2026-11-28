import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserRole } from './core';
import { canAccessStudent } from './classAccess';
import { resolveServerPermission } from './permissionResolver';

export async function resolveStudentDetailAccess(
  supabase: SupabaseClient,
  viewer: { id: string; role: UserRole },
  studentId: string
): Promise<{ allowed: boolean; canViewFinance: boolean }> {
  const selfOrParent = viewer.role === 'student' || viewer.role === 'parent';
  const [canViewStudents, canViewFinancePermission] = await Promise.all([
    selfOrParent
      ? Promise.resolve(true)
      : resolveServerPermission(viewer.id, viewer.role, 'students.view'),
    resolveServerPermission(viewer.id, viewer.role, 'finance.view'),
  ]);

  if (!canViewStudents) return { allowed: false, canViewFinance: false };

  const inScope = await canAccessStudent(supabase, viewer, studentId);
  if (!inScope) return { allowed: false, canViewFinance: false };

  return {
    allowed: true,
    canViewFinance: canViewFinancePermission || selfOrParent,
  };
}
