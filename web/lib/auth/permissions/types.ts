/**
 * Permission System Types
 * Aligned with BH-EDU v5.0 Architecture
 */

/**
 * Actions users can perform
 */
export type Action =
    | "create"
    | "read"
    | "update"
    | "delete"
    | "manage" // All actions
    | "export"
    | "import"
    | "approve"
    | "reject";

/**
 * Resources in the system
 */
export type Subject =
    | "User"
    | "Student"
    | "Teacher"
    | "Class"
    | "Grade"
    | "Attendance"
    | "Subject"
    | "Enrollment"
    | "Invoice"
    | "Payment"
    | "Report"
    | "Setting"
    | "Audit"
    | "all"; // All subjects

/**
 * Ability rule definition
 */
export interface AbilityRule {
    action: Action | Action[];
    subject: Subject | Subject[];
    conditions?: Record<string, any>;
    fields?: string[]; // Field-level permissions
    inverted?: boolean; // For "cannot" rules
    reason?: string; // Why this rule exists
}

/**
 * User context for permission checks
 */
export interface PermissionContext {
    userId: string;
    role: import("@/lib/auth/core").UserRole;
    classIds?: string[]; // Classes user teaches/attends
    departmentId?: string;
    metadata?: Record<string, any>;
}

/**
 * Condition operators for matching
 */
export interface ConditionOperators {
    $eq?: any;
    $ne?: any;
    $in?: any[];
    $nin?: any[];
    $gt?: number;
    $gte?: number;
    $lt?: number;
    $lte?: number;
}
