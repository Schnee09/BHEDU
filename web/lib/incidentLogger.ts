/**
 * BH-EDU Incident & Error Tracking Service
 *
 * Provides centralized error translation, Correlation ID generation,
 * and incident reporting for Administrators.
 */

import { logger } from '@/lib/logger';

export interface SystemIncident {
  id: string; // e.g. INC-K8F92A
  timestamp: string;
  type: 'CRASH' | 'API_TIMEOUT' | 'AUTH_FAILURE' | 'PERMISSION_DENIED' | 'DATABASE_ERROR';
  message: string;
  userEmail?: string | null;
  userRole?: string | null;
  url?: string;
  status: 'active' | 'investigating' | 'resolved';
  metadata?: Record<string, unknown>;
}

// In-memory buffer of recent incidents for quick admin diagnostic lookup
const RECENT_INCIDENTS: SystemIncident[] = [];
const MAX_INCIDENTS = 50;

/**
 * Generate a concise, human-readable Correlation ID
 */
export function generateCorrelationId(prefix = 'INC'): string {
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${randomPart}`;
}

/**
 * Translate raw database and network errors into user-friendly Vietnamese messages
 */
export function translateErrorMessage(rawError: unknown): {
  userMessage: string;
  isRetryable: boolean;
} {
  const errorStr = String(
    typeof rawError === 'object' && rawError !== null && 'message' in rawError
      ? (rawError as any).message
      : rawError
  );

  // Network & Timeout Errors
  if (
    errorStr.includes('ConnectTimeoutError') ||
    errorStr.includes('UND_ERR_CONNECT_TIMEOUT') ||
    errorStr.includes('Failed to fetch') ||
    errorStr.includes('NetworkError') ||
    errorStr.includes('fetch failed')
  ) {
    return {
      userMessage:
        'Đường truyền mạng bị gián đoạn hoặc máy chủ phản hồi chậm. Vui lòng kiểm tra kết nối mạng và thử lại.',
      isRetryable: true,
    };
  }

  // Authentication & Session Errors
  if (
    errorStr.includes('JWT') ||
    errorStr.includes('AuthSessionMissingError') ||
    errorStr.includes('Not authenticated') ||
    errorStr.includes('invalid_grant')
  ) {
    return {
      userMessage:
        'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại để tiếp tục.',
      isRetryable: false,
    };
  }

  // Duplicate / Unique Constraint Violations
  if (errorStr.includes('duplicate key') || errorStr.includes('23505')) {
    if (errorStr.includes('email')) {
      return {
        userMessage: 'Địa chỉ Email này đã được đăng ký trong hệ thống.',
        isRetryable: false,
      };
    }
    if (errorStr.includes('student_code') || errorStr.includes('code')) {
      return {
        userMessage: 'Mã số này đã tồn tại, vui lòng chọn hoặc nhập mã khác.',
        isRetryable: false,
      };
    }
    return {
      userMessage: 'Dữ liệu này đã tồn tại trong hệ thống, không thể tạo trùng lặp.',
      isRetryable: false,
    };
  }

  // Foreign Key Violations
  if (errorStr.includes('foreign key constraint') || errorStr.includes('23503')) {
    return {
      userMessage:
        'Không thể xóa hoặc thay đổi vì dữ liệu này đang được liên kết với lớp học, bảng điểm hoặc học phí.',
      isRetryable: false,
    };
  }

  // Permission & RLS Violations
  if (errorStr.includes('permission denied') || errorStr.includes('42501')) {
    return {
      userMessage: 'Bạn không có đủ quyền hạn để thực hiện thao tác này.',
      isRetryable: false,
    };
  }

  // Default fallback
  return {
    userMessage: 'Đã có sự cố xảy ra trong quá trình xử lý. Vui lòng thử lại sau ít phút.',
    isRetryable: true,
  };
}

/**
 * Record a system incident for admin inspection
 */
export function recordIncident(
  incident: Omit<SystemIncident, 'id' | 'timestamp' | 'status'>
): SystemIncident {
  const newIncident: SystemIncident = {
    ...incident,
    id: generateCorrelationId('INC'),
    timestamp: new Date().toISOString(),
    status: 'active',
  };

  RECENT_INCIDENTS.unshift(newIncident);
  if (RECENT_INCIDENTS.length > MAX_INCIDENTS) {
    RECENT_INCIDENTS.pop();
  }

  logger.error(
    `[IncidentRecorded] ${newIncident.id} (${newIncident.type}): ${newIncident.message}`,
    {
      incident: newIncident,
    }
  );

  return newIncident;
}

/**
 * Get recent system incidents (For Admin Health & Monitoring)
 */
export function getRecentIncidents(): SystemIncident[] {
  return [...RECENT_INCIDENTS];
}
