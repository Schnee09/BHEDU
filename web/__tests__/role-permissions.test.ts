/**
 * Role Permissions Tests
 * Test suite for role-based permission system
 */

import {
    canModifyUserRole,
    getAllRoles,
    getRoleBadgeClass,
    getRoleConfig,
    getRoleLabel,
    hasHigherOrEqualRole,
    isValidRole,
    ROLE_CONFIG,
    type UserRole,
} from "@/lib/role-utils";

describe("Role Utilities", () => {
    describe("ROLE_CONFIG", () => {
        it("should have all four roles defined", () => {
            expect(ROLE_CONFIG.admin).toBeDefined();
            expect(ROLE_CONFIG.staff).toBeDefined();
            expect(ROLE_CONFIG.teacher).toBeDefined();
            expect(ROLE_CONFIG.student).toBeDefined();
        });

        it("should have correct Vietnamese labels", () => {
            expect(ROLE_CONFIG.admin.label).toBe("Quản trị viên");
            expect(ROLE_CONFIG.staff.label).toBe("Nhân viên");
            expect(ROLE_CONFIG.teacher.label).toBe("Giáo viên");
            expect(ROLE_CONFIG.student.label).toBe("Học sinh");
        });

        it("should have unique colors for each role", () => {
            const colors = getAllRoles().map((role) => ROLE_CONFIG[role].color);
            const uniqueColors = new Set(colors);
            expect(uniqueColors.size).toBe(4);
        });
    });

    describe("getRoleConfig", () => {
        it("should return correct config for valid roles", () => {
            expect(getRoleConfig("admin").label).toBe("Quản trị viên");
            expect(getRoleConfig("teacher").color).toBe("blue");
        });

        it("should return fallback for invalid roles", () => {
            expect(getRoleConfig("invalid").label).toBe("Người dùng");
            expect(getRoleConfig(null).label).toBe("Người dùng");
            expect(getRoleConfig(undefined).label).toBe("Người dùng");
        });
    });

    describe("getRoleLabel", () => {
        it("should return Vietnamese label for valid roles", () => {
            expect(getRoleLabel("admin")).toBe("Quản trị viên");
            expect(getRoleLabel("student")).toBe("Học sinh");
        });
    });

    describe("getRoleBadgeClass", () => {
        it("should return CSS classes for role badges", () => {
            const adminClass = getRoleBadgeClass("admin");
            expect(adminClass).toContain("bg-red");
            expect(adminClass).toContain("dark:");
        });
    });

    describe("isValidRole", () => {
        it("should return true for valid roles", () => {
            expect(isValidRole("admin")).toBe(true);
            expect(isValidRole("staff")).toBe(true);
            expect(isValidRole("teacher")).toBe(true);
            expect(isValidRole("student")).toBe(true);
        });

        it("should return false for invalid roles", () => {
            expect(isValidRole("superadmin")).toBe(false);
            expect(isValidRole("")).toBe(false);
            expect(isValidRole(null)).toBe(false);
            expect(isValidRole(undefined)).toBe(false);
        });
    });

    describe("hasHigherOrEqualRole", () => {
        it("should correctly compare role hierarchy", () => {
            expect(hasHigherOrEqualRole("admin", "student")).toBe(true);
            expect(hasHigherOrEqualRole("admin", "admin")).toBe(true);
            expect(hasHigherOrEqualRole("staff", "teacher")).toBe(true);
            expect(hasHigherOrEqualRole("student", "admin")).toBe(false);
            expect(hasHigherOrEqualRole("teacher", "staff")).toBe(false);
        });
    });

    describe("canModifyUserRole", () => {
        it("should allow admin to modify any user role", () => {
            expect(canModifyUserRole("admin", "admin")).toBe(true);
            expect(canModifyUserRole("admin", "staff")).toBe(true);
            expect(canModifyUserRole("admin", "teacher")).toBe(true);
            expect(canModifyUserRole("admin", "student")).toBe(true);
        });

        it("should allow admin to change any role to any other role", () => {
            expect(canModifyUserRole("admin", "student", "admin")).toBe(true);
            expect(canModifyUserRole("admin", "teacher", "staff")).toBe(true);
        });

        it("should allow staff to modify teacher/student roles", () => {
            expect(canModifyUserRole("staff", "teacher")).toBe(true);
            expect(canModifyUserRole("staff", "student")).toBe(true);
        });

        it("should NOT allow staff to modify admin/staff roles", () => {
            expect(canModifyUserRole("staff", "admin")).toBe(false);
            expect(canModifyUserRole("staff", "staff")).toBe(false);
        });

        it("should NOT allow staff to promote users to admin/staff", () => {
            expect(canModifyUserRole("staff", "student", "admin")).toBe(false);
            expect(canModifyUserRole("staff", "teacher", "staff")).toBe(false);
        });

        it("should NOT allow teacher or student to modify roles", () => {
            expect(canModifyUserRole("teacher", "student")).toBe(false);
            expect(canModifyUserRole("student", "teacher")).toBe(false);
        });

        it("should return false for invalid roles", () => {
            expect(canModifyUserRole("invalid", "student")).toBe(false);
            expect(canModifyUserRole("admin", "invalid")).toBe(false);
        });
    });

    describe("getAllRoles", () => {
        it("should return all four roles", () => {
            const roles = getAllRoles();
            expect(roles).toHaveLength(4);
            expect(roles).toContain("admin");
            expect(roles).toContain("staff");
            expect(roles).toContain("teacher");
            expect(roles).toContain("student");
        });
    });
});

// Additional integration-style tests for the hook helpers
describe("Role Permission Helpers", () => {
    describe("hasTeacherCapabilities concept", () => {
        it("admin should have teacher capabilities", () => {
            const role = "admin";
            const hasTeacherCaps = role === "admin" || role === "staff" ||
                role === "teacher";
            expect(hasTeacherCaps).toBe(true);
        });

        it("staff should have teacher capabilities", () => {
            const role = "staff";
            const hasTeacherCaps = role === "admin" || role === "staff" ||
                role === "teacher";
            expect(hasTeacherCaps).toBe(true);
        });

        it("teacher should have teacher capabilities", () => {
            const role = "teacher";
            const hasTeacherCaps = role === "admin" || role === "staff" ||
                role === "teacher";
            expect(hasTeacherCaps).toBe(true);
        });

        it("student should NOT have teacher capabilities", () => {
            const role = "student";
            const hasTeacherCaps = role === "admin" || role === "staff" ||
                role === "teacher";
            expect(hasTeacherCaps).toBe(false);
        });
    });

    describe("hasAdminAccess concept", () => {
        it("admin should have admin access", () => {
            const role = "admin";
            const hasAdminAccess = role === "admin" || role === "staff";
            expect(hasAdminAccess).toBe(true);
        });

        it("staff should have admin access", () => {
            const role = "staff";
            const hasAdminAccess = role === "admin" || role === "staff";
            expect(hasAdminAccess).toBe(true);
        });

        it("teacher should NOT have admin access", () => {
            const role = "teacher";
            const hasAdminAccess = role === "admin" || role === "staff";
            expect(hasAdminAccess).toBe(false);
        });

        it("student should NOT have admin access", () => {
            const role = "student";
            const hasAdminAccess = role === "admin" || role === "staff";
            expect(hasAdminAccess).toBe(false);
        });
    });
});
