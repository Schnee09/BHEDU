import { ApiSuccess } from './common';

/**
 * Enrollment Entity Response
 * Matches the complete database object with joined relations
 */
export interface EnrollmentResponse {
  id: string;
  student_id: string;
  class_id: string;
  enrollment_date: string;
  status: 'enrolled' | 'withdrawn' | 'completed' | 'dropped' | 'transferred';
  end_date?: string | null;
  status_reason?: string | null;
  ended_at?: string | null;
  ended_by?: string | null;
  previous_enrollment_id?: string | null;
  source_system?: string | null;
  source_key?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;

  // Relations
  student?: {
    id: string;
    first_name: string;
    last_name: string;
    full_name: string;
    email: string;
    student_code: string;
  };
  class?: {
    id: string;
    name: string;
    subject_id?: string | null;
    teacher_id?: string | null;
  };
}

/**
 * List Response
 */
export type EnrollmentListResponse = ApiSuccess<EnrollmentResponse[]>;

/**
 * Single Item Response
 */
export type EnrollmentItemResponse = ApiSuccess<EnrollmentResponse>;
