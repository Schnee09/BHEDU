// Simple structured logger for production
export const logger = {
  info: (msg: string, meta?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify({ level: 'info', msg, ...meta, timestamp: new Date().toISOString() }))
    } else {
      console.log(`[INFO] ${msg}`, meta || '')
    }
  },
  warn: (msg: string, meta?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'production') {
      console.warn(JSON.stringify({ level: 'warn', msg, ...meta, timestamp: new Date().toISOString() }))
    } else {
      console.warn(`[WARN] ${msg}`, meta || '')
    }
  },
  error: (msg: string, error?: Error | unknown, meta?: Record<string, unknown>) => {
    const err = error instanceof Error ? { message: error.message, stack: error.stack } : { error }
    if (process.env.NODE_ENV === 'production') {
      console.error(JSON.stringify({ level: 'error', msg, ...err, ...meta, timestamp: new Date().toISOString() }))
    } else {
      console.error(`[ERROR] ${msg}`, err, meta || '')
    }
  },
}
