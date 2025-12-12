/**
 * Granular Permission System
 * Defines permissions beyond simple role-based access
 * 
 * Role Hierarchy:
 * - admin: Super admin (full system access)
 * - staff: Sub-admin/Office staff (operations, no system config)
 * - teacher: Teaching functions (own classes only)
 * - student: Self-service (own data only)
 */

export type Action = 'read' | 'write' | 'delete' | 'manage'
export type Resource = 
  | 'classes'
  | 'students'
  | 'grades'
  | 'assignments'
  | 'attendance'
  | 'categories'
  | 'enrollments'
  | 'users'
  | 'finance'
  | 'reports'
  | 'settings'
  | 'import'
  | 'system' // System configuration (admin only)
  | '*' // Wildcard for all resources

export interface Permission {
  resource: Resource
  action: Action
  conditions?: {
    ownOnly?: boolean // Can only access their own resources
    classOnly?: boolean // Limited to their own classes
  }
}

/**
 * Role-based permission definitions
 */
export const rolePermissions: Record<string, Permission[]> = {
  admin: [
    // Admins have full access to everything
    { resource: '*', action: 'read' },
    { resource: '*', action: 'write' },
    { resource: '*', action: 'delete' },
    { resource: '*', action: 'manage' }
  ],
  
  staff: [
    // Staff have operational access but NO system configuration
    
    // Users - can manage teachers and students, not admins/staff
    { resource: 'users', action: 'read' },
    { resource: 'users', action: 'write' }, // Limited in UI to teachers/students
    // NO delete for users
    
    // Students - full operational access
    { resource: 'students', action: 'read' },
    { resource: 'students', action: 'write' },
    // NO delete for students (soft delete via admin only)
    
    // Classes - full operational access  
    { resource: 'classes', action: 'read' },
    { resource: 'classes', action: 'write' },
    // NO delete for classes
    
    // Enrollments - full access
    { resource: 'enrollments', action: 'read' },
    { resource: 'enrollments', action: 'write' },
    { resource: 'enrollments', action: 'delete' },
    
    // Grades - read only (oversight)
    { resource: 'grades', action: 'read' },
    // NO write/delete for grades
    
    // Assignments - read only
    { resource: 'assignments', action: 'read' },
    { resource: 'categories', action: 'read' },
    
    // Attendance - full operational access
    { resource: 'attendance', action: 'read' },
    { resource: 'attendance', action: 'write' },
    // NO delete for attendance
    
    // Finance - operational access
    { resource: 'finance', action: 'read' },
    { resource: 'finance', action: 'write' },
    // NO delete for finance
    
    // Reports - full read access
    { resource: 'reports', action: 'read' },
    
    // Import - can import data
    { resource: 'import', action: 'read' },
    { resource: 'import', action: 'write' },
    
    // NO settings access
    // NO system access
  ],
  
  teacher: [
    // Classes - can manage their own
    { resource: 'classes', action: 'read' },
    { resource: 'classes', action: 'write', conditions: { classOnly: true } },
    
    // Students - can view all, edit within their classes
    { resource: 'students', action: 'read' },
    { resource: 'students', action: 'write', conditions: { classOnly: true } },
    
    // Grades - full control within their classes
    { resource: 'grades', action: 'read', conditions: { classOnly: true } },
    { resource: 'grades', action: 'write', conditions: { classOnly: true } },
    { resource: 'grades', action: 'delete', conditions: { classOnly: true } },
    
    // Assignments - full control within their classes
    { resource: 'assignments', action: 'read', conditions: { classOnly: true } },
    { resource: 'assignments', action: 'write', conditions: { classOnly: true } },
    { resource: 'assignments', action: 'delete', conditions: { classOnly: true } },
    
    // Assignment Categories - full control within their classes
    { resource: 'categories', action: 'read', conditions: { classOnly: true } },
    { resource: 'categories', action: 'write', conditions: { classOnly: true } },
    { resource: 'categories', action: 'delete', conditions: { classOnly: true } },
    
    // Attendance - full control within their classes
    { resource: 'attendance', action: 'read', conditions: { classOnly: true } },
    { resource: 'attendance', action: 'write', conditions: { classOnly: true } },
    { resource: 'attendance', action: 'delete', conditions: { classOnly: true } },
    
    // Enrollments - can view and manage for their classes
    { resource: 'enrollments', action: 'read', conditions: { classOnly: true } },
    { resource: 'enrollments', action: 'write', conditions: { classOnly: true } },
    
    // Reports - can generate for their classes
    { resource: 'reports', action: 'read', conditions: { classOnly: true } }
  ],
  
  student: [
    // Classes - can only view enrolled classes
    { resource: 'classes', action: 'read', conditions: { classOnly: true } },
    
    // Grades - can only view their own
    { resource: 'grades', action: 'read', conditions: { ownOnly: true } },
    
    // Assignments - can view for their classes
    { resource: 'assignments', action: 'read', conditions: { classOnly: true } },
    
    // Attendance - can only view their own
    { resource: 'attendance', action: 'read', conditions: { ownOnly: true } },
    
    // Reports - can view their own progress
    { resource: 'reports', action: 'read', conditions: { ownOnly: true } }
  ]
}

/**
 * Check if a role has permission for a resource and action
 */
export function hasPermission(
  role: string,
  resource: Resource,
  action: Action
): boolean {
  const permissions = rolePermissions[role] || []
  
  return permissions.some(permission => {
    // Check for wildcard resource
    if (permission.resource === '*') {
      return true
    }
    
    // Check for exact match
    if (permission.resource === resource && permission.action === action) {
      return true
    }
    
    // Check if 'manage' action covers all actions
    if (permission.resource === resource && permission.action === 'manage') {
      return true
    }
    
    return false
  })
}

/**
 * Get permission conditions for a role, resource, and action
 */
export function getPermissionConditions(
  role: string,
  resource: Resource,
  action: Action
): Permission['conditions'] | null {
  const permissions = rolePermissions[role] || []
  
  const permission = permissions.find(p => {
    if (p.resource === '*') return true
    if (p.resource === resource && p.action === action) return true
    if (p.resource === resource && p.action === 'manage') return true
    return false
  })
  
  return permission?.conditions || null
}

/**
 * Check if user has permission with conditions met
 */
export function checkPermissionWithConditions(
  role: string,
  resource: Resource,
  action: Action,
  context?: {
    userId?: string
    resourceOwnerId?: string
    userClassIds?: string[]
    resourceClassId?: string
  }
): boolean {
  // First check if they have the base permission
  if (!hasPermission(role, resource, action)) {
    return false
  }
  
  // If no context or conditions, permission is granted
  const conditions = getPermissionConditions(role, resource, action)
  if (!conditions || !context) {
    return true
  }
  
  // Check ownOnly condition
  if (conditions.ownOnly) {
    if (!context.userId || !context.resourceOwnerId) {
      return false
    }
    if (context.userId !== context.resourceOwnerId) {
      return false
    }
  }
  
  // Check classOnly condition
  if (conditions.classOnly) {
    if (!context.userClassIds || !context.resourceClassId) {
      return false
    }
    if (!context.userClassIds.includes(context.resourceClassId)) {
      return false
    }
  }
  
  return true
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: string): Permission[] {
  return rolePermissions[role] || []
}

/**
 * Check if role has any admin-level permissions (wildcard resource)
 */
export function isAdminRole(role: string): boolean {
  const permissions = rolePermissions[role] || []
  return permissions.some(p => p.resource === '*')
}

/**
 * Check if role has admin-level access (admin or staff)
 * Use this when checking if a user can access admin features
 */
export function hasAdminAccess(role: string): boolean {
  return role === 'admin' || role === 'staff'
}

/**
 * Check if role is super admin (full system access)
 * Use this for system configuration and critical operations
 */
export function isSuperAdmin(role: string): boolean {
  return role === 'admin'
}

/**
 * Check if role can modify students/teachers/classes
 * Admin and Staff can, but not teachers or students
 */
export function canManageUsers(role: string): boolean {
  return role === 'admin' || role === 'staff'
}

/**
 * Check if role can access financial features
 */
export function canAccessFinance(role: string): boolean {
  return role === 'admin' || role === 'staff'
}

/**
 * Check if role can access system configuration
 * Only admin (super admin) can
 */
export function canConfigureSystem(role: string): boolean {
  return role === 'admin'
}

/**
 * Get readable permission description
 */
export function describePermission(permission: Permission): string {
  let description = `Can ${permission.action} ${permission.resource}`
  
  if (permission.conditions?.ownOnly) {
    description += ' (own only)'
  }
  
  if (permission.conditions?.classOnly) {
    description += ' (within their classes)'
  }
  
  return description
}
