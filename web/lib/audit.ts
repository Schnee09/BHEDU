/**
 * Audit Trail System for BH-EDU
 * 
 * Tracks all sensitive operations for compliance and security
 */

import { logger } from './logger';

export interface AuditLogEntry {
  id?: string;
  timestamp: Date;
  userId: string;
  userEmail: string;
  userRole: string;
  action: string;
  resourceType: string;
  resourceId: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}

/**
 * Log an audit event
 */
export async function createAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) {
  const auditEntry: AuditLogEntry = {
    ...entry,
    timestamp: new Date(),
  };

  logger.audit(
    entry.action,
    {
      userId: entry.userId,
      userEmail: entry.userEmail,
      userRole: entry.userRole,
      resource: entry.resourceType,
    },
    {
      resourceId: entry.resourceId,
      changes: entry.changes,
      metadata: entry.metadata,
      ip: entry.ip,
      userAgent: entry.userAgent,
    }
  );

  return auditEntry;
}

/**
 * Audit trail action constants
 */
export const AuditActions = {
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  USER_PASSWORD_RESET: 'user.password_reset',
  USER_ROLE_CHANGED: 'user.role_changed',
  USER_STATUS_CHANGED: 'user.status_changed',
  USER_LOGIN: 'auth.login',
  USER_LOGOUT: 'auth.logout',
  USER_LOGIN_FAILED: 'auth.login_failed',
  STUDENT_CREATED: 'student.created',
  STUDENT_UPDATED: 'student.updated',
  STUDENT_DELETED: 'student.deleted',
  STUDENT_ENROLLED: 'student.enrolled',
  STUDENT_WITHDRAWN: 'student.withdrawn',
  CLASS_CREATED: 'class.created',
  CLASS_UPDATED: 'class.updated',
  CLASS_DELETED: 'class.deleted',
  GRADE_CREATED: 'grade.created',
  GRADE_UPDATED: 'grade.updated',
  GRADE_DELETED: 'grade.deleted',
  GRADE_OVERRIDE: 'grade.override',
  GRADES_PUBLISHED: 'grades.published',
  GRADES_EXPORTED: 'grades.exported',
  ATTENDANCE_MARKED: 'attendance.marked',
  ATTENDANCE_UPDATED: 'attendance.updated',
  ATTENDANCE_BULK_MARKED: 'attendance.bulk_marked',
  PAYMENT_CREATED: 'payment.created',
  PAYMENT_UPDATED: 'payment.updated',
  PAYMENT_REFUNDED: 'payment.refunded',
  INVOICE_CREATED: 'invoice.created',
  INVOICE_UPDATED: 'invoice.updated',
  INVOICE_CANCELLED: 'invoice.cancelled',
  PERMISSION_GRANTED: 'permission.granted',
  PERMISSION_REVOKED: 'permission.revoked',
  ROLE_ASSIGNED: 'role.assigned',
} as const;

export type AuditAction = typeof AuditActions[keyof typeof AuditActions];
