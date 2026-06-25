/**
 * Navigation Configuration
 * Defines navigation items with permission requirements
 *
 * Architecture: Role-based presets (ROLE_NAV_PRESETS) provide curated
 * sidebar for each role. ALL_NAV_ITEMS is the master list used only
 * by super_admin. Permissions remain the final security gate.
 */

import {
  BarChart2,
  Bell,
  BookOpen,
  Building,
  Calendar,
  CalendarDays,
  CheckCircle,
  Clock,
  Download,
  FileText,
  GraduationCap,
  Home,
  Settings,
  Shield,
  TrendingUp,
  User,
  UserPlus,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getFlattenedPermissions, PermissionCode, UserRole } from './core';
import { routes } from '@/lib/routes';

// ============================================
// TYPES
// ============================================

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  permissions?: PermissionCode[]; // Required permissions (ANY)
  allowedRoles?: UserRole[]; // Optional role restriction (only for ALL_NAV_ITEMS)
  badge?: string;
}

export interface NavGroup {
  label: string;
  icon: LucideIcon;
  links: NavLink[];
  permissions?: PermissionCode[]; // Group-level permissions
  allowedRoles?: UserRole[]; // Group-level role restriction
}

export interface NavSection {
  title: string;
  links?: NavLink[];
  groups?: NavGroup[]; // Collapsible groups
}

// ============================================
// MASTER LIST — Used by super_admin only
// ============================================

export const ALL_NAV_ITEMS: NavSection[] = [
  {
    title: 'Trang chủ',
    links: [
      { href: '/dashboard', label: 'Bảng điều khiển', icon: Home },
      { href: '/dashboard/notifications', label: 'Thông báo', icon: Bell },
    ],
  },
  {
    title: 'Học vụ',
    links: [
      {
        href: '/dashboard/classes',
        label: 'Lớp học',
        icon: BookOpen,
        permissions: ['classes.view'],
      },
      {
        href: '/dashboard/students',
        label: 'Học sinh',
        icon: Users,
        permissions: ['students.view'],
      },
      {
        href: '/dashboard/timetable',
        label: 'Thời khóa biểu',
        icon: Clock,
        permissions: ['timetable.view'],
      },
      {
        href: '/dashboard/admin/students/parent-links',
        label: 'Duyệt kết nối PH',
        icon: UserPlus,
        permissions: ['parent_links.view'],
      },
      {
        href: '/dashboard/teacher/classes',
        label: 'Lớp dạy của tôi',
        icon: BookOpen,
        allowedRoles: ['teacher'],
      },
      {
        href: '/dashboard/tutor/students',
        label: 'Học sinh kèm',
        icon: Users,
        allowedRoles: ['tutor'],
      },
      { href: '/dashboard/my-schedule', label: 'Lịch của tôi', icon: Clock },
      { href: '/dashboard/calendar', label: 'Lịch học tập', icon: CalendarDays },
    ],
  },
  {
    title: 'Phụ huynh',
    links: [
      {
        href: '/dashboard/parent',
        label: 'Học sinh của tôi',
        icon: Users,
        permissions: ['parent.view_students'],
      },
      {
        href: '/dashboard/parent/link-student',
        label: 'Kết nối học sinh',
        icon: UserPlus,
        permissions: ['parent.link_student'],
      },
    ],
  },
  {
    title: 'Điểm danh & Điểm số',
    groups: [
      {
        label: 'Điểm danh',
        icon: CheckCircle,
        permissions: ['attendance.view'],
        links: [
          {
            href: '/dashboard/attendance/mark',
            label: 'Điểm danh hôm nay',
            icon: CheckCircle,
            permissions: ['attendance.mark'],
          },
          {
            href: '/dashboard/attendance/history',
            label: 'Lịch sử điểm danh',
            icon: FileText,
            permissions: ['attendance.view'],
          },
          {
            href: '/dashboard/attendance/reports',
            label: 'Báo cáo điểm danh',
            icon: BarChart2,
            permissions: ['attendance.reports'],
          },
        ],
      },
      {
        label: 'Điểm số',
        icon: TrendingUp,
        permissions: ['grades.view'],
        links: [
          {
            href: routes.grades.entry(),
            label: 'Nhập điểm',
            icon: BarChart2,
            permissions: ['grades.entry'],
          },
          {
            href: '/dashboard/grades/transcripts',
            label: 'Bảng điểm',
            icon: FileText,
            permissions: ['grades.view'],
          },
          {
            href: routes.grades.analytics(),
            label: 'Phân tích học lực',
            icon: TrendingUp,
            permissions: ['grades.analytics'],
          },
        ],
      },
    ],
  },
  {
    title: 'Quản trị',
    groups: [
      {
        label: 'Người dùng',
        icon: Shield,
        permissions: ['users.view'],
        links: [
          {
            href: '/dashboard/users',
            label: 'Quản lý tài khoản',
            icon: Users,
            permissions: ['users.view'],
          },
          {
            href: '/dashboard/tutors',
            label: 'Gia sư',
            icon: GraduationCap,
            permissions: ['users.view'],
          },
          {
            href: '/dashboard/admin/permissions',
            label: 'Phân quyền',
            icon: Shield,
            permissions: ['permissions.manage'],
          },
        ],
      },
      {
        label: 'Hệ thống',
        icon: Building,
        permissions: ['classes.view'],
        links: [
          {
            href: '/dashboard/admin/announcements',
            label: 'Bảng tin',
            icon: Bell,
            permissions: ['users.view'],
          },
          {
            href: '/dashboard/admin/semesters',
            label: 'Học kỳ',
            icon: Calendar,
            permissions: ['classes.view'],
          },
          {
            href: '/dashboard/admin/subjects',
            label: 'Môn học',
            icon: BookOpen,
            permissions: ['classes.view'],
          },
          {
            href: '/dashboard/admin/enrollments',
            label: 'Ghi danh',
            icon: Users,
            permissions: ['enrollments.view'],
          },
          {
            href: '/dashboard/admin/invitations',
            label: 'Lời mời hệ thống',
            icon: CheckCircle,
            permissions: ['users.view'],
          },
          {
            href: '/dashboard/admin/data',
            label: 'Quản trị dữ liệu tập trung',
            icon: Download,
            permissions: ['reports.export'],
          },
          {
            href: '/dashboard/admin/health',
            label: 'Sức khỏe hệ thống',
            icon: BarChart2,
            permissions: ['system.settings'],
          },
        ],
      },
    ],
  },
  {
    title: 'Cài đặt',
    links: [
      { href: '/dashboard/profile', label: 'Hồ sơ cá nhân', icon: User },
      {
        href: '/dashboard/settings',
        label: 'Cài đặt hệ thống',
        icon: Settings,
        permissions: ['system.settings'],
      },
    ],
  },
];

// ============================================
// ROLE-BASED NAVIGATION PRESETS
// ============================================

/**
 * Curated sidebar for each role, designed around their actual workflow.
 * super_admin falls back to ALL_NAV_ITEMS (sees everything).
 *
 * Each preset uses section titles that match the role's mental model:
 * - Admin/Owner: operational language ("Quản trị", "Vận hành")
 * - Teacher: action language ("Công việc hàng ngày", "Xem lại")
 * - Student: personal language ("Học tập", "Kết quả")
 * - Parent: family language ("Con của tôi")
 */
const ROLE_NAV_PRESETS: Partial<Record<UserRole, NavSection[]>> = {
  // ── OWNER: Strategic oversight ──
  owner: [
    {
      title: 'Tổng quan',
      links: [
        { href: '/dashboard', label: 'Bảng điều khiển', icon: Home },
        { href: '/dashboard/notifications', label: 'Thông báo', icon: Bell },
      ],
    },
    {
      title: 'Vận hành',
      links: [
        {
          href: '/dashboard/classes',
          label: 'Lớp học',
          icon: BookOpen,
          permissions: ['classes.view'],
        },
        {
          href: '/dashboard/students',
          label: 'Học sinh',
          icon: Users,
          permissions: ['students.view'],
        },
        {
          href: '/dashboard/admin/enrollments',
          label: 'Ghi danh',
          icon: Users,
          permissions: ['enrollments.view'],
        },
        {
          href: '/dashboard/timetable',
          label: 'Thời khóa biểu',
          icon: Clock,
          permissions: ['timetable.view'],
        },
      ],
    },
    {
      title: 'Báo cáo & Phân tích',
      groups: [
        {
          label: 'Điểm danh',
          icon: CheckCircle,
          permissions: ['attendance.view'],
          links: [
            {
              href: '/dashboard/attendance/history',
              label: 'Lịch sử điểm danh',
              icon: FileText,
              permissions: ['attendance.view'],
            },
            {
              href: '/dashboard/attendance/reports',
              label: 'Báo cáo',
              icon: BarChart2,
              permissions: ['attendance.reports'],
            },
          ],
        },
        {
          label: 'Học lực',
          icon: TrendingUp,
          permissions: ['grades.view'],
          links: [
            {
              href: '/dashboard/grades/transcripts',
              label: 'Bảng điểm',
              icon: FileText,
              permissions: ['grades.view'],
            },
            {
              href: routes.grades.analytics(),
              label: 'Phân tích',
              icon: TrendingUp,
              permissions: ['grades.analytics'],
            },
          ],
        },
      ],
    },
    {
      title: 'Quản trị',
      groups: [
        {
          label: 'Người dùng',
          icon: Shield,
          permissions: ['users.view'],
          links: [
            {
              href: '/dashboard/users',
              label: 'Quản lý tài khoản',
              icon: Users,
              permissions: ['users.view'],
            },
            {
              href: '/dashboard/tutors',
              label: 'Gia sư',
              icon: GraduationCap,
              permissions: ['users.view'],
            },
            {
              href: '/dashboard/admin/permissions',
              label: 'Phân quyền',
              icon: Shield,
              permissions: ['permissions.manage'],
            },
            {
              href: '/dashboard/admin/students/parent-links',
              label: 'Duyệt kết nối PH',
              icon: UserPlus,
              permissions: ['parent_links.view'],
            },
          ],
        },
        {
          label: 'Hệ thống',
          icon: Building,
          permissions: ['classes.view'],
          links: [
            {
              href: '/dashboard/admin/announcements',
              label: 'Bảng tin',
              icon: Bell,
              permissions: ['users.view'],
            },
            {
              href: '/dashboard/admin/semesters',
              label: 'Học kỳ',
              icon: Calendar,
              permissions: ['classes.view'],
            },
            {
              href: '/dashboard/admin/subjects',
              label: 'Môn học',
              icon: BookOpen,
              permissions: ['classes.view'],
            },
            {
              href: '/dashboard/admin/invitations',
              label: 'Lời mời',
              icon: CheckCircle,
              permissions: ['users.view'],
            },
            {
              href: '/dashboard/admin/data',
              label: 'Dữ liệu tập trung',
              icon: Download,
              permissions: ['reports.export'],
            },
          ],
        },
      ],
    },
    {
      title: 'Cài đặt',
      links: [{ href: '/dashboard/profile', label: 'Hồ sơ cá nhân', icon: User }],
    },
  ],

  // ── ADMIN: Daily operations ──
  admin: [
    {
      title: 'Trang chủ',
      links: [
        { href: '/dashboard', label: 'Bảng điều khiển', icon: Home },
        { href: '/dashboard/notifications', label: 'Thông báo', icon: Bell },
      ],
    },
    {
      title: 'Học vụ',
      links: [
        {
          href: '/dashboard/classes',
          label: 'Quản trị lớp học',
          icon: BookOpen,
          permissions: ['classes.view'],
        },
        {
          href: '/dashboard/students',
          label: 'Quản trị học sinh',
          icon: Users,
          permissions: ['students.view'],
        },
        {
          href: '/dashboard/admin/enrollments',
          label: 'Ghi danh',
          icon: Users,
          permissions: ['enrollments.view'],
        },
        {
          href: '/dashboard/timetable',
          label: 'Quản lý lịch học tập',
          icon: Clock,
          permissions: ['timetable.view'],
        },
        {
          href: '/dashboard/admin/students/parent-links',
          label: 'Duyệt kết nối PH',
          icon: UserPlus,
          permissions: ['parent_links.view'],
        },
        { href: '/dashboard/calendar', label: 'Lịch học tập', icon: CalendarDays },
      ],
    },
    {
      title: 'Điểm danh & Điểm số',
      groups: [
        {
          label: 'Điểm danh',
          icon: CheckCircle,
          permissions: ['attendance.view'],
          links: [
            {
              href: '/dashboard/attendance/mark',
              label: 'Điểm danh hôm nay',
              icon: CheckCircle,
              permissions: ['attendance.mark'],
            },
            {
              href: '/dashboard/attendance/history',
              label: 'Lịch sử',
              icon: FileText,
              permissions: ['attendance.view'],
            },
            {
              href: '/dashboard/attendance/reports',
              label: 'Báo cáo',
              icon: BarChart2,
              permissions: ['attendance.reports'],
            },
          ],
        },
        {
          label: 'Điểm số',
          icon: TrendingUp,
          permissions: ['grades.view'],
          links: [
            {
              href: routes.grades.entry(),
              label: 'Nhập điểm',
              icon: BarChart2,
              permissions: ['grades.entry'],
            },
            {
              href: '/dashboard/grades/transcripts',
              label: 'Bảng điểm',
              icon: FileText,
              permissions: ['grades.view'],
            },
            {
              href: routes.grades.analytics(),
              label: 'Phân tích học lực',
              icon: TrendingUp,
              permissions: ['grades.analytics'],
            },
          ],
        },
      ],
    },
    {
      title: 'Quản trị',
      groups: [
        {
          label: 'Người dùng',
          icon: Shield,
          permissions: ['users.view'],
          links: [
            {
              href: '/dashboard/users',
              label: 'Quản lý tài khoản',
              icon: Users,
              permissions: ['users.view'],
            },
            {
              href: '/dashboard/tutors',
              label: 'Gia sư',
              icon: GraduationCap,
              permissions: ['users.view'],
            },
            {
              href: '/dashboard/admin/permissions',
              label: 'Phân quyền',
              icon: Shield,
              permissions: ['permissions.manage'],
            },
          ],
        },
        {
          label: 'Hệ thống',
          icon: Building,
          permissions: ['classes.view'],
          links: [
            {
              href: '/dashboard/admin/announcements',
              label: 'Bảng tin',
              icon: Bell,
              permissions: ['users.view'],
            },
            {
              href: '/dashboard/admin/semesters',
              label: 'Học kỳ',
              icon: Calendar,
              permissions: ['classes.view'],
            },
            {
              href: '/dashboard/admin/subjects',
              label: 'Môn học',
              icon: BookOpen,
              permissions: ['classes.view'],
            },
            {
              href: '/dashboard/admin/invitations',
              label: 'Lời mời',
              icon: CheckCircle,
              permissions: ['users.view'],
            },
            {
              href: '/dashboard/admin/data',
              label: 'Dữ liệu tập trung',
              icon: Download,
              permissions: ['reports.export'],
            },
          ],
        },
      ],
    },
    {
      title: 'Cài đặt',
      links: [{ href: '/dashboard/profile', label: 'Hồ sơ cá nhân', icon: User }],
    },
  ],

  // ── TEACHER: Teach → Mark → Grade → Review ──
  teacher: [
    {
      title: 'Trang chủ',
      links: [
        { href: '/dashboard', label: 'Bảng điều khiển', icon: Home },
        { href: '/dashboard/notifications', label: 'Thông báo', icon: Bell },
      ],
    },
    {
      title: 'Lớp dạy',
      links: [
        { href: '/dashboard/teacher/classes', label: 'Lớp dạy của tôi', icon: BookOpen },
        { href: '/dashboard/my-schedule', label: 'Lịch của tôi', icon: Clock },
        {
          href: '/dashboard/timetable',
          label: 'Thời khóa biểu',
          icon: Calendar,
          permissions: ['timetable.view'],
        },
      ],
    },
    {
      title: 'Công việc hàng ngày',
      links: [
        {
          href: '/dashboard/attendance/mark',
          label: 'Điểm danh hôm nay',
          icon: CheckCircle,
          permissions: ['attendance.mark'],
        },
        {
          href: routes.grades.entry(),
          label: 'Nhập điểm',
          icon: BarChart2,
          permissions: ['grades.entry'],
        },
        {
          href: '/dashboard/attendance/history',
          label: 'Lịch sử điểm danh',
          icon: FileText,
          permissions: ['attendance.view'],
        },
      ],
    },
    {
      title: 'Xem lại',
      links: [
        {
          href: '/dashboard/grades/transcripts',
          label: 'Bảng điểm',
          icon: FileText,
          permissions: ['grades.view'],
        },
        {
          href: routes.grades.analytics(),
          label: 'Phân tích học lực',
          icon: TrendingUp,
          permissions: ['grades.analytics'],
        },
        {
          href: '/dashboard/attendance/reports',
          label: 'Báo cáo điểm danh',
          icon: BarChart2,
          permissions: ['attendance.reports'],
        },
      ],
    },
    {
      title: 'Cá nhân',
      links: [{ href: '/dashboard/profile', label: 'Hồ sơ cá nhân', icon: User }],
    },
  ],

  // ── TUTOR: Minimal — own students only ──
  tutor: [
    {
      title: 'Trang chủ',
      links: [
        { href: '/dashboard', label: 'Bảng điều khiển', icon: Home },
        { href: '/dashboard/notifications', label: 'Thông báo', icon: Bell },
      ],
    },
    {
      title: 'Kèm học',
      links: [
        { href: '/dashboard/tutor/students', label: 'Học sinh kèm', icon: Users },
        { href: '/dashboard/my-schedule', label: 'Lịch của tôi', icon: Clock },
      ],
    },
    {
      title: 'Cá nhân',
      links: [{ href: '/dashboard/profile', label: 'Hồ sơ cá nhân', icon: User }],
    },
  ],

  // ── PARENT: Monitor children ──
  parent: [
    {
      title: 'Trang chủ',
      links: [
        { href: '/dashboard', label: 'Bảng điều khiển', icon: Home },
        { href: '/dashboard/notifications', label: 'Thông báo', icon: Bell },
      ],
    },
    {
      title: 'Con của tôi',
      links: [
        {
          href: '/dashboard/parent',
          label: 'Học sinh của tôi',
          icon: Users,
          permissions: ['parent.view_students'],
        },
        {
          href: '/dashboard/parent/link-student',
          label: 'Kết nối học sinh',
          icon: UserPlus,
          permissions: ['parent.link_student'],
        },
        { href: '/dashboard/calendar', label: 'Lịch học tập', icon: CalendarDays },
      ],
    },
    {
      title: 'Theo dõi kết quả',
      links: [
        {
          href: '/dashboard/parent/grades',
          label: 'Bảng điểm của con',
          icon: FileText,
          permissions: ['grades.view'],
        },
        {
          href: '/dashboard/parent/attendance',
          label: 'Điểm danh của con',
          icon: CheckCircle,
          permissions: ['attendance.view'],
        },
      ],
    },
    {
      title: 'Cá nhân',
      links: [{ href: '/dashboard/profile', label: 'Hồ sơ cá nhân', icon: User }],
    },
  ],

  // ── STUDENT: Consume information ──
  student: [
    {
      title: 'Trang chủ',
      links: [
        { href: '/dashboard', label: 'Bảng điều khiển', icon: Home },
        { href: '/dashboard/notifications', label: 'Thông báo', icon: Bell },
      ],
    },
    {
      title: 'Học tập',
      links: [
        {
          href: '/dashboard/classes',
          label: 'Lớp học',
          icon: BookOpen,
          permissions: ['classes.view'],
        },
        {
          href: '/dashboard/timetable',
          label: 'Thời khóa biểu',
          icon: Clock,
          permissions: ['timetable.view'],
        },
        { href: '/dashboard/my-schedule', label: 'Lịch của tôi', icon: Calendar },
        { href: '/dashboard/calendar', label: 'Lịch học tập', icon: CalendarDays },
      ],
    },
    {
      title: 'Kết quả',
      links: [
        {
          href: '/dashboard/grades/transcripts',
          label: 'Điểm của tôi',
          icon: FileText,
          permissions: ['grades.view'],
        },
        {
          href: '/dashboard/attendance/history',
          label: 'Điểm danh của tôi',
          icon: CheckCircle,
          permissions: ['attendance.view'],
        },
      ],
    },
    {
      title: 'Cá nhân',
      links: [{ href: '/dashboard/profile', label: 'Hồ sơ cá nhân', icon: User }],
    },
  ],
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Returns filtered navigation for a user based on their role preset + permissions.
 * Uses ROLE_NAV_PRESETS when available, falls back to ALL_NAV_ITEMS for super_admin.
 */
export function getNavigationForPermissions(
  userPermissions: Set<PermissionCode>,
  role?: UserRole
): NavSection[] {
  const baseItems = (role && ROLE_NAV_PRESETS[role]) || ALL_NAV_ITEMS;

  return baseItems
    .map((section) => {
      const filteredLinks = section.links?.filter((link) => {
        // allowedRoles only relevant for ALL_NAV_ITEMS fallback
        if (link.allowedRoles && role && !link.allowedRoles.includes(role)) return false;
        if (userPermissions.has('*')) return true;
        if (!link.permissions || link.permissions.length === 0) return true;
        return link.permissions.some((p) => userPermissions.has(p));
      });

      const filteredGroups = section.groups
        ?.map((group) => {
          if (group.allowedRoles && role && !group.allowedRoles.includes(role)) return null;

          const hasGroupPermission =
            userPermissions.has('*') ||
            !group.permissions ||
            group.permissions.some((p) => userPermissions.has(p));

          if (!hasGroupPermission) return null;

          const filteredGroupLinks = group.links.filter((link) => {
            if (link.allowedRoles && role && !link.allowedRoles.includes(role)) return false;
            if (userPermissions.has('*')) return true;
            if (!link.permissions || link.permissions.length === 0) return true;
            return link.permissions.some((p) => userPermissions.has(p));
          });

          if (filteredGroupLinks.length === 0) return null;

          return { ...group, links: filteredGroupLinks };
        })
        .filter(Boolean) as NavGroup[] | undefined;

      return {
        ...section,
        links: filteredLinks,
        groups: filteredGroups,
      };
    })
    .filter(
      (section) =>
        (section.links && section.links.length > 0) || (section.groups && section.groups.length > 0)
    );
}

export function getNavigationForRole(role: UserRole): NavSection[] {
  const permissions = getFlattenedPermissions(role);
  return getNavigationForPermissions(permissions, role);
}

export function isLinkVisible(link: NavLink, userPermissions: Set<PermissionCode>): boolean {
  if (userPermissions.has('*')) return true;
  if (!link.permissions || link.permissions.length === 0) return true;
  return link.permissions.some((p) => userPermissions.has(p));
}

// ============================================
// ROLE-SPECIFIC LABELS (legacy fallback)
// ============================================

export const ROLE_SPECIFIC_LABELS: Partial<Record<UserRole, Record<string, string>>> = {
  admin: {
    '/dashboard/classes': 'Quản trị lớp học',
    '/dashboard/students': 'Quản trị học sinh',
    '/dashboard/timetable': 'Quản lý lịch học tập',
  },
  teacher: {
    '/dashboard/classes': 'Lớp của tôi',
    '/dashboard/timetable': 'Thời khóa biểu',
  },
  student: {
    '/dashboard/classes': 'Lớp học',
    '/dashboard/grades/transcripts': 'Điểm của tôi',
    '/dashboard/attendance/history': 'Điểm danh của tôi',
  },
  parent: {
    '/dashboard/parent': 'Học sinh của tôi',
    '/dashboard/parent/link-student': 'Kết nối học sinh',
  },
};

export function getNavLabel(link: NavLink, role: UserRole): string {
  const override = ROLE_SPECIFIC_LABELS[role]?.[link.href];
  return override || link.label;
}
