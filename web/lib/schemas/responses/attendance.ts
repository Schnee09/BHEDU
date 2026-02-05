import { ApiSuccess } from "./common";

/**
 * Attendance Entity Response
 * Matches the database record with joined relations
 */
export interface AttendanceResponse {
    id: string;
    student_id: string;
    class_id: string;
    date: string;
    status: "present" | "absent" | "late" | "excused";
    notes?: string | null;
    excused_reason?: string | null;
    created_at: string;
    updated_at: string;

    // Relations
    student?: {
        id: string;
        full_name: string;
        student_code: string;
    };
    class?: {
        id: string;
        name: string;
    };
}

/**
 * List Response
 */
export type AttendanceListResponse = ApiSuccess<AttendanceResponse[]>;

/**
 * Single Item Response
 */
export type AttendanceItemResponse = ApiSuccess<AttendanceResponse>;
