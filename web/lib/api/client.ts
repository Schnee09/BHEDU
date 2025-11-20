/**
 * API client utilities for making authenticated requests
 */

// Types
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface StudentListParams extends PaginationParams {
  search?: string;
}

export interface CreateStudentInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  address?: string;
  phoneNumber?: string;
  parentContact?: string;
}

export interface UpdateStudentInput {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  address?: string;
  phoneNumber?: string;
  parentContact?: string;
}

export interface Student {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  address?: string;
  phoneNumber?: string;
  parentContact?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentWithEnrollments extends Student {
  enrollments?: Array<{
    id: string;
    classId: string;
    enrollmentDate: string;
    status: string;
  }>;
}

/**
 * Fetch wrapper that:
 * - Includes credentials for same-origin cookie auth
 * - Attaches Supabase access token (Authorization: Bearer) when available
 */
export async function apiFetch(url: string, options?: RequestInit) {
  const baseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> | undefined),
  }
  let authorizationHeader: string | undefined

  // In the browser, try to attach the current Supabase access token
  if (typeof window !== 'undefined') {
    try {
      const { getAccessToken } = await import('@/lib/supabase/browser')
      const token = await getAccessToken()
      if (token && !('Authorization' in baseHeaders)) {
        authorizationHeader = `Bearer ${token}`
      }
    } catch {
      // no-op if browser client isn't available
    }
  }

  return fetch(url, {
    ...options,
    credentials: 'same-origin',
    headers: authorizationHeader
      ? { ...baseHeaders, Authorization: authorizationHeader }
      : baseHeaders,
  })
}

// ============================================================================
// Student API Functions
// ============================================================================

/**
 * Get list of students with pagination and search
 */
export async function getStudents(params?: StudentListParams): Promise<{
  data: Student[];
  pagination?: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
  if (params?.search) searchParams.set('search', params.search);

  const url = `/api/v1/students${searchParams.toString() ? `?${searchParams}` : ''}`;
  const response = await apiFetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch students');
  }

  return response.json();
}

/**
 * Get student by ID with enrollments
 */
export async function getStudentById(id: string): Promise<StudentWithEnrollments> {
  const response = await apiFetch(`/api/v1/students/${id}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch student');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Create a new student
 */
export async function createStudent(data: CreateStudentInput): Promise<Student> {
  const response = await apiFetch('/api/v1/students', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create student');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Update student information
 */
export async function updateStudent(id: string, data: UpdateStudentInput): Promise<Student> {
  const response = await apiFetch(`/api/v1/students/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update student');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Delete student (validates no active enrollments)
 */
export async function deleteStudent(id: string): Promise<void> {
  const response = await apiFetch(`/api/v1/students/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete student');
  }
}

/**
 * Enroll student in a class
 */
export async function enrollStudent(studentId: string, classId: string): Promise<any> {
  const response = await apiFetch(`/api/v1/students/${studentId}/enroll`, {
    method: 'POST',
    body: JSON.stringify({ classId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to enroll student');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Unenroll student from a class
 */
export async function unenrollStudent(studentId: string, classId: string): Promise<void> {
  const response = await apiFetch(`/api/v1/students/${studentId}/enroll`, {
    method: 'DELETE',
    body: JSON.stringify({ classId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to unenroll student');
  }
}

/**
 * Get student grades
 */
export async function getStudentGrades(studentId: string): Promise<any[]> {
  const response = await apiFetch(`/api/v1/students/${studentId}/grades`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch grades');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Get student attendance
 */
export async function getStudentAttendance(studentId: string): Promise<any[]> {
  const response = await apiFetch(`/api/v1/students/${studentId}/attendance`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch attendance');
  }

  const result = await response.json();
  return result.data;
}
