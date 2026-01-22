/**
 * Role Utilities
 * Consistent role configuration, colors, and labels across the application
 */

export type UserRole = "admin" | "staff" | "teacher" | "student";

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
}

/**
 * Centralized role configuration
 * Use these for consistent styling and labeling throughout the app
 */
export const ROLE_CONFIG: Record<UserRole, RoleConfig> = {
    admin: {
        label: "Quản trị viên",
        labelEn: "Administrator",
        description: "Toàn quyền quản lý hệ thống",
        color: "red",
        bgClass: "bg-red-100 text-red-800",
        bgClassDark: "dark:bg-red-900/30 dark:text-red-300",
        textClass: "text-red-600 dark:text-red-400",
        borderClass: "border-red-200 dark:border-red-800",
        icon: "👑",
    },
    staff: {
        label: "Nhân viên",
        labelEn: "Staff",
        description: "Quản lý học vụ và tài chính",
        color: "purple",
        bgClass: "bg-purple-100 text-purple-800",
        bgClassDark: "dark:bg-purple-900/30 dark:text-purple-300",
        textClass: "text-purple-600 dark:text-purple-400",
        borderClass: "border-purple-200 dark:border-purple-800",
        icon: "💼",
    },
    teacher: {
        label: "Giáo viên",
        labelEn: "Teacher",
        description: "Giảng dạy và quản lý lớp học",
        color: "blue",
        bgClass: "bg-blue-100 text-blue-800",
        bgClassDark: "dark:bg-blue-900/30 dark:text-blue-300",
        textClass: "text-blue-600 dark:text-blue-400",
        borderClass: "border-blue-200 dark:border-blue-800",
        icon: "👨‍🏫",
    },
    student: {
        label: "Học sinh",
        labelEn: "Student",
        description: "Tham gia học tập",
        color: "green",
        bgClass: "bg-green-100 text-green-800",
        bgClassDark: "dark:bg-green-900/30 dark:text-green-300",
        textClass: "text-green-600 dark:text-green-400",
        borderClass: "border-green-200 dark:border-green-800",
        icon: "🎓",
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
        label: "Người dùng",
        labelEn: "User",
        description: "Người dùng hệ thống",
        color: "gray",
        bgClass: "bg-gray-100 text-gray-800",
        bgClassDark: "dark:bg-gray-900/30 dark:text-gray-300",
        textClass: "text-gray-600 dark:text-gray-400",
        borderClass: "border-gray-200 dark:border-gray-800",
        icon: "👤",
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
    return ["admin", "staff", "teacher", "student"];
}

/**
 * Check if a role is valid
 */
export function isValidRole(role: string | null | undefined): role is UserRole {
    return typeof role === "string" && role in ROLE_CONFIG;
}

/**
 * Role hierarchy for permission checks
 * Higher number = more privileges
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
    admin: 100,
    staff: 75,
    teacher: 50,
    student: 25,
};

/**
 * Check if one role has higher or equal privileges than another
 */
export function hasHigherOrEqualRole(
    actorRole: UserRole,
    targetRole: UserRole,
): boolean {
    return ROLE_HIERARCHY[actorRole] >= ROLE_HIERARCHY[targetRole];
}

/**
 * Check if actor can modify target's role
 * - Only admin can modify admin/staff roles
 * - Staff can modify teacher/student roles
 * - Teachers and students cannot modify roles
 */
export function canModifyUserRole(
    actorRole: string,
    targetRole: string,
    newRole?: string,
): boolean {
    if (!isValidRole(actorRole)) return false;
    if (!isValidRole(targetRole)) return false;

    // Only admin can modify admin or staff
    if (targetRole === "admin" || targetRole === "staff") {
        return actorRole === "admin";
    }

    // If changing TO admin/staff, only admin can do it
    if (newRole && (newRole === "admin" || newRole === "staff")) {
        return actorRole === "admin";
    }

    // Staff can modify teacher/student
    if (
        actorRole === "staff" &&
        (targetRole === "teacher" || targetRole === "student")
    ) {
        return true;
    }

    // Admin can modify anyone
    return actorRole === "admin";
}
