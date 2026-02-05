/**
 * Consolidated validation schemas
 *
 * Re-exports all Zod schemas from their domain-specific files.
 */

// Student schemas (Moved to requests/student)

// Grade schemas
export {
  bulkGradeEntrySchema,
  conductGradeSchema,
  createAssignmentSchema,
  createGradeSchema,
  gradeQuerySchema,
  updateAssignmentSchema,
  updateGradeSchema,
  vietnameseGradeSchema,
} from "./grades";

// Finance schemas
export {
  bulkPaymentAllocationSchema,
  createFeeTypeSchema,
  createInvoiceSchema,
  createPaymentMethodSchema,
  createPaymentSchema,
  financialReportQuerySchema,
  studentAccountQuerySchema,
  updatePaymentSchema,
} from "./finance";

// Analytics schemas
export { type AnalyticsQuery, analyticsQuerySchema } from "./analytics";

// Course schemas

// Course schemas
export {
  courseIdSchema,
  type CourseQueryInput,
  courseQuerySchema,
  type CreateCourseInput,
  createCourseSchema,
  type UpdateCourseInput,
  updateCourseSchema,
} from "./course";

// Auth schemas
export {
  changePasswordSchema,
  loginSchema,
  studentLookupSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  signupSchema,
} from "./auth";

// Link schemas
export {
  parentStudentLinkSchema,
  updateLinkStatusSchema,
  type ParentStudentLinkInput,
  type UpdateLinkStatusInput,
} from "./links";

// Common schemas

// Common schemas
export {
  // Class schemas (Moved to requests/class)

  // Query helpers
  createListQuerySchema,
  createSortSchema,
  createSubjectSchema,
  updateSubjectSchema,
  type UpdateSubjectInput,
  dateStringSchema,
  emailSchema,
  // Enrollment schemas (Moved to requests/enrollment)

  enrollmentStatusSchema,
  genderSchema,
  // New enum schemas (Phase 2)
  gradeComponentSchema,
  gradeLevelSchema,
  invoiceStatusSchema,
  notesSchema,
  optionalDateStringSchema,
  optionalEmailSchema,
  optionalPhoneSchema,
  optionalUuidSchema,
  // Pagination
  paginationSchema,
  paginationWithDefaults,
  paymentStatusSchema,
  phoneSchema,
  semesterSchema,
  // Sorting
  sortOrderSchema,
  studentStatusSchema,
  // Subject schemas
  subjectQuerySchema,
  // Common enums
  userRoleSchema,
  // Common fields
  uuidSchema,
} from "./common";

// ============================================
// NEW CONSOLIDATED SCHEMAS (Phase 2)
// ============================================

// Requests
export {
  createGuardianSchema,
  createStudentSchema,
  importStudentsSchema,
  studentQuerySchema,
  updateStudentSchema,
  type CreateStudentInput,
  type StudentQuery,
  type UpdateStudentInput,
} from "./requests/student";
export * from "./requests/grade";
export * from "./requests/class";
export * from "./requests/enrollment";
export {
  attendanceQuerySchema,
  attendanceRecordSchema,
  bulkAttendanceSchema,
  createAttendanceSchema,
  updateAttendanceSchema,
  type AttendanceQueryInput,
  type BulkAttendanceInput,
  type CreateAttendanceInput,
  type UpdateAttendanceInput,
} from "./requests/attendance";
export * from "./requests/user";

// Responses
export * from "./responses/common";
export * from "./responses/student";
export * from "./responses/grade";
export * from "./responses/class";
export * from "./responses/enrollment";
export * from "./responses/attendance";
export * from "./responses/user";
