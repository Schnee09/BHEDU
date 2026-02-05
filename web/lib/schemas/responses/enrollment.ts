import { ApiSuccess } from "./common";

/**
 * Enrollment Entity Response
 * Matches the complete database object with joined relations
 */
export interface EnrollmentResponse {
    id: string;
    student_id: string;
    class_id: string;
    enrollment_date: string;
    status: "enrolled" | "withdrawn" | "completed" | "dropped";
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
        course_id?: string | null;
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
