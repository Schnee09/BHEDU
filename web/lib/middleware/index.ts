/**
 * Middleware Module Index
 * 
 * Re-exports all middleware utilities for clean imports
 */

export {
  // Middleware types
  type Role,
  type MiddlewareContext,
  type Handler,
  type Middleware,
  
  // Individual middlewares
  withRateLimit,
  withAuth,
  withAdminAuth,
  withStaffAuth,
  withAuditLog,
  
  // Composition utility
  withMiddleware,
  
  // Presets
  middlewarePresets
} from './withAuth'
