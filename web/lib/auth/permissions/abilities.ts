/**
 * Ability Definitions
 * Defines what each role can do in the system
 * Aligned with BH-EDU v5.0 Architecture
 */

import { AbilityRule, PermissionContext } from "./types";
import { UserRole } from "@/lib/auth/core";

/**
 * Define abilities for a given user context
 * This is the single source of truth for permissions
 */
export function defineAbilitiesFor(context: PermissionContext): AbilityRule[] {
    const { role, userId, classIds = [] } = context;

    const rules: AbilityRule[] = [];

    // ============================================
    // SUPER ADMIN - Full system access
    // ============================================
    if (role === "super_admin") {
        rules.push({
            action: "manage",
            subject: "all",
            reason: "Super admin has unrestricted access",
        });
        return rules;
    }

    // ============================================
    // OWNER - Business oversight
    // ============================================
    if (role === "owner") {
        rules.push(
            { action: "manage", subject: "all" },
            { action: "read", subject: "Audit" },
            { action: "export", subject: "Report" },
        );
        return rules;
    }

    // ============================================
    // ADMIN - System management
    // ============================================
    if (role === "admin") {
        rules.push(
            // User management
            { action: "manage", subject: "User" },
            { action: "manage", subject: "Student" },
            { action: "manage", subject: "Teacher" },
            // Academic management
            { action: "manage", subject: "Class" },
            { action: "manage", subject: "Subject" },
            { action: "manage", subject: "Enrollment" },
            // Data access
            { action: "read", subject: "Grade" },
            { action: "read", subject: "Attendance" },
            { action: "read", subject: "Audit" },
            // System
            { action: "manage", subject: "Setting" },
            { action: "export", subject: "Report" },
        );
    }

    // ============================================
    // STAFF - Operational tasks
    // ============================================
    if (role === "staff" || role === "admin") {
        rules.push(
            // User operations (limited)
            { action: ["create", "read", "update"], subject: "User" },
            { action: ["create", "read", "update"], subject: "Student" },
            // Class management
            { action: "manage", subject: "Class" },
            { action: "manage", subject: "Enrollment" },
            // Financial
            { action: "manage", subject: "Invoice" },
            { action: "manage", subject: "Payment" },
            // Reports
            { action: "read", subject: "Report" },
            { action: "export", subject: "Report" },
        );
    }

    // ============================================
    // TEACHER - Class-scoped permissions
    // ============================================
    if (role === "teacher" || role === "staff" || role === "admin") {
        rules.push(
            // Grades - only for their classes
            {
                action: ["create", "read", "update"],
                subject: "Grade",
                conditions: { class_id: { $in: classIds } },
                reason: "Teachers can only manage grades for their classes",
            },
            // Attendance - only for their classes
            {
                action: ["create", "read", "update"],
                subject: "Attendance",
                conditions: { class_id: { $in: classIds } },
                reason: "Teachers can only mark attendance for their classes",
            },
            // Students - only in their classes
            {
                action: "read",
                subject: "Student",
                conditions: {
                    enrollments: {
                        class_id: { $in: classIds },
                        status: "active",
                    },
                },
                reason: "Teachers can view students enrolled in their classes",
            },
            // Classes - read their own
            {
                action: "read",
                subject: "Class",
                conditions: { teacher_id: userId },
            },
        );
    }

    // ============================================
    // TUTOR - Similar to teacher but more limited
    // ============================================
    if (role === "tutor") {
        rules.push(
            {
                action: ["create", "read"],
                subject: "Grade",
                conditions: { class_id: { $in: classIds } },
            },
            {
                action: ["create", "read"],
                subject: "Attendance",
                conditions: { class_id: { $in: classIds } },
            },
        );
    }

    // ============================================
    // PARENT - Own children only
    // ============================================
    if (role === "parent") {
        rules.push(
            // View own children
            {
                action: "read",
                subject: "Student",
                conditions: {
                    parent_links: { parent_id: userId, status: "approved" },
                },
                reason: "Parents can only view their linked children",
            },
            // View children's grades
            {
                action: "read",
                subject: "Grade",
                conditions: {
                    student: {
                        parent_links: { parent_id: userId, status: "approved" },
                    },
                },
            },
            // View children's attendance
            {
                action: "read",
                subject: "Attendance",
                conditions: {
                    student: {
                        parent_links: { parent_id: userId, status: "approved" },
                    },
                },
            },
            // View children's invoices
            {
                action: "read",
                subject: "Invoice",
                conditions: {
                    student: {
                        parent_links: { parent_id: userId, status: "approved" },
                    },
                },
            },
            // Make payments for children
            {
                action: "create",
                subject: "Payment",
                conditions: {
                    invoice: {
                        student: {
                            parent_links: {
                                parent_id: userId,
                                status: "approved",
                            },
                        },
                    },
                },
            },
        );
    }

    // ============================================
    // STUDENT - Own data only
    // ============================================
    if (role === "student") {
        rules.push(
            // View own grades
            {
                action: "read",
                subject: "Grade",
                conditions: { student_id: userId },
                reason: "Students can only view their own grades",
            },
            // View own attendance
            {
                action: "read",
                subject: "Attendance",
                conditions: { student_id: userId },
            },
            // View enrolled classes
            {
                action: "read",
                subject: "Class",
                conditions: {
                    enrollments: {
                        student_id: userId,
                        status: "active",
                    },
                },
            },
            // View own invoices
            {
                action: "read",
                subject: "Invoice",
                conditions: { student_id: userId },
            },
            // View subjects
            {
                action: "read",
                subject: "Subject",
            },
        );
    }

    return rules;
}

/**
 * Get human-readable description of a role's permissions
 */
export function getRoleDescription(role: UserRole): string {
    const descriptions: Record<UserRole, string> = {
        super_admin: "Full system access with no restrictions",
        owner: "Business oversight with financial and reporting access",
        admin: "System management including users, classes, and settings",
        staff: "Operational tasks including enrollment and finance",
        teacher:
            "Class management including grades and attendance for assigned classes",
        tutor: "Limited teaching access for tutoring sessions",
        parent: "View children's academic progress and make payments",
        student: "View own academic records and class information",
    };

    return descriptions[role] || "No description available";
}
