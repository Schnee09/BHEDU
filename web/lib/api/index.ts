/**
 * API utilities barrel export
 *
 * Provides centralized access to all API-related utilities.
 */

// Error handling
export {
  AppError,
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  handleApiError,
  NotFoundError,
  RateLimitError,
  ValidationError,
} from './errors';

// Response helpers
export {
  badRequest,
  conflict,
  created,
  forbidden,
  noContent,
  notFound,
  paginated,
  serverError,
  success,
  unauthorized,
} from './responses';

// Validation schemas
export {
  courseIdSchema,
  createAssignmentSchema,
  createClassSchema,
  createCourseSchema,
  createGradeSchema,
  createStudentSchema,
  emailSchema,
  paginationSchema,
  phoneSchema,
  updateAssignmentSchema,
  updateClassSchema,
  updateCourseSchema,
  updateGradeSchema,
  updateStudentSchema,
  uuidSchema,
} from '@/lib/schemas';

// Middleware
export {
  type AuthenticatedHandler,
  type RouteHandler,
  withAuth,
  withErrorHandler,
} from './middleware';

// API Handler Factory (NEW)
export {
  type ApiContext,
  apiPaginated,
  apiSuccess,
  type ApiUser,
  createApiHandler,
  createGetHandler,
  type HandlerConfig,
} from './apiHandler';

// API Versioning
export { API_VERSION, getVersionHeaders, withVersionHeaders } from './apiVersion';

// API Handler Types
export * from './types';
export type { ApiPaginatedResponse as PaginatedResponse } from './types';
