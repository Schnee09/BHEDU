/**
 * Consolidated validation schemas
 *
 * Re-exports all Zod schemas from their domain-specific files.
 * Aligned with BH-EDU v5.0 Architecture
 */

// ============================================
// COMMON SCHEMAS
// ============================================
export * from "./common";
export * from "./responses/common";

// ============================================
// DOMAIN REQUEST SCHEMAS
// ============================================

// Core Entities
export * from "./requests/student";
export * from "./requests/teacher";
export * from "./requests/user";
export * from "./requests/class";
export * from "./requests/subject";
export * from "./requests/course";
export * from "./requests/enrollment";

// Operations
export * from "./requests/attendance";
export * from "./requests/grade";

export * from "./requests/reports";
export * from "./requests/timetable";

// Specialized
export * from "./requests/analytics";
export * from "./requests/auth";
export * from "./requests/links";
export * from "./requests/finance";

// ============================================
// DOMAIN RESPONSE SCHEMAS
// ============================================

export * from "./responses/student";
export * from "./responses/user";
export * from "./responses/class";
export * from "./responses/subject";
export * from "./responses/course";
export * from "./responses/enrollment";
export * from "./responses/attendance";
export * from "./responses/grade";

export * from "./responses/analytics";
export * from "./responses/auth";
export * from "./responses/links";
