/**
 * Granular Permission System
 * Defines permissions beyond simple role-based access
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
 * Check if role has any admin-level permissions
 */
export function isAdminRole(role: string): boolean {
  const permissions = rolePermissions[role] || []
  return permissions.some(p => p.resource === '*')
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
