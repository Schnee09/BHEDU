/**
 * Student Domain Types
 * Strict type definitions for student-related data
 */

export interface Student {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: 'student';
  phone?: string;
  address?: string;
  date_of_birth?: string;
  student_code?: string;
  grade_level?: number;
  gender?: 'male' | 'female' | 'other';
  status?: 'active' | 'inactive' | 'graduated' | 'transferred';
  is_active: boolean;
  photo_url?: string;
  enrollment_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface StudentQueryParams {
  search?: string;
  page?: number;
  limit?: number;
  classId?: string;
  status?: Student['status'];
  grade_level?: string;
  gender?: string;
}

export interface StudentListResult {
  students: Student[];
  total: number;
  statistics?: StudentStatistics | null;
}

export interface StudentStatistics {
  totalActive: number;
  totalInactive: number;
  byGradeLevel: Record<number, number>;
}

export interface CreateStudentPayload {
  email: string;
  full_name: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  student_code?: string;
  grade_level?: number;
  gender?: 'male' | 'female' | 'other';
}
