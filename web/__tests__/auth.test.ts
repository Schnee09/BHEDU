/**
 * Enhanced Authentication System Tests
 * Run with: npm test
 */

import { beforeEach, describe, expect, it } from '@jest/globals';
import { getFlattenedPermissions, hasPermission, isAtLeast, UserRole } from '../lib/auth/core';
import { checkRateLimit, rateLimitConfigs, resetRateLimit } from '../lib/auth/rateLimit';
import { clearAllCache, deleteCached, getCached, setCached } from '../lib/auth/cache';

describe('Permission System (Unified RBAC)', () => {
  it('should grant super_admin full access', () => {
    expect(hasPermission('super_admin', 'system.settings')).toBe(true);
    expect(hasPermission('super_admin', 'users.create')).toBe(true);
    expect(hasPermission('super_admin', 'any.resource' as any)).toBe(true);
  });

  it('should grant admin appropriate access', () => {
    expect(hasPermission('admin', 'users.view')).toBe(true);
    expect(hasPermission('admin', 'classes.manage')).toBe(true);
    expect(hasPermission('admin', 'system.settings')).toBe(false); // Only super_admin
  });

  it('should handle role inheritance', () => {
    // Admin inherits from teacher
    expect(isAtLeast('admin', 'teacher')).toBe(true);
    // Teacher inherits from student
    expect(isAtLeast('teacher', 'student')).toBe(true);
    // Student does NOT inherit from teacher
    expect(isAtLeast('student', 'teacher')).toBe(false);
  });

  it('should grant teacher class-scoped access', () => {
    expect(hasPermission('teacher', 'attendance.view')).toBe(true);
    expect(hasPermission('teacher', 'grades.entry')).toBe(true);
    expect(hasPermission('teacher', 'users.create')).toBe(false);
  });

  it('should grant student limited access', () => {
    expect(hasPermission('student', 'attendance.view')).toBe(true);
    expect(hasPermission('student', 'grades.entry')).toBe(false);
  });

  it('should get all permissions for role', () => {
    const adminPerms = getFlattenedPermissions('admin');
    expect(adminPerms.size).toBeGreaterThan(0);
    expect(adminPerms.has('users.view')).toBe(true);

    const teacherPerms = getFlattenedPermissions('teacher');
    expect(teacherPerms.size).toBeGreaterThan(0);
    expect(teacherPerms.has('attendance.view')).toBe(true);
  });
});

describe('Rate Limiting', () => {
  beforeEach(() => {
    resetRateLimit('test-user');
  });

  const AUTH_MAX = rateLimitConfigs.auth.maxAttempts;

  it('should allow requests within limit', () => {
    for (let i = 0; i < AUTH_MAX; i++) {
      const result = checkRateLimit('test-user', rateLimitConfigs.auth);
      expect(result.allowed).toBe(true);
    }
  });

  it('should block requests exceeding limit', () => {
    for (let i = 0; i < AUTH_MAX; i++) {
      checkRateLimit('test-user', rateLimitConfigs.auth);
    }
    const result = checkRateLimit('test-user', rateLimitConfigs.auth);
    expect(result.allowed).toBe(false);
  });
});

describe('Caching', () => {
  beforeEach(() => {
    clearAllCache();
  });

  it('should cache and retrieve data', () => {
    const testData = { id: '1', name: 'Test' };
    setCached('test-key', testData, 'test');
    const retrieved = getCached('test-key', 'test');
    expect(retrieved).toEqual(testData);
  });
});
