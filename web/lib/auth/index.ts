/**
 * Authentication System Index
 * Exports all auth-related utilities
 */

// Core authentication functions
export {
  adminAuth,
  teacherAuth,
  checkPermission,
  type AuthResult,
  type Resource,
  type Action
} from './adminAuth'

// Permission system
export {
  hasPermission,
  getPermissionConditions,
  checkPermissionWithConditions,
  getRolePermissions,
  isAdminRole,
  describePermission,
  rolePermissions,
  type Permission
} from './permissions'

// Rate limiting
export {
  checkRateLimit,
  resetRateLimit,
  cleanupRateLimits,
  getRateLimitStatus,
  getRateLimitIdentifier,
  getAllRateLimits,
  clearAllRateLimits,
  rateLimitConfigs,
  type RateLimitConfig
} from './rateLimit'

// Caching
export {
  getCached,
  setCached,
  deleteCached,
  clearNamespace,
  clearAllCache,
  cleanupExpiredCache,
  getCacheStats,
  withCache,
  cacheConfigs,
  type CacheConfig
} from './cache'

// Audit logging
export {
  logAuditEvent,
  logAuthAttempt,
  logAuthzCheck,
  logAdminAction,
  logDataAccess,
  logRateLimitEvent,
  queryAuditLogs,
  getAuditStats,
  exportAuditLogs,
  clearAuditLogs,
  type AuditEvent,
  type AuditEventType
} from './auditLog'
