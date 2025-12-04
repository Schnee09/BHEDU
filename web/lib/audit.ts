/**
 * Audit Trail System for BH-EDU
 * 
 * Tracks all sensitive operations for compliance and security
 * - User actions (create, update, delete)
 * - Grade changes
 * - Financial transactions
 * - Permission changes
 * - Authentication events
 */

import { logger, logAdminAction } from './logger';

export interface AuditLogEntry {
  id?: string;
  timestamp: Date;
  userId: string;
  userEmail: string;
  userRole: string;
  action: string;
  resourceType: string;
  resourceId: string;
  changes?: Record<string, { old: any; new: any }>;
  metadata?: Record<string, any>;
  ip?: string;
  userAgent?: string;
}

/**
 * Log an audit event
 * In a real system, this would write to a database audit_log table
 */
export async function createAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) {
  const auditEntry: AuditLogEntry = {
    ...entry,
    timestamp: new Date(),
  };

  // Log to console/external service
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

  // In production, write to database:
  // await supabase.from('audit_logs').insert(auditEntry);

  return auditEntry;
}

/**
 * Audit trail for user management actions
 */
export const AuditActions = {
  // User Management
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  USER_PASSWORD_RESET: 'user.password_reset',
  USER_ROLE_CHANGED: 'user.role_changed',
  USER_STATUS_CHANGED: 'user.status_changed',
  
  // Authentication
  USER_LOGIN: 'auth.login',
  USER_LOGOUT: 'auth.logout',
  USER_LOGIN_FAILED: 'auth.login_failed',
  
  // Student Management
  STUDENT_CREATED: 'student.created',
  STUDENT_UPDATED: 'student.updated',
  STUDENT_DELETED: 'student.deleted',
  STUDENT_ENROLLED: 'student.enrolled',
  STUDENT_UNENROLLED: 'student.unenrolled',
  
  // Grade Management
  GRADE_CREATED: 'grade.created',
  GRADE_UPDATED: 'grade.updated',
  GRADE_DELETED: 'grade.deleted',
  GRADE_OVERRIDDEN: 'grade.overridden',
  
  // Attendance
  ATTENDANCE_MARKED: 'attendance.marked',
  ATTENDANCE_UPDATED: 'attendance.updated',
  ATTENDANCE_DELETED: 'attendance.deleted',
  
  // Finance
  INVOICE_CREATED: 'finance.invoice_created',
  INVOICE_UPDATED: 'finance.invoice_updated',
  INVOICE_DELETED: 'finance.invoice_deleted',
  PAYMENT_RECORDED: 'finance.payment_recorded',
  PAYMENT_UPDATED: 'finance.payment_updated',
  PAYMENT_DELETED: 'finance.payment_deleted',
  
  // Class Management
  CLASS_CREATED: 'class.created',
  CLASS_UPDATED: 'class.updated',
  CLASS_DELETED: 'class.deleted',
  
  // Assignment Management
  ASSIGNMENT_CREATED: 'assignment.created',
  ASSIGNMENT_UPDATED: 'assignment.updated',
  ASSIGNMENT_DELETED: 'assignment.deleted',
};

/**
 * Helper to track changes between old and new values
 */
export function trackChanges<T extends Record<string, any>>(
  oldData: T,
  newData: T,
  fields: (keyof T)[]
): Record<string, { old: any; new: any }> {
  const changes: Record<string, { old: any; new: any }> = {};
  
  for (const field of fields) {
    if (oldData[field] !== newData[field]) {
      changes[field as string] = {
        old: oldData[field],
        new: newData[field],
      };
    }
  }
  
  return changes;
}

/**
 * Middleware to automatically log API requests
 */
export function createAuditMiddleware(
  action: string,
  resourceType: string
) {
  return async (
    userId: string,
    userEmail: string,
    userRole: string,
    resourceId: string,
    changes?: Record<string, { old: any; new: any }>,
    metadata?: Record<string, any>
  ) => {
    await createAuditLog({
      userId,
      userEmail,
      userRole,
      action,
      resourceType,
      resourceId,
      changes,
      metadata,
    });
  };
}

/**
 * Helper functions for common audit scenarios
 */

export async function auditUserCreation(
  adminId: string,
  adminEmail: string,
  newUserId: string,
  newUserData: { email: string; role: string; full_name: string }
) {
  await createAuditLog({
    userId: adminId,
    userEmail: adminEmail,
    userRole: 'admin',
    action: AuditActions.USER_CREATED,
    resourceType: 'user',
    resourceId: newUserId,
    metadata: {
      newUserEmail: newUserData.email,
      newUserRole: newUserData.role,
      newUserName: newUserData.full_name,
    },
  });
}

export async function auditUserUpdate(
  adminId: string,
  adminEmail: string,
  targetUserId: string,
  oldData: Record<string, any>,
  newData: Record<string, any>,
  changedFields: string[]
) {
  const changes = trackChanges(oldData, newData, changedFields);
  
  await createAuditLog({
    userId: adminId,
    userEmail: adminEmail,
    userRole: 'admin',
    action: AuditActions.USER_UPDATED,
    resourceType: 'user',
    resourceId: targetUserId,
    changes,
  });
}

export async function auditGradeChange(
  teacherId: string,
  teacherEmail: string,
  studentId: string,
  assignmentId: string,
  oldGrade: number | null,
  newGrade: number,
  reason?: string
) {
  await createAuditLog({
    userId: teacherId,
    userEmail: teacherEmail,
    userRole: 'teacher',
    action: oldGrade === null ? AuditActions.GRADE_CREATED : AuditActions.GRADE_UPDATED,
    resourceType: 'grade',
    resourceId: `${studentId}:${assignmentId}`,
    changes: {
      grade: {
        old: oldGrade,
        new: newGrade,
      },
    },
    metadata: {
      studentId,
      assignmentId,
      reason,
    },
  });
}

export async function auditFinancialTransaction(
  userId: string,
  userEmail: string,
  action: string,
  transactionType: 'invoice' | 'payment',
  transactionId: string,
  amount: number,
  studentId: string
) {
  await createAuditLog({
    userId,
    userEmail,
    userRole: 'admin',
    action,
    resourceType: transactionType,
    resourceId: transactionId,
    metadata: {
      amount,
      studentId,
      transactionType,
    },
  });
}

/**
 * Database migration SQL for audit_logs table
 * Run this in Supabase to create the table
 */
export const AUDIT_LOGS_MIGRATION_SQL = `
-- Create audit_logs table for compliance
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  user_email TEXT NOT NULL,
  user_role TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  changes JSONB,
  metadata JSONB,
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for fast querying
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view all audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- System can insert audit logs (no one can update/delete)
CREATE POLICY "System can insert audit logs"
  ON audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE audit_logs IS 'Immutable audit trail for compliance and security';
`;
