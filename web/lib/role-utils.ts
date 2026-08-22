/**
 * Role Utilities
 * Consistent role configuration, colors, and labels across the application
 *
 * Role Hierarchy (highest to lowest):
 * - super_admin: Developer/Technical - Full system access, database, deployments
 * - owner: Business owner - Financial oversight, high-level reports
 * - admin: Operations manager - User management, soft deletes
 * - staff: Office staff - Data entry, payments, refunds, parent linking
 * - teacher: Classroom teacher - Own classes, grade entry
 * - tutor: Private tutor - Tutoring sessions, grade entry for assigned students
 * - parent: Guardian - View linked children's data
 * - student: Learner - View own data only
 */

export type UserRole =
  | 'super_admin'
  | 'owner'
  | 'admin'
  | 'teacher'
  | 'tutor'
  | 'parent'
  | 'student';

export interface RoleConfig {
  label: string;
  labelEn: string;
  description: string;
  color: string;
  bgClass: string;
  bgClassDark: string;
  textClass: string;
  borderClass: string;
  icon: string;
  /** Whether this role can log in via phone number */
  phoneAuthAllowed: boolean;
  /** Whether this role requires email for login */
  emailRequired: boolean;
  /** How this role is provisioned */
  provisionMethod: 'seed' | 'invite' | 'public_signup' | 'bulk_import';
}

/**
 * Centralized role configuration
 * Use these for consistent styling and labeling throughout the app
 */
export const ROLE_CONFIG: Record<UserRole, RoleConfig> = {
  super_admin: {
    label: 'Quản trị Hệ thống',
    labelEn: 'Super Administrator',
    description: 'Toàn quyền cấu hình, bảo mật và quản trị kỹ thuật hệ thống',
    color: 'black',
    bgClass: 'bg-gray-900 text-white',
    bgClassDark: 'dark:bg-gray-100 dark:text-gray-900',
    textClass: 'text-gray-900 dark:text-gray-100',
    borderClass: 'border-gray-900 dark:border-gray-100',
    icon: '⚙️',
    phoneAuthAllowed: false,
    emailRequired: true,
    provisionMethod: 'seed',
  },
  owner: {
    label: 'Chủ sở hữu',
    labelEn: 'Owner',
    description: 'Giám sát kinh doanh và tài chính',
    color: 'amber',
    bgClass: 'bg-amber-100 text-amber-900',
    bgClassDark: 'dark:bg-amber-900/30 dark:text-amber-300',
    textClass: 'text-amber-700 dark:text-amber-400',
    borderClass: 'border-amber-300 dark:border-amber-700',
    icon: '👔',
    phoneAuthAllowed: false,
    emailRequired: true,
    provisionMethod: 'invite',
  },
  admin: {
    label: 'Quản trị viên',
    labelEn: 'Administrator',
    description: 'Quản lý vận hành trung tâm',
    color: 'red',
    bgClass: 'bg-red-100 text-red-800',
    bgClassDark: 'dark:bg-red-900/30 dark:text-red-300',
    textClass: 'text-red-600 dark:text-red-400',
    borderClass: 'border-red-200 dark:border-red-800',
    icon: '👑',
    phoneAuthAllowed: false,
    emailRequired: true,
    provisionMethod: 'invite',
  },

  teacher: {
    label: 'Giáo viên',
    labelEn: 'Teacher',
    description: 'Giảng dạy và quản lý lớp học',
    color: 'blue',
    bgClass: 'bg-blue-100 text-blue-800',
    bgClassDark: 'dark:bg-blue-900/30 dark:text-blue-300',
    textClass: 'text-blue-600 dark:text-blue-400',
    borderClass: 'border-blue-200 dark:border-blue-800',
    icon: '👨‍🏫',
    phoneAuthAllowed: true, // Optional phone auth
    emailRequired: false,
    provisionMethod: 'invite',
  },
  tutor: {
    label: 'Gia sư',
    labelEn: 'Tutor',
    description: 'Dạy học kèm 1-1 hoặc nhóm nhỏ',
    color: 'teal',
    bgClass: 'bg-teal-100 text-teal-800',
    bgClassDark: 'dark:bg-teal-900/30 dark:text-teal-300',
    textClass: 'text-teal-600 dark:text-teal-400',
    borderClass: 'border-teal-200 dark:border-teal-800',
    icon: '📚',
    phoneAuthAllowed: true, // Optional phone auth
    emailRequired: false,
    provisionMethod: 'invite',
  },
  parent: {
    label: 'Phụ huynh',
    labelEn: 'Parent/Guardian',
    description: 'Theo dõi học tập của con',
    color: 'orange',
    bgClass: 'bg-orange-100 text-orange-800',
    bgClassDark: 'dark:bg-orange-900/30 dark:text-orange-300',
    textClass: 'text-orange-600 dark:text-orange-400',
    borderClass: 'border-orange-200 dark:border-orange-800',
    icon: '👨‍👩‍👧',
    phoneAuthAllowed: true, // Primary auth method
    emailRequired: false,
    provisionMethod: 'public_signup',
  },
  student: {
    label: 'Học sinh',
    labelEn: 'Student',
    description: 'Tham gia học tập',
    color: 'green',
    bgClass: 'bg-green-100 text-green-800',
    bgClassDark: 'dark:bg-green-900/30 dark:text-green-300',
    textClass: 'text-green-600 dark:text-green-400',
    borderClass: 'border-green-200 dark:border-green-800',
    icon: '🎓',
    phoneAuthAllowed: true, // Primary auth method
    emailRequired: false,
    provisionMethod: 'bulk_import',
  },
};

/**
 * Get role configuration, with fallback for unknown roles
 */
export function getRoleConfig(role: string | null | undefined): RoleConfig {
  if (role && role in ROLE_CONFIG) {
    return ROLE_CONFIG[role as UserRole];
  }
  // Default fallback
  return {
    label: 'Người dùng',
    labelEn: 'User',
    description: 'Người dùng hệ thống',
    color: 'gray',
    bgClass: 'bg-gray-100 text-gray-800',
    bgClassDark: 'dark:bg-gray-900/30 dark:text-gray-300',
    textClass: 'text-gray-600 dark:text-gray-400',
    borderClass: 'border-gray-200 dark:border-gray-800',
    icon: '👤',
    phoneAuthAllowed: false,
    emailRequired: true,
    provisionMethod: 'invite',
  };
}

/**
 * Get role label in Vietnamese
 */
export function getRoleLabel(role: string | null | undefined): string {
  return getRoleConfig(role).label;
}

/**
 * Get role badge CSS classes (combines bg and dark mode)
 */
export function getRoleBadgeClass(role: string | null | undefined): string {
  const config = getRoleConfig(role);
  return `${config.bgClass} ${config.bgClassDark}`;
}

/**
 * Get all valid roles as array
 */
export function getAllRoles(): UserRole[] {
  return ['super_admin', 'owner', 'admin', 'teacher', 'tutor', 'parent', 'student'];
}

/**
 * Get roles that can be assigned via invite system
 */
export function getInvitableRoles(): UserRole[] {
  return ['owner', 'admin', 'teacher', 'tutor'];
}

/**
 * Get roles that can self-register
 */
export function getPublicSignupRoles(): UserRole[] {
  return ['parent'];
}

/**
 * Check if a role is valid
 */
export function isValidRole(role: string | null | undefined): role is UserRole {
  return typeof role === 'string' && role in ROLE_CONFIG;
}

/**
 * Role hierarchy for permission checks
 * Higher number = more privileges
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  super_admin: 1000,
  owner: 900,
  admin: 800,
  teacher: 400,
  tutor: 350,
  parent: 200,
  student: 100,
};

/**
 * Check if one role has higher or equal privileges than another
 */
export function hasHigherOrEqualRole(actorRole: UserRole, targetRole: UserRole): boolean {
  return ROLE_HIERARCHY[actorRole] >= ROLE_HIERARCHY[targetRole];
}

/**
 * Define which roles can create/manage other roles
 */
export const ROLE_MANAGEMENT_MATRIX: Record<UserRole, UserRole[]> = {
  super_admin: ['owner', 'admin', 'teacher', 'tutor', 'parent', 'student'],
  owner: ['admin', 'teacher', 'tutor', 'parent', 'student'],
  admin: ['teacher', 'tutor', 'parent', 'student'],
  teacher: [],
  tutor: [],
  parent: [],
  student: [],
};

/**
 * Check if actor can modify target's role
 */
export function canModifyUserRole(
  actorRole: string,
  targetRole: string,
  newRole?: string
): boolean {
  if (!isValidRole(actorRole)) return false;
  if (!isValidRole(targetRole)) return false;

  // Super admin can modify anyone except themselves
  if (actorRole === 'super_admin') {
    return targetRole !== 'super_admin';
  }

  // Check management matrix
  const allowedTargets = ROLE_MANAGEMENT_MATRIX[actorRole];
  if (!allowedTargets.includes(targetRole as UserRole)) {
    return false;
  }

  // If changing role, check if new role is also allowed
  if (newRole && isValidRole(newRole)) {
    return allowedTargets.includes(newRole as UserRole);
  }

  return true;
}

/**
 * Check if a role can delete users (hard delete)
 */
export function canHardDeleteUser(role: string): boolean {
  return role === 'super_admin';
}

/**
 * Check if a role can soft-delete/deactivate users
 */
export function canDeactivateUser(actorRole: string, targetRole: string): boolean {
  if (!isValidRole(actorRole) || !isValidRole(targetRole)) return false;

  // Super admin can deactivate anyone
  if (actorRole === 'super_admin') return true;

  // Owner can deactivate admin and below
  if (actorRole === 'owner') {
    const targetLevel = ROLE_HIERARCHY[targetRole as UserRole];
    return targetLevel < ROLE_HIERARCHY.owner;
  }

  // Admin can deactivate staff and below
  if (actorRole === 'admin') {
    const targetLevel = ROLE_HIERARCHY[targetRole as UserRole];
    return targetLevel < ROLE_HIERARCHY.admin;
  }

  return false;
}

/**
 * Check if role can impersonate other users
 */
export function canImpersonateUser(role: string): boolean {
  return role === 'super_admin';
}

/**
 * Check if role can access system configuration
 */
export function canAccessSystemConfig(role: string): boolean {
  return role === 'super_admin';
}

/**
 * Check if role can view all financial data
 */
export function canViewAllFinance(role: string): boolean {
  return role === 'super_admin' || role === 'owner' || role === 'admin';
}

/**
 * Check if role can process refunds
 */
export function canProcessRefund(role: string): boolean {
  return role === 'super_admin' || role === 'owner' || role === 'admin';
}

/**
 * Account status types
 */
export type AccountStatus = 'pending' | 'active' | 'suspended' | 'deactivated' | 'deleted';

/**
 * Get roles that require staff approval after signup
 */
export function requiresApprovalAfterSignup(role: string): boolean {
  return role === 'parent'; // Parents need approval to link with students
}
