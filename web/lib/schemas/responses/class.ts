import { ApiSuccess } from "./common";

/**
 * Class Entity Response
 */
export interface ClassResponse {
    id: string;
    name: string;
    code?: string | null;
    description?: string | null;
    teacher_id?: string | null;
    subject_id?: string | null;
    room?: string | null;
    schedule?: string | null;
    capacity?: number | null;
    academic_year_id?: string | null;
    grade_level?: string | null;
    status: "active" | "inactive" | "completed";
    created_at: string;
    updated_at: string;

    // Relations
    teacher?: {
        id: string;
        first_name: string;
        last_name: string;
        full_name: string;
        email: string;
    } | null;
    subject?: {
        id: string;
        name: string;
        code: string;
    } | null;

    // Computed
    _count?: {
        enrollments: number;
    };
    enrollment_count?: number;
}

/**
 * List Response
 */
export type ClassListResponse = ApiSuccess<ClassResponse[]>;

/**
 * Single Item Response
 */
export type ClassItemResponse = ApiSuccess<ClassResponse>;
