/**
 * API utilities barrel export
 * 
 * Provides centralized access to all API-related utilities.
 */

// Error handling
export {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  handleApiError,
} from './errors';

// Response helpers
export {
  success,
  created,
  noContent,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  serverError,
  paginated,
  type ApiResponse,
  type PaginatedResponse,
} from './responses';

// Validation schemas
export {
  uuidSchema,
  paginationSchema,
  emailSchema,
  phoneSchema,
  createCourseSchema,
  updateCourseSchema,
  courseIdSchema,
  createClassSchema,
  updateClassSchema,
  createStudentSchema,
  updateStudentSchema,
  createAssignmentSchema,
  updateAssignmentSchema,
  createGradeSchema,
  updateGradeSchema,
} from './schemas';

// Middleware
export {
  withErrorHandler,
  withAuth,
  type RouteHandler,
  type AuthenticatedHandler,
} from './middleware';
