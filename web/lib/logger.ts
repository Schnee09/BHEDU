/**
 * Enhanced Structured Logger for BH-EDU
 * 
 * Features:
 * - Structured logging with metadata
 * - Audit trail for sensitive operations
 * - Performance monitoring
 * - Context-aware logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'audit';

interface LogContext {
  userId?: string;
  userRole?: string;
  userEmail?: string;
  sessionId?: string;
  requestId?: string;
  ip?: string;
  action?: string;
  resource?: string;
  [key: string]: unknown;
}

interface PerformanceMetrics {
  duration: number;
  startTime: number;
  endTime: number;
}

const isDev = process.env.NODE_ENV === 'development';

/**
 * Safely serialize values for logging
 */
function safeStringify(value: unknown): string {
  if (value === null || value === undefined) {
    return String(value);
  }
  
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  
  if (value instanceof Error) {
    return `${value.name}: ${value.message}`;
  }
  
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      // Fallback for circular references or non-serializable objects
      return Object.prototype.toString.call(value);
    }
  }
  
  return String(value);
}

/**
 * Format log output based on environment
 */
function formatLog(level: LogLevel, msg: string, meta?: Record<string, unknown>): string {
  const timestamp = new Date().toISOString();
  
  // Safely serialize metadata
  const safeMeta: Record<string, string> = {};
  if (meta && Object.keys(meta).length > 0) {
    for (const [key, value] of Object.entries(meta)) {
      safeMeta[key] = safeStringify(value);
    }
  }
  
  if (isDev) {
    // Pretty format for development
    const metaStr = Object.keys(safeMeta).length > 0 ? JSON.stringify(safeMeta, null, 2) : '';
    return `[${level.toUpperCase()}] ${timestamp} - ${msg}\n${metaStr}`;
  } else {
    // JSON format for production (log aggregation)
    return JSON.stringify({ level, msg, timestamp, ...safeMeta });
  }
}

/**
 * Main logger object
 */
export const logger = {
  /**
   * DEBUG level - Development only
   */
  debug: (msg: string, meta?: Record<string, unknown>) => {
    if (!isDev) return;
    console.debug(formatLog('debug', msg, meta));
  },

  /**
   * INFO level - General information
   */
  info: (msg: string, meta?: Record<string, unknown>) => {
    console.log(formatLog('info', msg, meta));
  },

  /**
   * WARN level - Warnings
   */
  warn: (msg: string, meta?: Record<string, unknown>) => {
    console.warn(formatLog('warn', msg, meta));
  },

  /**
   * ERROR level - Errors with stack traces
   */
  error: (msg: string, error?: Error | unknown, meta?: Record<string, unknown>) => {
    let errorData: Record<string, unknown> = {};
    
    if (error instanceof Error) {
      errorData = {
        errorName: error.name,
        errorMessage: error.message,
        stack: error.stack
      };
    } else if (error !== null && error !== undefined) {
      // For non-Error objects, safely convert to string
      errorData = { error: safeStringify(error) };
    }
    
    // Skip logging rate limit errors - they're expected and handled gracefully
    const errorMessage = (errorData.errorMessage as string) || (errorData.error as string) || '';
    if (errorMessage.includes('Rate limit exceeded')) {
      return;
    }
    
    console.error(formatLog('error', msg, { ...errorData, ...meta }));
  },

  /**
   * AUDIT level - Security and compliance audit trail
   * Always logged, never disabled
   */
  audit: (
    action: string,
    context: LogContext,
    details?: Record<string, unknown>
  ) => {
    const auditLog = formatLog('audit', `AUDIT: ${action}`, {
      ...context,
      ...details,
      auditTimestamp: Date.now(),
    });
    
    console.log(auditLog);
    
    // In production, send to dedicated audit log service/database
    // This should be immutable and stored long-term for compliance
  },

  /**
   * Measure and log performance
   */
  async performance<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: LogContext
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await fn();
      const endTime = Date.now();
      const duration = endTime - startTime;

      const metrics: PerformanceMetrics = { duration, startTime, endTime };
      
      if (duration > 1000) {
        // Warn if operation took more than 1 second
        logger.warn(`SLOW: ${operation} took ${duration}ms`, { ...metrics, ...context });
      } else if (isDev) {
        logger.debug(`Performance: ${operation}`, { ...metrics, ...context });
      }
      
      return result;
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      logger.error(
        `${operation} FAILED after ${duration}ms`,
        error as Error,
        context
      );
      
      throw error;
    }
  },
};

/**
 * Convenience functions for common logging scenarios
 */

export const logRequest = (method: string, path: string, context?: LogContext) => {
  logger.info(`${method} ${path}`, { method, path, ...context });
};

export const logResponse = (
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  context?: LogContext
) => {
  const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
  logger[level](`${method} ${path} - ${statusCode} (${duration}ms)`, {
    method,
    path,
    statusCode,
    duration,
    ...context,
  });
};

export const logDatabaseQuery = (
  table: string,
  operation: string,
  recordCount?: number,
  duration?: number
) => {
  if (isDev) {
    logger.debug(`DB Query: ${operation} on ${table}`, {
      table,
      operation,
      recordCount,
      duration,
    });
  }
};

export const logAuthEvent = (
  event: 'login' | 'logout' | 'signup' | 'password_reset' | 'failed_login',
  context: LogContext
) => {
  logger.info(`Auth: ${event}`, context);
  logger.audit(`User ${event}`, context, { event });
};

export const logSecurityEvent = (
  event: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  details: Record<string, unknown>,
  context?: LogContext
) => {
  const level = severity === 'critical' || severity === 'high' ? 'error' : 'warn';
  logger[level](`SECURITY [${severity.toUpperCase()}]: ${event}`, { ...details, ...context });
  logger.audit(`Security: ${event}`, context || {}, { severity, ...details });
};

export const logAdminAction = (
  action: string,
  resourceType: string,
  resourceId: string,
  context: LogContext,
  changes?: Record<string, unknown>
) => {
  logger.audit(`Admin action: ${action}`, context, {
    action,
    resourceType,
    resourceId,
    changes,
  });
};
