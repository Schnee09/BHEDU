/**
 * Navigation Configuration
 * Defines navigation items with permission requirements
 */

import {
  Home, BookOpen, Users, CheckCircle, BarChart2, 
  FileText, TrendingUp, Settings, CreditCard, 
  Download, GraduationCap, Shield, QrCode
} from "lucide-react";
import type { LucideIcon } from 'lucide-react';
import type { PermissionCode, UserRole } from './permissions.config';
import { routes } from '@/lib/routes';

// ============================================
// TYPES
// ============================================

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  permissions?: PermissionCode[]; // Required permissions (ANY)
  badge?: string;
}

export interface NavSection {
  title: string;
  links: NavLink[];
}

// ============================================
// NAVIGATION ITEMS
// ============================================

/**
 * All navigation items with their permission requirements
 * Items will be filtered based on user's actual permissions
 */
export const ALL_NAV_ITEMS: NavSection[] = [
  {
    title: "Tổng quan",
    links: [
      { href: "/dashboard", label: "Bảng điều khiển", icon: Home },
    ]
  },
  {
    title: "Học vụ",
    links: [
      { href: "/dashboard/classes", label: "Lớp học", icon: BookOpen, permissions: ['classes.view'] },
      { href: "/dashboard/students", label: "Học sinh", icon: Users, permissions: ['students.view'] },
    ]
  },
  {
    title: "Điểm danh",
    links: [
      { href: "/dashboard/attendance/mark", label: "Điểm danh", icon: CheckCircle, permissions: ['attendance.mark'] },
      { href: "/dashboard/attendance/history", label: "Lịch sử", icon: FileText, permissions: ['attendance.view'] },
      { href: "/dashboard/attendance/reports", label: "Báo cáo", icon: BarChart2, permissions: ['attendance.reports'] },
    ]
  },
  {
    title: "Điểm số",
    links: [
      { href: routes.grades.entry(), label: "Nhập điểm", icon: BarChart2, permissions: ['grades.entry'] },
      { href: routes.grades.conductEntry(), label: "Hạnh kiểm", icon: GraduationCap, permissions: ['grades.entry'] },
      { href: "/dashboard/grades/transcripts", label: "Bảng điểm", icon: FileText, permissions: ['grades.view'] },
      { href: routes.grades.analytics(), label: "Phân tích", icon: TrendingUp, permissions: ['grades.analytics'] },
    ]
  },
  {
    title: "Quản lý",
    links: [
      { href: "/dashboard/users", label: "Người dùng", icon: Shield, permissions: ['users.view'] },
      { href: "/dashboard/admin/permissions", label: "Phân quyền", icon: Shield, permissions: ['users.permissions'] },
      { href: "/dashboard/admin/students", label: "Hồ sơ học sinh", icon: Users, permissions: ['students.edit'] },
      { href: "/dashboard/admin/data", label: "Xuất dữ liệu", icon: Download, permissions: ['reports.export'] },
    ]
  },
  {
    title: "Tài chính",
    links: [
      { href: "/dashboard/admin/finance/invoices", label: "Hóa đơn", icon: FileText, permissions: ['finance.invoices'] },
      { href: "/dashboard/admin/finance/payments", label: "Thanh toán", icon: CreditCard, permissions: ['finance.payments'] },
    ]
  },
  {
    title: "Hệ thống",
    links: [
      { href: "/dashboard/settings", label: "Cài đặt", icon: Settings, permissions: ['system.settings'] },
    ]
  },
  {
    title: "Công cụ",
    links: [
      { href: "/checkin", label: "Check-in QR", icon: QrCode },
    ]
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Filter navigation items based on user's permissions
 */
export function getNavigationForPermissions(
  userPermissions: Set<PermissionCode>
): NavSection[] {
  return ALL_NAV_ITEMS
    .map(section => ({
      ...section,
      links: section.links.filter(link => {
        // No permission required = always visible
        if (!link.permissions || link.permissions.length === 0) {
          return true;
        }
        // Check if user has ANY of the required permissions
        return link.permissions.some(p => userPermissions.has(p));
      }),
    }))
    .filter(section => section.links.length > 0); // Remove empty sections
}

/**
 * Get navigation for a role (using default role permissions)
 * This is a simpler version that doesn't require fetching user's custom permissions
 */
export function getNavigationForRole(role: UserRole): NavSection[] {
  // Import here to avoid circular dependency
  const { ROLE_PERMISSIONS } = require('./permissions.config');
  const permissions = new Set<PermissionCode>(ROLE_PERMISSIONS[role] || []);
  return getNavigationForPermissions(permissions);
}

/**
 * Check if a link should be visible for given permissions
 */
export function isLinkVisible(
  link: NavLink,
  userPermissions: Set<PermissionCode>
): boolean {
  if (!link.permissions || link.permissions.length === 0) return true;
  return link.permissions.some(p => userPermissions.has(p));
}

// ============================================
// ROLE-SPECIFIC LABELS (for teacher/student)
// ============================================

export const ROLE_SPECIFIC_LABELS: Partial<Record<UserRole, Record<string, string>>> = {
  teacher: {
    '/dashboard/classes': 'Lớp học của tôi',
  },
  student: {
    '/dashboard/classes': 'Lớp học của tôi',
    '/dashboard/grades/analytics': 'Điểm số của tôi',
  },
};

/**
 * Get label for a nav item, with role-specific overrides
 */
export function getNavLabel(link: NavLink, role: UserRole): string {
  const override = ROLE_SPECIFIC_LABELS[role]?.[link.href];
  return override || link.label;
}
