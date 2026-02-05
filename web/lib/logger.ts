/**
 * Enhanced Structured Logger for BH-EDU
 *
 * Features:
 * - Structured logging with metadata
 * - Audit trail for sensitive operations
 * - Performance monitoring
 * - Context-aware logging
 * - Correlation IDs for request tracking
 * - Color-coded console output
 */

type LogLevel = "debug" | "info" | "warn" | "error" | "audit";

interface LogContext {
  userId?: string;
  userRole?: string;
  userEmail?: string;
  sessionId?: string;
  requestId?: string;
  correlationId?: string;
  ip?: string;
  action?: string;
  resource?: string;
  component?: string;
  [key: string]: unknown;
}

interface PerformanceMetrics {
  duration: number;
  startTime: number;
  endTime: number;
}

const isDev = process.env.NODE_ENV === "development";
const isBrowser = typeof window !== "undefined";

// ANSI color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
};

// Browser console colors
const browserColors = {
  debug: "color: #6B7280; font-weight: normal",
  info: "color: #3B82F6; font-weight: bold",
  warn: "color: #F59E0B; font-weight: bold",
  error: "color: #EF4444; font-weight: bold",
  audit: "color: #8B5CF6; font-weight: bold",
};

// Global context that persists across logs
let globalContext: LogContext = {};

/**
 * Generate a unique correlation ID
 */
function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Safely serialize values for logging
 */
function safeStringify(value: unknown): string {
  if (value === null || value === undefined) {
    return String(value);
  }

  if (
    typeof value === "string" || typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  if (value instanceof Error) {
    return `${value.name}: ${value.message}\n${value.stack || ""}`;
  }

  if (typeof value === "object") {
    // Special handling for Error-like objects that aren't instances of Error
    // but have name/message/stack (like DOMException / AbortError)
    const obj = value as Record<string, unknown>;
    if (
      obj.name && obj.message &&
      (obj.stack || obj.name === "AbortError" || obj.name === "DOMException")
    ) {
      return `${String(obj.name)}: ${String(obj.message)}${
        obj.stack ? `\n${String(obj.stack)}` : ""
      }`;
    }

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
function formatLog(
  level: LogLevel,
  msg: string,
  meta?: Record<string, unknown>,
): any[] {
  const timestamp = new Date().toISOString();
  const correlationId = globalContext.correlationId || generateCorrelationId();

  // Merge metadata with global context
  const combinedContext = {
    ...globalContext,
    correlationId,
    ...meta,
  };

  // Safely serialize context
  const safeMeta: Record<string, string> = {};
  if (combinedContext && Object.keys(combinedContext).length > 0) {
    for (const [key, value] of Object.entries(combinedContext)) {
      if (value !== undefined) {
        safeMeta[key] = safeStringify(value);
      }
    }
  }

  if (isDev) {
    if (isBrowser) {
      // Browser formatted output
      const color = browserColors[level] || browserColors.info;
      const metaOutput = Object.keys(safeMeta).length > 0 ? safeMeta : "";

      // For errors in browser, we also append a string version of meta to the main message
      // so it shows up in log aggregators/terminals that only take the first argument
      const msgWithMeta = level === "error" && Object.keys(safeMeta).length > 0
        ? `${msg} ${JSON.stringify(safeMeta)}`
        : msg;

      return [
        `%c[${level.toUpperCase()}]%c ${timestamp} %c[${
          correlationId.slice(-6)
        }]%c ${msgWithMeta}`,
        color,
        "color: #9CA3AF",
        "color: #8B5CF6; font-weight: bold",
        "color: inherit",
        metaOutput,
      ].filter(Boolean);
    } else {
      // Terminal formatted output
      const levelColor = level === "error"
        ? colors.red
        : level === "warn"
        ? colors.yellow
        : level === "audit"
        ? colors.magenta
        : colors.blue;

      const metaStr = Object.keys(safeMeta).length > 0
        ? `${colors.gray}${JSON.stringify(safeMeta, null, 2)}${colors.reset}`
        : "";

      return [
        `${levelColor}${colors.bright}[${level.toUpperCase()}]${colors.reset} ${colors.gray}${timestamp}${colors.reset} ${colors.cyan}[${
          correlationId.slice(
            -6,
          )
        }]${colors.reset} ${msg}\n${metaStr}`,
      ];
    }
  } else {
    // JSON format for production (log aggregation)
    return [JSON.stringify({ level, msg, timestamp, ...safeMeta })];
  }
}

/**
 * Main logger object
 */
export const logger = {
  /**
   * Set global log context
   */
  setContext: (context: LogContext) => {
    globalContext = { ...globalContext, ...context };
  },

  /**
   * Clear global log context
   */
  clearContext: () => {
    globalContext = {};
  },

  /**
   * DEBUG level - Development only
   */
  debug: (msg: string, meta?: Record<string, unknown>) => {
    if (!isDev) return;
    const args = formatLog("debug", msg, meta);
    console.debug(...args);
  },

  /**
   * INFO level - General information
   */
  info: (msg: string, meta?: Record<string, unknown>) => {
    const args = formatLog("info", msg, meta);
    console.log(...args);
  },

  /**
   * WARN level - Warnings
   */
  warn: (msg: string, meta?: Record<string, unknown>) => {
    const args = formatLog("warn", msg, meta);
    console.warn(...args);
  },

  /**
   * ERROR level - Errors with stack traces
   */
  error: (
    msg: string,
    error?: Error | unknown,
    meta?: Record<string, unknown>,
  ) => {
    let errorData: Record<string, unknown> = {};

    if (error instanceof Error) {
      errorData = {
        errorName: error.name,
        errorMessage: error.message,
        stack: error.stack,
      };
    } else if (error !== null && error !== undefined) {
      errorData = { error: safeStringify(error) };
    }

    const errorMessage = (errorData.errorMessage as string) ||
      (errorData.error as string) || "";
    if (errorMessage.includes("Rate limit exceeded")) return;

    const args = formatLog("error", msg, { ...errorData, ...meta });
    console.error(...args);
  },

  /**
   * AUDIT level - Security and compliance audit trail
   */
  audit: (
    action: string,
    context: LogContext,
    details?: Record<string, unknown>,
  ) => {
    const args = formatLog("audit", `AUDIT: ${action}`, {
      ...context,
      ...details,
      auditTimestamp: Date.now(),
    });

    console.log(...args);
  },

  /**
   * Measure and log performance
   */
  async performance<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: LogContext,
  ): Promise<T> {
    const startTime = Date.now();

    try {
      const result = await fn();
      const endTime = Date.now();
      const duration = endTime - startTime;

      const metrics: PerformanceMetrics = { duration, startTime, endTime };

      if (duration > 1000) {
        logger.warn(`SLOW: ${operation} took ${duration}ms`, {
          ...metrics,
          ...context,
        });
      } else if (isDev) {
        logger.debug(`Performance: ${operation}`, {
          ...metrics,
          ...context,
          duration,
        });
      }

      return result;
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      logger.error(
        `${operation} FAILED after ${duration}ms`,
        error as Error,
        context,
      );

      throw error;
    }
  },
};

/**
 * Convenience functions for common logging scenarios
 */

export const logRequest = (
  method: string,
  path: string,
  context?: LogContext,
) => {
  logger.info(`${method} ${path}`, { method, path, ...context });
};

export const logResponse = (
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  context?: LogContext,
) => {
  const level = statusCode >= 500
    ? "error"
    : statusCode >= 400
    ? "warn"
    : "info";
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
  duration?: number,
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
  event: "login" | "logout" | "signup" | "password_reset" | "failed_login",
  context: LogContext,
) => {
  logger.info(`Auth: ${event}`, context);
  logger.audit(`User ${event}`, context, { event });
};

export const logSecurityEvent = (
  event: string,
  severity: "low" | "medium" | "high" | "critical",
  details: Record<string, unknown>,
  context?: LogContext,
) => {
  const level = severity === "critical" || severity === "high"
    ? "error"
    : "warn";
  logger[level](`SECURITY [${severity.toUpperCase()}]: ${event}`, {
    ...details,
    ...context,
  });
  logger.audit(`Security: ${event}`, context || {}, { severity, ...details });
};

export const logAdminAction = (
  action: string,
  resourceType: string,
  resourceId: string,
  context: LogContext,
  changes?: Record<string, unknown>,
) => {
  logger.audit(`Admin action: ${action}`, context, {
    action,
    resourceType,
    resourceId,
    changes,
  });
};
