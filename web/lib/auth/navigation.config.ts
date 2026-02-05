/**
 * Navigation Configuration
 * Defines navigation items with permission requirements
 * Restructured for professional educational system
 */

import {
  BarChart2,
  BookOpen,
  Building,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
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
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getFlattenedPermissions, PermissionCode, UserRole } from "./core";
import { routes } from "@/lib/routes";

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

export interface NavGroup {
  label: string;
  icon: LucideIcon;
  links: NavLink[];
  permissions?: PermissionCode[]; // Group-level permissions
}

export interface NavSection {
  title: string;
  links?: NavLink[];
  groups?: NavGroup[]; // Collapsible groups
}

// ============================================
// NAVIGATION ITEMS - Consolidated Structure
// ============================================

export const ALL_NAV_ITEMS: NavSection[] = [
  // Section 1: Home
  {
    title: "Trang chủ",
    links: [
      { href: "/dashboard", label: "Bảng điều khiển", icon: Home },
    ],
  },

  // Section 2: Academic
  {
    title: "Học vụ",
    links: [
      {
        href: "/dashboard/classes",
        label: "Lớp học",
        icon: BookOpen,
        permissions: ["classes.view"],
      },
      {
        href: "/dashboard/students",
        label: "Học sinh",
        icon: Users,
        permissions: ["students.view"],
      },
      {
        href: "/dashboard/timetable",
        label: "Thời khóa biểu",
        icon: Clock,
        permissions: ["timetable.view"],
      },
      {
        href: "/dashboard/admin/students/parent-links",
        label: "Duyệt kết nối PH",
        icon: UserPlus,
        permissions: ["students.edit"],
      },
      {
        href: "/dashboard/my-schedule",
        label: "Lịch của tôi",
        icon: Calendar,
      },
    ],
  },

  // Section: Parent Management
  {
    title: "Phụ huynh",
    links: [
      {
        href: "/dashboard/parent",
        label: "Học sinh của tôi",
        icon: Users,
        permissions: ["parent.view_students"],
      },
      {
        href: "/dashboard/parent/link-student",
        label: "Kết nối học sinh",
        icon: UserPlus,
        permissions: ["parent.link_student"],
      },
    ],
  },

  // Section 3: Attendance & Grades
  {
    title: "Điểm danh & Điểm số",
    groups: [
      {
        label: "Điểm danh",
        icon: CheckCircle,
        permissions: ["attendance.view"],
        links: [
          {
            href: "/dashboard/attendance/mark",
            label: "Điểm danh hôm nay",
            icon: CheckCircle,
            permissions: ["attendance.mark"],
          },
          {
            href: "/dashboard/attendance/history",
            label: "Lịch sử điểm danh",
            icon: FileText,
            permissions: ["attendance.view"],
          },
          {
            href: "/dashboard/attendance/reports",
            label: "Báo cáo điểm danh",
            icon: BarChart2,
            permissions: ["attendance.reports"],
          },
        ],
      },
      {
        label: "Điểm số",
        icon: TrendingUp,
        permissions: ["grades.view"],
        links: [
          {
            href: routes.grades.entry(),
            label: "Nhập điểm",
            icon: BarChart2,
            permissions: ["grades.entry"],
          },
          {
            href: "/dashboard/grades/transcripts",
            label: "Bảng điểm",
            icon: FileText,
            permissions: ["grades.view"],
          },
          {
            href: routes.grades.analytics(),
            label: "Phân tích học lực",
            icon: TrendingUp,
            permissions: ["grades.analytics"],
          },
        ],
      },
    ],
  },

  // Section 4: Administration
  {
    title: "Quản trị",
    groups: [
      {
        label: "Người dùng",
        icon: Shield,
        permissions: ["users.view"],
        links: [
          {
            href: "/dashboard/users",
            label: "Quản lý tài khoản",
            icon: Users,
            permissions: ["users.view"],
          },
          {
            href: "/dashboard/tutors",
            label: "Gia sư",
            icon: GraduationCap,
            permissions: ["users.view"],
          },
          {
            href: "/dashboard/admin/permissions",
            label: "Phân quyền",
            icon: Shield,
            permissions: ["permissions.manage"],
          },
        ],
      },
      {
        label: "Tài chính",
        icon: CreditCard,
        permissions: ["finance.invoices"],
        links: [
          {
            href: "/dashboard/admin/finance/invoices",
            label: "Hóa đơn",
            icon: FileText,
            permissions: ["finance.invoices"],
          },
          {
            href: "/dashboard/admin/finance/payments",
            label: "Thanh toán",
            icon: CreditCard,
            permissions: ["finance.payments"],
          },
        ],
      },
      {
        label: "Hệ thống",
        icon: Building,
        permissions: ["classes.view"],
        links: [
          {
            href: "/dashboard/admin/semesters",
            label: "Học kỳ",
            icon: Calendar,
            permissions: ["classes.view"],
          },
          {
            href: "/dashboard/admin/subjects",
            label: "Môn học",
            icon: BookOpen,
            permissions: ["classes.view"],
          },
          {
            href: "/dashboard/admin/enrollments",
            label: "Ghi danh",
            icon: Users,
            permissions: ["students.edit"],
          },
          {
            href: "/dashboard/admin/invitations",
            label: "Lời mời hệ thống",
            icon: CheckCircle,
            permissions: ["users.view"],
          },
          {
            href: "/dashboard/admin/data",
            label: "Xuất dữ liệu",
            icon: Download,
            permissions: ["reports.export"],
          },
        ],
      },
    ],
  },

  // Section 5: Settings
  {
    title: "Cài đặt",
    links: [
      {
        href: "/dashboard/profile",
        label: "Hồ sơ cá nhân",
        icon: User,
      },
      {
        href: "/dashboard/settings",
        label: "Cài đặt hệ thống",
        icon: Settings,
        permissions: ["system.settings"],
      },
    ],
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getNavigationForPermissions(
  userPermissions: Set<PermissionCode>,
): NavSection[] {
  return ALL_NAV_ITEMS
    .map((section) => {
      const filteredLinks = section.links?.filter((link) => {
        if (userPermissions.has("*")) return true; // Super Admin wildcard
        if (!link.permissions || link.permissions.length === 0) return true;
        return link.permissions.some((p) => userPermissions.has(p));
      });

      const filteredGroups = section.groups?.map((group) => {
        const hasGroupPermission = userPermissions.has("*") ||
          !group.permissions ||
          group.permissions.some((p) => userPermissions.has(p));

        if (!hasGroupPermission) return null;

        const filteredGroupLinks = group.links.filter((link) => {
          if (userPermissions.has("*")) return true; // Super Admin wildcard
          if (!link.permissions || link.permissions.length === 0) return true;
          return link.permissions.some((p) => userPermissions.has(p));
        });

        if (filteredGroupLinks.length === 0) return null;

        return { ...group, links: filteredGroupLinks };
      }).filter(Boolean) as NavGroup[] | undefined;

      return {
        ...section,
        links: filteredLinks,
        groups: filteredGroups,
      };
    })
    .filter((section) =>
      (section.links && section.links.length > 0) ||
      (section.groups && section.groups.length > 0)
    );
}

export function getNavigationForRole(role: UserRole): NavSection[] {
  const permissions = getFlattenedPermissions(role);
  return getNavigationForPermissions(permissions);
}

export function isLinkVisible(
  link: NavLink,
  userPermissions: Set<PermissionCode>,
): boolean {
  if (userPermissions.has("*")) return true; // Super Admin wildcard
  if (!link.permissions || link.permissions.length === 0) return true;
  return link.permissions.some((p) => userPermissions.has(p));
}

// ============================================
// ROLE-SPECIFIC LABELS
// ============================================

export const ROLE_SPECIFIC_LABELS: Partial<
  Record<UserRole, Record<string, string>>
> = {
  staff: {
    "/dashboard/classes": "Quản lý lớp học",
    "/dashboard/students": "Quản lý học sinh",
    "/dashboard/timetable": "Quản lý TKB",
  },
  teacher: {
    "/dashboard/classes": "Lớp của tôi",
    "/dashboard/timetable": "Thời khóa biểu",
  },
  student: {
    "/dashboard/classes": "Lớp học",
    "/dashboard/grades/transcripts": "Điểm của tôi",
    "/dashboard/attendance/history": "Điểm danh của tôi",
  },
  parent: {
    "/dashboard/parent": "Học sinh của tôi",
    "/dashboard/parent/link-student": "Kết nối học sinh",
  },
};

export function getNavLabel(link: NavLink, role: UserRole): string {
  const override = ROLE_SPECIFIC_LABELS[role]?.[link.href];
  return override || link.label;
}
