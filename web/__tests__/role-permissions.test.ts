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
} from '@/lib/role-utils';

describe('Role Utilities', () => {
  it('should have all required roles defined', () => {
    expect(ROLE_CONFIG.super_admin).toBeDefined();
    expect(ROLE_CONFIG.owner).toBeDefined();
    expect(ROLE_CONFIG.admin).toBeDefined();
    expect(ROLE_CONFIG.staff).toBeDefined();
    expect(ROLE_CONFIG.teacher).toBeDefined();
    expect(ROLE_CONFIG.tutor).toBeDefined();
    expect(ROLE_CONFIG.parent).toBeDefined();
    expect(ROLE_CONFIG.student).toBeDefined();
  });

  it('should have correct Vietnamese labels', () => {
    expect(ROLE_CONFIG.admin.label).toBe('Quản trị viên');
    expect(ROLE_CONFIG.staff.label).toBe('Nhân viên');
    expect(ROLE_CONFIG.teacher.label).toBe('Giáo viên');
    expect(ROLE_CONFIG.student.label).toBe('Học sinh');
    expect(ROLE_CONFIG.owner.label).toBe('Chủ sở hữu');
  });

  it('should have unique colors for each role', () => {
    const colors = getAllRoles().map((role) => ROLE_CONFIG[role].color);
    const uniqueColors = new Set(colors);
    expect(uniqueColors.size).toBe(8);
  });

  describe('getRoleConfig', () => {
    it('should return correct config for valid roles', () => {
      expect(getRoleConfig('admin').label).toBe('Quản trị viên');
      expect(getRoleConfig('teacher').color).toBe('blue');
    });

    it('should return fallback for invalid roles', () => {
      expect(getRoleConfig('invalid').label).toBe('Người dùng');
      expect(getRoleConfig(null).label).toBe('Người dùng');
      expect(getRoleConfig(undefined).label).toBe('Người dùng');
    });
  });

  describe('getRoleLabel', () => {
    it('should return Vietnamese label for valid roles', () => {
      expect(getRoleLabel('admin')).toBe('Quản trị viên');
      expect(getRoleLabel('student')).toBe('Học sinh');
    });
  });

  describe('getRoleBadgeClass', () => {
    it('should return CSS classes for role badges', () => {
      const adminClass = getRoleBadgeClass('admin');
      expect(adminClass).toContain('bg-red');
      expect(adminClass).toContain('dark:');
    });
  });

  describe('isValidRole', () => {
    it('should return true for valid roles', () => {
      expect(isValidRole('admin')).toBe(true);
      expect(isValidRole('staff')).toBe(true);
      expect(isValidRole('teacher')).toBe(true);
      expect(isValidRole('student')).toBe(true);
    });

    it('should return false for invalid roles', () => {
      expect(isValidRole('superadmin')).toBe(false);
      expect(isValidRole('')).toBe(false);
      expect(isValidRole(null)).toBe(false);
      expect(isValidRole(undefined)).toBe(false);
    });
  });

  describe('hasHigherOrEqualRole', () => {
    it('should correctly compare role hierarchy', () => {
      expect(hasHigherOrEqualRole('admin', 'student')).toBe(true);
      expect(hasHigherOrEqualRole('admin', 'admin')).toBe(true);
      expect(hasHigherOrEqualRole('staff', 'teacher')).toBe(true);
      expect(hasHigherOrEqualRole('student', 'admin')).toBe(false);
      expect(hasHigherOrEqualRole('teacher', 'staff')).toBe(false);
    });
  });

  describe('canModifyUserRole', () => {
    it('should allow admin to modify staff and below but not other admins', () => {
      expect(canModifyUserRole('admin', 'admin')).toBe(false);
      expect(canModifyUserRole('admin', 'staff')).toBe(true);
      expect(canModifyUserRole('admin', 'teacher')).toBe(true);
      expect(canModifyUserRole('admin', 'student')).toBe(true);
    });

    it('should allow admin to change roles within their targets', () => {
      expect(canModifyUserRole('admin', 'student', 'teacher')).toBe(true);
      expect(canModifyUserRole('admin', 'teacher', 'staff')).toBe(true);
      expect(canModifyUserRole('admin', 'student', 'admin')).toBe(false);
    });

    it('should allow owner to modify admin, staff, and others', () => {
      expect(canModifyUserRole('owner', 'admin')).toBe(true);
      expect(canModifyUserRole('owner', 'staff')).toBe(true);
      expect(canModifyUserRole('owner', 'student')).toBe(true);
    });

    it('should allow staff to modify teacher/student roles', () => {
      expect(canModifyUserRole('staff', 'teacher')).toBe(true);
      expect(canModifyUserRole('staff', 'student')).toBe(true);
    });

    it('should NOT allow staff to modify admin/staff roles', () => {
      expect(canModifyUserRole('staff', 'admin')).toBe(false);
      expect(canModifyUserRole('staff', 'staff')).toBe(false);
    });

    it('should NOT allow staff to promote users to admin/staff', () => {
      expect(canModifyUserRole('staff', 'student', 'admin')).toBe(false);
      expect(canModifyUserRole('staff', 'teacher', 'staff')).toBe(false);
    });

    it('should NOT allow teacher or student to modify roles', () => {
      expect(canModifyUserRole('teacher', 'student')).toBe(false);
      expect(canModifyUserRole('student', 'teacher')).toBe(false);
    });

    it('should return false for invalid roles', () => {
      expect(canModifyUserRole('invalid', 'student')).toBe(false);
      expect(canModifyUserRole('admin', 'invalid')).toBe(false);
    });
  });

  describe('getAllRoles', () => {
    it('should return all eight roles', () => {
      const roles = getAllRoles();
      expect(roles).toHaveLength(8);
      expect(roles).toContain('super_admin');
      expect(roles).toContain('owner');
      expect(roles).toContain('admin');
      expect(roles).toContain('staff');
      expect(roles).toContain('teacher');
      expect(roles).toContain('tutor');
      expect(roles).toContain('parent');
      expect(roles).toContain('student');
    });
  });
});

// Additional integration-style tests for the new hasPermission system
import { hasPermission } from '../lib/auth/core';

describe('Unified Permission Checks (hasPermission)', () => {
  it('super_admin should have all permissions', () => {
    expect(hasPermission('super_admin', 'system.settings')).toBe(true);
    expect(hasPermission('super_admin', 'finance.refund')).toBe(true);
  });

  it('owner should have finance and report permissions but not system settings', () => {
    expect(hasPermission('owner', 'finance.refund')).toBe(true);
    expect(hasPermission('owner', 'finance.view')).toBe(true);
    expect(hasPermission('owner', 'reports.view')).toBe(true);
    expect(hasPermission('owner', 'system.settings')).toBe(false);
  });

  it('admin should have user invite/soft-delete and finance permissions but not system settings or finance refund', () => {
    expect(hasPermission('admin', 'users.invite')).toBe(true);
    expect(hasPermission('admin', 'users.delete.soft')).toBe(true);
    expect(hasPermission('admin', 'finance.view')).toBe(true);
    expect(hasPermission('admin', 'finance.refund')).toBe(true);
    expect(hasPermission('admin', 'system.settings')).toBe(false);
  });

  it('staff should keep grades.entry and grades.manage but NOT have teacher mark attendance', () => {
    expect(hasPermission('staff', 'grades.entry')).toBe(true);
    expect(hasPermission('staff', 'grades.manage')).toBe(true);
    expect(hasPermission('staff', 'users.delete.soft')).toBe(true);
    expect(hasPermission('staff', 'attendance.mark')).toBe(false);
  });

  it('teacher should have class-scoped grades/attendance permissions but not users manage or finance', () => {
    expect(hasPermission('teacher', 'grades.entry')).toBe(true);
    expect(hasPermission('teacher', 'attendance.mark')).toBe(true);
    expect(hasPermission('teacher', 'users.create')).toBe(false);
    expect(hasPermission('teacher', 'finance.view')).toBe(false);
  });

  it('tutor should have tutoring session permissions but not teacher classroom powers', () => {
    expect(hasPermission('tutor', 'tutoring.sessions.view')).toBe(true);
    expect(hasPermission('tutor', 'tutoring.sessions.manage')).toBe(true);
    expect(hasPermission('tutor', 'attendance.mark')).toBe(false);
    expect(hasPermission('tutor', 'grades.delete')).toBe(false);
  });
});
