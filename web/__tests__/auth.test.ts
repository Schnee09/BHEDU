/**
 * Enhanced Authentication System Tests
 * Run with: npm test
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import {
  hasPermission,
  checkPermissionWithConditions,
  getRolePermissions
} from '../lib/auth/permissions'
import {
  checkRateLimit,
  resetRateLimit,
  rateLimitConfigs
} from '../lib/auth/rateLimit'
import {
  getCached,
  setCached,
  deleteCached,
  clearAllCache
} from '../lib/auth/cache'

describe('Permission System', () => {
  it('should grant admin full access', () => {
    expect(hasPermission('admin', 'grades', 'read')).toBe(true)
    expect(hasPermission('admin', 'grades', 'write')).toBe(true)
    expect(hasPermission('admin', 'grades', 'delete')).toBe(true)
    expect(hasPermission('admin', 'users', 'manage')).toBe(true)
  })

  it('should grant teacher class-scoped access', () => {
    expect(hasPermission('teacher', 'grades', 'read')).toBe(true)
    expect(hasPermission('teacher', 'grades', 'write')).toBe(true)
    expect(hasPermission('teacher', 'assignments', 'delete')).toBe(true)
  })

  it('should grant student limited access', () => {
    expect(hasPermission('student', 'grades', 'read')).toBe(true)
    expect(hasPermission('student', 'grades', 'write')).toBe(false)
    expect(hasPermission('student', 'assignments', 'read')).toBe(true)
    expect(hasPermission('student', 'users', 'manage')).toBe(false)
  })

  it('should check permission with conditions', () => {
    // Teacher can edit grades in their class
    expect(
      checkPermissionWithConditions('teacher', 'grades', 'write', {
        userId: 'teacher-1',
        userClassIds: ['class-1', 'class-2'],
        resourceClassId: 'class-1'
      })
    ).toBe(true)

    // Teacher cannot edit grades in other class
    expect(
      checkPermissionWithConditions('teacher', 'grades', 'write', {
        userId: 'teacher-1',
        userClassIds: ['class-1', 'class-2'],
        resourceClassId: 'class-3'
      })
    ).toBe(false)

    // Student can view own grade
    expect(
      checkPermissionWithConditions('student', 'grades', 'read', {
        userId: 'student-1',
        resourceOwnerId: 'student-1'
      })
    ).toBe(true)

    // Student cannot view others' grades
    expect(
      checkPermissionWithConditions('student', 'grades', 'read', {
        userId: 'student-1',
        resourceOwnerId: 'student-2'
      })
    ).toBe(false)
  })

  it('should get all permissions for role', () => {
    const adminPerms = getRolePermissions('admin')
    expect(adminPerms.length).toBeGreaterThan(0)
    expect(adminPerms.some(p => p.resource === '*')).toBe(true)

    const teacherPerms = getRolePermissions('teacher')
    expect(teacherPerms.length).toBeGreaterThan(0)
    expect(teacherPerms.some(p => p.resource === 'grades')).toBe(true)
  })
})

describe('Rate Limiting', () => {
  beforeEach(() => {
    resetRateLimit('test-user')
  })

  it('should allow requests within limit', () => {
    for (let i = 0; i < 10; i++) {
      const result = checkRateLimit('test-user', rateLimitConfigs.auth)
      expect(result.allowed).toBe(true)
    }
  })

  it('should block requests exceeding limit', () => {
    // Use all attempts
    for (let i = 0; i < 10; i++) {
      checkRateLimit('test-user', rateLimitConfigs.auth)
    }

    // Next request should be blocked
    const result = checkRateLimit('test-user', rateLimitConfigs.auth)
    expect(result.allowed).toBe(false)
    expect(result.blocked).toBe(true)
  })

  it('should track remaining attempts', () => {
    const result1 = checkRateLimit('test-user', rateLimitConfigs.auth)
    expect(result1.remaining).toBe(9) // 10 - 1

    const result2 = checkRateLimit('test-user', rateLimitConfigs.auth)
    expect(result2.remaining).toBe(8) // 10 - 2
  })

  it('should reset after calling resetRateLimit', () => {
    // Use some attempts
    checkRateLimit('test-user', rateLimitConfigs.auth)
    checkRateLimit('test-user', rateLimitConfigs.auth)

    // Reset
    resetRateLimit('test-user')

    // Should be back to full limit
    const result = checkRateLimit('test-user', rateLimitConfigs.auth)
    expect(result.remaining).toBe(9)
  })
})

describe('Caching', () => {
  beforeEach(() => {
    clearAllCache()
  })

  it('should cache and retrieve data', () => {
    const testData = { id: '1', name: 'Test' }
    
    setCached('test-key', testData, 'test')
    const retrieved = getCached('test-key', 'test')
    
    expect(retrieved).toEqual(testData)
  })

  it('should return null for missing key', () => {
    const retrieved = getCached('nonexistent', 'test')
    expect(retrieved).toBe(null)
  })

  it('should delete cached data', () => {
    setCached('test-key', { data: 'test' }, 'test')
    
    const deleted = deleteCached('test-key', 'test')
    expect(deleted).toBe(true)
    
    const retrieved = getCached('test-key', 'test')
    expect(retrieved).toBe(null)
  })

  it('should respect TTL', async () => {
    const shortTTL = { ttl: 100 } // 100ms
    
    setCached('test-key', { data: 'test' }, 'test', shortTTL)
    
    // Should be cached immediately
    let retrieved = getCached('test-key', 'test')
    expect(retrieved).not.toBe(null)
    
    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 150))
    
    // Should be expired
    retrieved = getCached('test-key', 'test')
    expect(retrieved).toBe(null)
  })

  it('should clear all cache', () => {
    setCached('key1', { data: 'test1' }, 'test')
    setCached('key2', { data: 'test2' }, 'test')
    
    clearAllCache()
    
    expect(getCached('key1', 'test')).toBe(null)
    expect(getCached('key2', 'test')).toBe(null)
  })
})

describe('Integration Tests', () => {
  it('should work together: auth with caching and rate limiting', () => {
    // Simulate multiple auth attempts with caching
    const userId = 'user-123'
    const profile = { id: userId, role: 'teacher' }

    // First access - not cached
    let cached = getCached(`profile:${userId}`, 'auth')
    expect(cached).toBe(null)

    // Cache the profile
    setCached(`profile:${userId}`, profile, 'auth')

    // Second access - from cache
    cached = getCached(`profile:${userId}`, 'auth')
    expect(cached).toEqual(profile)

    // Check rate limit
    const rateLimit = checkRateLimit(`user:${userId}`, rateLimitConfigs.auth)
    expect(rateLimit.allowed).toBe(true)
    expect(rateLimit.remaining).toBe(9)

    // Clear cache when profile updates
    deleteCached(`profile:${userId}`, 'auth')
    cached = getCached(`profile:${userId}`, 'auth')
    expect(cached).toBe(null)
  })
})
