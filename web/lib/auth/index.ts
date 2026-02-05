/**
 * Authentication System Index
 * Exports all auth-related utilities
 */

// Core authentication functions
export {
  adminAuth,
  type AuthResult,
  checkPermission,
  staffAuth,
  teacherAuth,
} from "./adminAuth";

// Permission system (Unified Core)
export {
  BASE_ROLE_PERMISSIONS,
  getFlattenedPermissions,
  hasPermission,
  isAtLeast,
  type Permission,
  type PermissionCode,
  ROLE_HIERARCHY,
  type UserRole,
} from "./core";

// Rate limiting
export {
  checkRateLimit,
  cleanupRateLimits,
  clearAllRateLimits,
  getAllRateLimits,
  getRateLimitIdentifier,
  getRateLimitStatus,
  type RateLimitConfig,
  rateLimitConfigs,
  resetRateLimit,
} from "./rateLimit";

// Caching
export {
  type CacheConfig,
  cacheConfigs,
  cleanupExpiredCache,
  clearAllCache,
  clearNamespace,
  deleteCached,
  getCached,
  getCacheStats,
  setCached,
  withCache,
} from "./cache";

// Audit logging
export {
  type AuditEvent,
  type AuditEventType,
  clearAuditLogs,
  exportAuditLogs,
  getAuditStats,
  logAdminAction,
  logAuditEvent,
  logAuthAttempt,
  logAuthzCheck,
  logDataAccess,
  logRateLimitEvent,
  queryAuditLogs,
} from "./auditLog";
