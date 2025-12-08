/**
 * Consolidated validation schemas
 * 
 * Re-exports all Zod schemas from their domain-specific files.
 */

// Student schemas
export {
  createStudentSchema,
  updateStudentSchema,
  studentQuerySchema,
  createGuardianSchema,
  importStudentsSchema,
} from './students';

// Grade schemas
export {
  createGradeSchema,
  updateGradeSchema,
  bulkGradeEntrySchema,
  createAssignmentSchema,
  gradeQuerySchema,
  vietnameseGradeSchema,
  conductGradeSchema,
} from './grades';

// Finance schemas
export {
  createPaymentSchema,
  updatePaymentSchema,
  createInvoiceSchema,
  createFeeTypeSchema,
  studentAccountQuerySchema,
  createPaymentMethodSchema,
  financialReportQuerySchema,
  bulkPaymentAllocationSchema,
} from './finance';

// Auth schemas
export {
  loginSchema,
  signupSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  changePasswordSchema,
  createUserSchema,
  updateUserSchema,
  updateProfileSchema,
} from './auth';
