/**
 * Unified Permission System Core
 * This is the single source of truth for both client and server-side authorization.
 */

// ============================================
// TYPES
// ============================================

export type UserRole =
  | 'super_admin'
  | 'owner'
  | 'admin'
  | 'staff'
  | 'teacher'
  | 'tutor'
  | 'parent'
  | 'student';

export type PermissionCode =
  // System - Super Admin only
  | 'system.settings'
  | 'system.audit'
  | 'system.database'
  | 'system.impersonate'
  | 'system.deploy'
  // Roles & Permissions
  | 'roles.view'
  | 'roles.manage'
  | 'permissions.manage'
  // Users
  | 'users.view'
  | 'users.create'
  | 'users.edit'
  | 'users.delete.soft'
  | 'users.delete.hard'
  | 'users.delete'
  | 'users.invite'
  | 'users.bulk_import'
  // Parent-Student Links
  | 'parent_links.view'
  | 'parent_links.approve'
  // Students
  | 'students.view'
  | 'students.create'
  | 'students.edit'
  | 'students.delete'
  | 'students.import'
  // Classes
  | 'classes.manage'
  | 'classes.view'
  | 'classes.create'
  | 'classes.edit'
  | 'classes.delete'
  | 'classes.enroll'
  // Timetable
  | 'timetable.view'
  | 'timetable.edit'
  // Grades
  | 'grades.view'
  | 'grades.entry'
  | 'grades.manage'
  | 'grades.delete'
  | 'grades.analytics'
  // Curriculum
  | 'curriculum.view'
  | 'curriculum.manage'
  // Parent
  | 'parent.view_students'
  | 'parent.link_student'
  // Attendance
  | 'attendance.view'
  | 'attendance.mark'
  | 'attendance.manage'
  | 'attendance.reports'
  // Enrollments
  | 'enrollments.view'
  | 'enrollments.manage'
  // Subjects
  | 'subjects.view'
  | 'subjects.manage'
  // Reports
  | 'reports.view'
  | 'reports.export'
  // Finance
  | 'finance.view'
  | 'finance.manage'
  | 'finance.refund'
  | 'finance.export'
  // Tutoring Sessions
  | 'tutoring.sessions.view'
  | 'tutoring.sessions.manage'
  | 'tutoring.feedback.submit'
  // Announcements
  | 'announcements.manage'
  | '*'; // Wildcard

export interface Permission {
  code: PermissionCode;
  name: string;
  category: string;
}

// ============================================
// ROLE HIERARCHY (Inheritance)
// ============================================

/**
 * Defines which roles inherit from which other roles.
 * A role inherits everything from its parent.
 */
export const ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
  super_admin: ['owner', 'admin'],
  owner: ['staff'],
  admin: ['staff', 'teacher'],
  staff: ['student'],
  teacher: ['student'],
  tutor: ['student'],
  parent: ['student'],
  student: [],
};

// ============================================
// BASE PERMISSIONS
// ============================================

/**
 * Permissions explicitly granted to each role.
 * Does not include inherited permissions.
 */
export const BASE_ROLE_PERMISSIONS: Record<UserRole, PermissionCode[]> = {
  super_admin: ['*'], // God mode
  owner: [
    'reports.view',
    'reports.export',
    'grades.analytics',
    'grades.manage',
    'finance.view',
    'finance.manage',
    'finance.refund',
    'finance.export',
  ],
  admin: [
    'system.audit',
    'roles.view',
    'roles.manage',
    'permissions.manage',
    'users.delete.soft',
    'users.invite',
    'users.bulk_import',
    'parent_links.approve',
    'curriculum.manage',
    'enrollments.view',
    'enrollments.manage',
    'subjects.view',
    'subjects.manage',
    'grades.entry',
    'grades.manage',
    'announcements.manage',
    'classes.view',
    'finance.view',
    'finance.manage',
    'finance.refund',
  ],
  staff: [
    'users.view',
    'users.create',
    'users.edit',
    'users.delete.soft',
    'parent_links.view',
    'students.create',
    'students.edit',
    'students.delete',
    'classes.manage',
    'classes.create',
    'classes.edit',
    'classes.delete',
    'classes.enroll',
    'enrollments.view',
    'enrollments.manage',
    'curriculum.manage',
    'grades.entry',
    'grades.manage',
    'announcements.manage',
    'classes.view',
    'finance.view',
    'finance.manage',
  ],
  teacher: [
    'grades.entry',
    'grades.manage',
    'grades.delete',
    'attendance.mark',
    'attendance.reports',
    'curriculum.manage',
    'timetable.edit',
  ],
  tutor: ['tutoring.sessions.view', 'tutoring.sessions.manage', 'tutoring.feedback.submit'],
  parent: ['parent.view_students', 'parent.link_student'],
  student: [
    'students.view',
    'classes.view',
    'timetable.view',
    'grades.view',
    'attendance.view',
    'reports.view',
    'curriculum.view',
  ],
};

// ============================================
// RESOLUTION LOGIC
// ============================================

/**
 * Gets all permissions for a role, including all inherited ones.
 */
export function getFlattenedPermissions(role: UserRole): Set<PermissionCode> {
  const permissions = new Set<PermissionCode>(BASE_ROLE_PERMISSIONS[role] || []);
  const parents = ROLE_HIERARCHY[role] || [];

  for (const parent of parents) {
    const parentPerms = getFlattenedPermissions(parent);
    parentPerms.forEach((p) => permissions.add(p));
  }

  return permissions;
}

/**
 * Core check function.
 */
export function hasPermission(role: UserRole, permission: PermissionCode): boolean {
  if (role === 'super_admin') return true; // Safety override

  const flattened = getFlattenedPermissions(role);
  if (flattened.has('*')) return true;
  return flattened.has(permission);
}

/**
 * Check if a role is at or above a certain "clearance level".
 * e.g., isAdmin(role) -> includes admin and super_admin via inheritance.
 */
export function isAtLeast(currentRole: UserRole, requiredRole: UserRole): boolean {
  if (currentRole === requiredRole) return true;
  const parents = ROLE_HIERARCHY[currentRole] || [];
  return parents.some((parent) => isAtLeast(parent, requiredRole));
}
