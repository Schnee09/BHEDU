/**
 * Centralized Permission Configuration
 * Defines all permissions, routes, and navigation items
 */

import type { LucideIcon } from 'lucide-react';

// ============================================
// PERMISSION TYPES
// ============================================

export type PermissionCode = 
  // System
  | 'system.settings'
  | 'system.audit'
  // Users
  | 'users.view'
  | 'users.create'
  | 'users.edit'
  | 'users.delete'
  | 'users.permissions'
  // Students
  | 'students.view'
  | 'students.create'
  | 'students.edit'
  | 'students.delete'
  // Classes
  | 'classes.view'
  | 'classes.create'
  | 'classes.edit'
  | 'classes.delete'
  | 'classes.enroll'
  // Grades
  | 'grades.view'
  | 'grades.entry'
  | 'grades.delete'
  | 'grades.analytics'
  // Attendance
  | 'attendance.view'
  | 'attendance.mark'
  | 'attendance.reports'
  // Finance
  | 'finance.view'
  | 'finance.invoices'
  | 'finance.payments'
  // Reports
  | 'reports.view'
  | 'reports.export';

export type UserRole = 'admin' | 'staff' | 'teacher' | 'student';

export interface Permission {
  code: PermissionCode;
  name: string;
  description: string;
  resource: string;
  action: 'read' | 'write' | 'delete' | 'manage';
  category: string;
}

// ============================================
// PERMISSION DEFINITIONS (mirror of DB)
// ============================================

export const PERMISSIONS: Record<PermissionCode, Permission> = {
  // System
  'system.settings': { code: 'system.settings', name: 'Cài đặt hệ thống', description: 'Quản lý cài đặt chung', resource: 'system', action: 'manage', category: 'system' },
  'system.audit': { code: 'system.audit', name: 'Xem audit log', description: 'Xem lịch sử hoạt động', resource: 'system', action: 'read', category: 'system' },
  
  // Users
  'users.view': { code: 'users.view', name: 'Xem người dùng', description: 'Xem danh sách người dùng', resource: 'users', action: 'read', category: 'users' },
  'users.create': { code: 'users.create', name: 'Tạo người dùng', description: 'Thêm người dùng mới', resource: 'users', action: 'write', category: 'users' },
  'users.edit': { code: 'users.edit', name: 'Sửa người dùng', description: 'Chỉnh sửa thông tin', resource: 'users', action: 'write', category: 'users' },
  'users.delete': { code: 'users.delete', name: 'Xóa người dùng', description: 'Xóa người dùng', resource: 'users', action: 'delete', category: 'users' },
  'users.permissions': { code: 'users.permissions', name: 'Quản lý quyền', description: 'Cấp/thu hồi quyền', resource: 'users', action: 'manage', category: 'users' },
  
  // Students
  'students.view': { code: 'students.view', name: 'Xem học sinh', description: 'Xem danh sách học sinh', resource: 'students', action: 'read', category: 'students' },
  'students.create': { code: 'students.create', name: 'Thêm học sinh', description: 'Đăng ký học sinh mới', resource: 'students', action: 'write', category: 'students' },
  'students.edit': { code: 'students.edit', name: 'Sửa học sinh', description: 'Chỉnh sửa thông tin', resource: 'students', action: 'write', category: 'students' },
  'students.delete': { code: 'students.delete', name: 'Xóa học sinh', description: 'Xóa hồ sơ học sinh', resource: 'students', action: 'delete', category: 'students' },
  
  // Classes
  'classes.view': { code: 'classes.view', name: 'Xem lớp học', description: 'Xem danh sách lớp', resource: 'classes', action: 'read', category: 'classes' },
  'classes.create': { code: 'classes.create', name: 'Tạo lớp học', description: 'Tạo lớp mới', resource: 'classes', action: 'write', category: 'classes' },
  'classes.edit': { code: 'classes.edit', name: 'Sửa lớp học', description: 'Chỉnh sửa lớp', resource: 'classes', action: 'write', category: 'classes' },
  'classes.delete': { code: 'classes.delete', name: 'Xóa lớp học', description: 'Xóa lớp', resource: 'classes', action: 'delete', category: 'classes' },
  'classes.enroll': { code: 'classes.enroll', name: 'Đăng ký lớp', description: 'Thêm/xóa học sinh', resource: 'enrollments', action: 'manage', category: 'classes' },
  
  // Grades
  'grades.view': { code: 'grades.view', name: 'Xem điểm', description: 'Xem điểm số', resource: 'grades', action: 'read', category: 'grades' },
  'grades.entry': { code: 'grades.entry', name: 'Nhập điểm', description: 'Nhập và sửa điểm', resource: 'grades', action: 'write', category: 'grades' },
  'grades.delete': { code: 'grades.delete', name: 'Xóa điểm', description: 'Xóa điểm đã nhập', resource: 'grades', action: 'delete', category: 'grades' },
  'grades.analytics': { code: 'grades.analytics', name: 'Phân tích điểm', description: 'Xem báo cáo điểm', resource: 'grades', action: 'read', category: 'grades' },
  
  // Attendance
  'attendance.view': { code: 'attendance.view', name: 'Xem điểm danh', description: 'Xem lịch sử điểm danh', resource: 'attendance', action: 'read', category: 'attendance' },
  'attendance.mark': { code: 'attendance.mark', name: 'Điểm danh', description: 'Thực hiện điểm danh', resource: 'attendance', action: 'write', category: 'attendance' },
  'attendance.reports': { code: 'attendance.reports', name: 'Báo cáo điểm danh', description: 'Xem báo cáo', resource: 'attendance', action: 'read', category: 'attendance' },
  
  // Finance
  'finance.view': { code: 'finance.view', name: 'Xem tài chính', description: 'Xem thông tin học phí', resource: 'finance', action: 'read', category: 'finance' },
  'finance.invoices': { code: 'finance.invoices', name: 'Quản lý hóa đơn', description: 'Tạo và quản lý hóa đơn', resource: 'finance', action: 'manage', category: 'finance' },
  'finance.payments': { code: 'finance.payments', name: 'Quản lý thanh toán', description: 'Ghi nhận thanh toán', resource: 'finance', action: 'manage', category: 'finance' },
  
  // Reports
  'reports.view': { code: 'reports.view', name: 'Xem báo cáo', description: 'Xem báo cáo tổng hợp', resource: 'reports', action: 'read', category: 'reports' },
  'reports.export': { code: 'reports.export', name: 'Xuất báo cáo', description: 'Xuất dữ liệu', resource: 'reports', action: 'write', category: 'reports' },
};

// ============================================
// ROLE DEFAULT PERMISSIONS
// ============================================

export const ROLE_PERMISSIONS: Record<UserRole, PermissionCode[]> = {
  admin: Object.keys(PERMISSIONS) as PermissionCode[], // All permissions
  
  staff: [
    'users.view', 'users.create', 'users.edit',
    'students.view', 'students.create', 'students.edit',
    'classes.view', 'classes.create', 'classes.edit', 'classes.enroll',
    'grades.view', 'grades.analytics',
    'attendance.view', 'attendance.mark', 'attendance.reports',
    'finance.view', 'finance.invoices', 'finance.payments',
    'reports.view', 'reports.export',
  ],
  
  teacher: [
    'classes.view',
    'students.view',
    'grades.view', 'grades.entry', 'grades.analytics',
    'attendance.view', 'attendance.mark',
    'reports.view',
  ],
  
  student: [
    'classes.view',
    'grades.view',
    'attendance.view',
  ],
};

// ============================================
// ROUTE CONFIGURATION
// ============================================

export interface RouteConfig {
  path: string;
  requiredPermissions: PermissionCode[];
  requireAll?: boolean; // true = need ALL permissions, false = need ANY (default)
  publicAccess?: boolean; // accessible without login
}

export const ROUTE_CONFIG: RouteConfig[] = [
  // Public routes
  { path: '/', publicAccess: true, requiredPermissions: [] },
  { path: '/login', publicAccess: true, requiredPermissions: [] },
  { path: '/signup', publicAccess: true, requiredPermissions: [] },
  { path: '/forgot-password', publicAccess: true, requiredPermissions: [] },
  
  // Dashboard - all authenticated users
  { path: '/dashboard', requiredPermissions: [] },
  
  // Classes
  { path: '/dashboard/classes', requiredPermissions: ['classes.view'] },
  
  // Students
  { path: '/dashboard/students', requiredPermissions: ['students.view'] },
  { path: '/dashboard/admin/students', requiredPermissions: ['students.edit'] },
  
  // Grades
  { path: '/dashboard/grades', requiredPermissions: ['grades.view'] },
  { path: '/dashboard/grades/entry', requiredPermissions: ['grades.entry'] },
  { path: '/dashboard/grades/transcripts', requiredPermissions: ['grades.view'] },
  { path: '/dashboard/grades/analytics', requiredPermissions: ['grades.analytics'] },
  
  // Attendance
  { path: '/dashboard/attendance', requiredPermissions: ['attendance.view'] },
  { path: '/dashboard/attendance/mark', requiredPermissions: ['attendance.mark'] },
  { path: '/dashboard/attendance/history', requiredPermissions: ['attendance.view'] },
  { path: '/dashboard/attendance/reports', requiredPermissions: ['attendance.reports'] },
  
  // Users & Admin
  { path: '/dashboard/users', requiredPermissions: ['users.view'] },
  { path: '/dashboard/admin/data', requiredPermissions: ['reports.export'] },
  
  // Finance
  { path: '/dashboard/admin/finance', requiredPermissions: ['finance.view'] },
  { path: '/dashboard/admin/finance/invoices', requiredPermissions: ['finance.invoices'] },
  { path: '/dashboard/admin/finance/payments', requiredPermissions: ['finance.payments'] },
  
  // Settings - admin only
  { path: '/dashboard/settings', requiredPermissions: ['system.settings'] },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if a role has a default permission
 */
export function roleHasPermission(role: UserRole, permission: PermissionCode): boolean {
  if (role === 'admin') return true;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Get route config for a path (supports wildcards)
 */
export function getRouteConfig(path: string): RouteConfig | null {
  // Exact match first
  const exact = ROUTE_CONFIG.find(r => r.path === path);
  if (exact) return exact;
  
  // Prefix match (for nested routes)
  const prefix = ROUTE_CONFIG
    .filter(r => path.startsWith(r.path + '/'))
    .sort((a, b) => b.path.length - a.path.length)[0];
  
  return prefix || null;
}

/**
 * Check if user can access route based on their permissions
 */
export function canAccessRoute(
  userPermissions: Set<PermissionCode>,
  path: string
): boolean {
  const config = getRouteConfig(path);
  
  // No config = no protection (or handle as 404)
  if (!config) return true;
  
  // Public access
  if (config.publicAccess) return true;
  
  // No required permissions = just need to be authenticated
  if (config.requiredPermissions.length === 0) return true;
  
  // Check permissions
  if (config.requireAll) {
    return config.requiredPermissions.every(p => userPermissions.has(p));
  } else {
    return config.requiredPermissions.some(p => userPermissions.has(p));
  }
}

/**
 * Get all permissions for a role
 */
export function getRoleDefaultPermissions(role: UserRole): PermissionCode[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Group permissions by category
 */
export function getPermissionsByCategory(): Record<string, Permission[]> {
  const grouped: Record<string, Permission[]> = {};
  
  Object.values(PERMISSIONS).forEach(p => {
    if (!grouped[p.category]) {
      grouped[p.category] = [];
    }
    grouped[p.category].push(p);
  });
  
  return grouped;
}
