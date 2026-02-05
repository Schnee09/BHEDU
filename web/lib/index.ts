/**
 * Main library exports
 *
 * This file provides centralized access to common utilities,
 * types, and services used throughout the application.
 */

// API utilities
export * from "./api/errors";
export * from "./api/responses";


// Authentication
export { adminAuth, type AuthResult } from "./auth/adminAuth";
export { hasPermission, type PermissionCode, type UserRole } from "./auth/core";

// Database types
export * from "./database.types";

// Supabase clients
export { createClient } from "./supabase/server";
export { createServiceClient } from "./supabase/server";

// Utilities
export { logger } from "./logger";
export { checkRateLimit } from "./rateLimit";

// Services
export { StudentService } from "./services/studentService";
export { ClassService } from "./services/classService";
export { CourseService } from "./services/courseService";

// Audit
export { type AuditLogEntry, logAuditAction } from "./auditLog";
