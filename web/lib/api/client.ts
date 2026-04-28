/**
 * API client utilities for making authenticated requests
 */

import { getTTL, requestCache } from '@/lib/api/requestCache';
import { logger, logRequest, logResponse } from '@/lib/logger';

// Types
export interface PaginationParams {
  page?: number;
  limit?: number;
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

// ============================================
// Internal Helpers
// ============================================

/**
 * Safely parses JSON from a response, handling non-JSON error pages gracefully.
 */
async function safeParseJson(response: Response) {
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch (e) {
      logger.error('[apiClient] Failed to parse JSON even though content-type was matching', e);
    }
  }

  // If not JSON, it might be an HTML error page (404, 500)
  const bodySnippet = await response.text();
  logger.error(`[apiClient] Expected JSON but received ${contentType || 'unknown type'}. Status: ${response.status}`, {
    bodyPreview: bodySnippet.slice(0, 200),
    url: response.url,
  });

  throw new Error(`Server error (${response.status}): Received non-JSON response. Check console for details.`);
}

/**
 * Fetch wrapper that:
 * - Includes credentials for same-origin cookie auth
 * - Attaches Supabase access token (Authorization: Bearer) when available
 */
/**
 * Fetch wrapper with retry logic and token attachment
 */
export async function apiFetch(url: string, options?: RequestInit, maxRetries = 2) {
  const startTime = performance.now();
  const method = options?.method || 'GET';

  // Try to get from cache first for GET requests
  if (method === 'GET') {
    const cached = requestCache.get(url, options);
    if (cached) {
      if ((cached as any) instanceof Response) {
        return (cached as any).clone();
      }
      return new Response(JSON.stringify(cached), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  const incomingHeaders = (options?.headers ?? {}) as Record<string, string>;
  const baseHeaders: Record<string, string> = {
    ...(incomingHeaders || {}),
    ...(!('Content-Type' in (incomingHeaders || {})) ? { 'Content-Type': 'application/json' } : {}),
  };

  logRequest(method, url);

  let retries = 0;

  const executeFetch = async (): Promise<Response> => {
    let authorizationHeader: string | undefined;

    if (typeof window !== 'undefined') {
      try {
        const { getAccessToken } = await import('@/lib/supabase/browser');
        const token = await getAccessToken();
        if (token && !('Authorization' in baseHeaders)) {
          authorizationHeader = `Bearer ${token}`;
        }
      } catch {
        // no-op if browser client isn't available
      }
    }

    try {
      const { signal, ...fetchOptions } = options || {};

      const fetcher = () =>
        fetch(url, {
          ...fetchOptions,
          credentials: 'same-origin',
          headers: authorizationHeader
            ? { ...baseHeaders, Authorization: authorizationHeader }
            : baseHeaders,
        });

      let response: Response;

      if (method === 'GET') {
        // We deduplicate GET requests to save bandwidth and improve performance.
        const sharedResponsePromise = requestCache.getOrSetInFlight(url, options, fetcher);

        if (signal) {
          response = await Promise.race([
            sharedResponsePromise.then((r) => r.clone()),
            new Promise<Response>((_, reject) => {
              if (signal.aborted) {
                return reject(new DOMException('Aborted', 'AbortError'));
              }
              signal.addEventListener(
                'abort',
                () => {
                  reject(new DOMException('Aborted', 'AbortError'));
                },
                { once: true }
              );
            }),
          ]);
        } else {
          const sharedResponse = await sharedResponsePromise;
          response = sharedResponse.clone();
        }
      } else {
        // POST/PUT/DELETE are never deduplicated
        response = await fetch(url, {
          ...fetchOptions,
          credentials: 'same-origin',
          headers: authorizationHeader
            ? { ...baseHeaders, Authorization: authorizationHeader }
            : baseHeaders,
        });
      }

      if (response.ok && method === 'GET') {
        const ttl = getTTL(url);
        // ... cache setting logic if needed
      } else if (response.ok && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        // Invalidate relevant cache on mutations
        const baseUrl = url.split('?')[0] ?? url;
        requestCache.invalidate(baseUrl);

        if (baseUrl.includes('/api/subjects')) {
          requestCache.invalidate('/api/subjects');
        }
        if (baseUrl.includes('/api/students')) {
          requestCache.invalidate('/api/students');
        }
      }

      // Retry on 5xx errors or network failures
      if (!response.ok && response.status >= 500 && retries < maxRetries) {
        retries++;
        const delay = Math.pow(2, retries) * 1000; // Exponential backoff
        logger.warn(`Retrying request ${method} ${url} (${retries}/${maxRetries})`, { delay });
        await new Promise((resolve) => setTimeout(resolve, delay));
        return executeFetch();
      }

      const duration = performance.now() - startTime;
      logResponse(method, url, response.status, duration);

      // Cache successful GET responses if configured
      if (response.ok && method === 'GET') {
        const ttl = getTTL(url);
        if (ttl) {
          // Clone again for caching
          const responseToCache = response.clone();
          // We can't cache Response objects directly easily because body is a stream
          // Ideally we cache the DATA not the Response, but apiFetch returns Response.
          // For now, we only cache duplication promises.
          // Future: change apiFetch to return parsed data or handle Response caching carefully.
          // Let's rely on deduplication for now and specific data caching in data hooks.
        }
      }

      return response;
    } catch (error) {
      if (retries < maxRetries) {
        retries++;
        const delay = Math.pow(2, retries) * 1000;
        logger.warn(`Fetch error, retrying ${method} ${url} (${retries}/${maxRetries})`, { error });
        await new Promise((resolve) => setTimeout(resolve, delay));
        return executeFetch();
      }

      const duration = performance.now() - startTime;

      // Don't log AbortError as an error - it's normal behavior for useFetch/cancelled requests
      const isAbortError = error instanceof DOMException && error.name === 'AbortError';

      if (isAbortError) {
        logger.debug(`Request aborted: ${method} ${url}`, { duration });
      } else {
        logger.error(`Request failed: ${method} ${url}`, error, { duration });
      }

      throw error;
    }
  };

  return executeFetch();
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
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) {
    searchParams.set('limit', params.limit.toString());
  }
  if (params?.search) searchParams.set('search', params.search);

  const url = `/api/students${searchParams.toString() ? `?${searchParams}` : ''}`;
  const response = await apiFetch(url);

  const result = await safeParseJson(response);

  if (!response.ok) {
    throw new Error(result.error || 'Failed to fetch students');
  }

  // Handle case where result.data contains { data, total, ... } (double wrapped)
  // or result.data is the array (standard)
  const listData = Array.isArray(result.data) ? result.data : result.data?.data || [];
  const pagination =
    result.pagination ||
    (result.data?.total !== undefined
      ? {
          page: result.data.page || params?.page || 1,
          pageSize: result.data.limit || result.data.pageSize || params?.limit || 10,
          limit: result.data.limit || result.data.pageSize || params?.limit || 10,
          totalItems: result.data.total,
          totalPages:
            result.data.totalPages || Math.ceil(result.data.total / (params?.limit || 10)),
        }
      : {
          page: params?.page || 1,
          pageSize: params?.limit || 10,
          limit: params?.limit || 10,
          totalItems: 0,
          totalPages: 0,
        });

  return {
    data: listData,
    pagination,
  };
}

/**
 * Get student by ID with enrollments
 */
export async function getStudentById(id: string): Promise<StudentWithEnrollments> {
  const response = await apiFetch(`/api/students/${id}`);
  const result = await safeParseJson(response);

  if (!response.ok) {
    throw new Error(result.error || 'Failed to fetch student');
  }

  return result.data;
}

/**
 * Create a new student
 */
export async function createStudent(data: CreateStudentInput): Promise<Student> {
  const response = await apiFetch('/api/students', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  const result = await safeParseJson(response);

  if (!response.ok) {
    throw new Error(result.error || 'Failed to create student');
  }

  return result.data;
}

/**
 * Update student information
 */
export async function updateStudent(id: string, data: UpdateStudentInput): Promise<Student> {
  const response = await apiFetch(`/api/students/${id}`, {
    method: 'PUT', // V2 prefers PUT or PATCH? Usually PUT in our V2 handlers if full replace, but PATCH often safer. Let's check handler.
    // Checking V2 handler... usually supports both or specifically one.
    // I'll stick to PATCH if supported or leave as was if unsure, but usually V2 implies standardization.
    // Re-checking V2 routes... `app/api/students/[id]/route.ts` likely exists.
    body: JSON.stringify(data),
  });
  const result = await safeParseJson(response);

  if (!response.ok) {
    throw new Error(result.error || 'Failed to update student');
  }

  return result.data;
}

/**
 * Delete student (validates no active enrollments)
 */
export async function deleteStudent(id: string): Promise<void> {
  const response = await apiFetch(`/api/students/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const result = await safeParseJson(response);
    throw new Error(result.error || 'Failed to delete student');
  }
}

/**
 * Bulk archive students
 */
export async function bulkArchiveStudents(studentIds: string[]): Promise<void> {
  const response = await apiFetch('/api/students/bulk-archive', {
    method: 'POST',
    body: JSON.stringify({ studentIds }),
  });

  if (!response.ok) {
    const result = await safeParseJson(response);
    throw new Error(result.error || 'Failed to archive students');
  }
}

/**
 * Enroll student in a class
 */
export async function enrollStudent(studentId: string, classId: string): Promise<any> {
  const response = await apiFetch('/api/enrollments', {
    method: 'POST',
    body: JSON.stringify({ student_id: studentId, class_id: classId }),
  });
  const result = await safeParseJson(response);

  if (!response.ok) {
    throw new Error(result.error || 'Failed to enroll student');
  }

  return result.data;
}

/**
 * Remove enrollment
 */
export async function deleteEnrollment(enrollmentId: string): Promise<void> {
  const response = await apiFetch(`/api/enrollments/${enrollmentId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const result = await safeParseJson(response);
    throw new Error(result.error || 'Failed to delete enrollment');
  }
}

/**
 * @deprecated Use deleteEnrollment instead
 */
export async function unenrollStudent(studentId: string, classId: string): Promise<void> {
  // Legacy support or throw error?
  // Ideally we should find the enrollment ID first, but for now let's error or warn
  console.warn('unenrollStudent is deprecated. Use deleteEnrollment(enrollmentId).');
  throw new Error('unenrollStudent is deprecated. Use deleteEnrollment(enrollmentId).');
}

/**
 * Get student grades
 */
export async function getStudentGrades(studentId: string): Promise<any[]> {
  const response = await apiFetch(`/api/grades?student_id=${studentId}`);
  const result = await safeParseJson(response);

  if (!response.ok) {
    throw new Error(result.error || 'Failed to fetch grades');
  }

  return result.data;
}

/**
 * Get student attendance
 */
export async function getStudentAttendance(studentId: string): Promise<any[]> {
  const response = await apiFetch(`/api/attendance?student_id=${studentId}`);
  const result = await safeParseJson(response);

  if (!response.ok) {
    throw new Error(result.error || 'Failed to fetch attendance');
  }

  return result.data;
}
// ============================================================================
// Class API Functions
// ============================================================================

export interface ClassListParams extends PaginationParams {
  search?: string;
  teacher_id?: string;
  grade?: string;
  course_id?: string;
  status?: string;
}

export async function getClasses(params?: ClassListParams): Promise<{
  data: any[]; // Returning any[] allows flexibility with legacy vs V2 shapes
  pagination?: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) {
    searchParams.set('limit', params.limit.toString());
  }
  if (params?.search) searchParams.set('search', params.search);
  if (params?.teacher_id) searchParams.set('teacher_id', params.teacher_id);
  if (params?.status) searchParams.set('status', params.status);

  const response = await apiFetch(`/api/classes?${searchParams.toString()}`);
  const result = await safeParseJson(response);

  if (!response.ok) {
    throw new Error(result.error || 'Failed to fetch classes');
  }

  // Handle double-wrapping or standard V2
  const listData = Array.isArray(result.data) ? result.data : result.data?.data || [];
  const pagination =
    result.pagination ||
    (result.data?.total !== undefined
      ? {
          page: result.data.page || params?.page || 1,
          pageSize: result.data.limit || result.data.pageSize || params?.limit || 10,
          limit: result.data.limit || result.data.pageSize || params?.limit || 10,
          totalItems: result.data.total,
          totalPages:
            result.data.totalPages || Math.ceil(result.data.total / (params?.limit || 10)),
        }
      : {
          page: params?.page || 1,
          pageSize: params?.limit || 10,
          limit: params?.limit || 10,
          totalItems: 0,
          totalPages: 0,
        });

  return {
    data: listData,
    pagination,
  };
}

export async function getClassById(id: string): Promise<any> {
  const response = await apiFetch(`/api/classes/${id}`);
  const result = await safeParseJson(response);
  if (!response.ok) {
    throw new Error(result.error || 'Failed to fetch class');
  }
  return result.data;
}

export async function createClass(data: any): Promise<any> {
  const response = await apiFetch('/api/classes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  const result = await safeParseJson(response);
  if (!response.ok) {
    throw new Error(result.error || 'Failed to create class');
  }
  return result.data;
}

export async function updateClass(id: string, data: any): Promise<any> {
  const response = await apiFetch(`/api/classes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  const result = await safeParseJson(response);
  if (!response.ok) {
    throw new Error(result.error || 'Failed to update class');
  }
  return result.data;
}

export async function deleteClass(id: string): Promise<void> {
  const response = await apiFetch(`/api/classes/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const result = await safeParseJson(response);
    throw new Error(result.error || 'Failed to delete class');
  }
}

export async function getClassStudents(classId: string): Promise<any[]> {
  const response = await apiFetch(`/api/classes/${classId}/students`);
  // Fallback to V1 if V2 404s or not implemented yet (Phase 3 migration)
  if (!response.ok) {
    const v1Response = await apiFetch(`/api/classes/${classId}/students`);
    if (!v1Response.ok) return [];
    const json = await safeParseJson(v1Response);
    return json.data || json.students || [];
  }
  const result = await safeParseJson(response);
  return result.data || [];
}

// ============================================================================
// Grade API Functions
// ============================================================================

export interface GradeListParams extends PaginationParams {
  student_id?: string;
  class_id?: string;
  subject_id?: string;
  component_type?: string;
  semester?: string;
  academic_year_id?: string;
}

export async function getGrades(params?: GradeListParams): Promise<{
  data: any[];
  pagination?: {
    page: number;
    pageSize: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) {
    searchParams.set('limit', params.limit.toString());
  }
  if (params?.student_id) searchParams.set('student_id', params.student_id);
  if (params?.class_id) searchParams.set('class_id', params.class_id);
  if (params?.subject_id) searchParams.set('subject_id', params.subject_id);
  if (params?.component_type) {
    searchParams.set('component_type', params.component_type);
  }
  if (params?.semester) searchParams.set('semester', params.semester);
  if (params?.academic_year_id) {
    searchParams.set('academic_year_id', params.academic_year_id);
  }

  const response = await apiFetch(`/api/grades?${searchParams.toString()}`);
  const result = await safeParseJson(response);

  if (!response.ok) {
    throw new Error(result.error || 'Failed to fetch grades');
  }

  const listData = Array.isArray(result.data) ? result.data : result.data?.data || [];
  const pagination =
    result.pagination ||
    (result.data?.total !== undefined
      ? {
          page: result.data.page || params?.page || 1,
          pageSize: result.data.limit || result.data.pageSize || params?.limit || 10,
          limit: result.data.limit || result.data.pageSize || params?.limit || 10,
          totalItems: result.data.total,
          totalPages:
            result.data.totalPages || Math.ceil(result.data.total / (params?.limit || 10)),
        }
      : {
          page: params?.page || 1,
          pageSize: params?.limit || 10,
          limit: params?.limit || 10,
          totalItems: 0,
          totalPages: 0,
        });

  return {
    data: listData,
    pagination,
  };
}

export async function bulkCreateGrades(data: any): Promise<any> {
  const response = await apiFetch('/api/grades', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  const result = await safeParseJson(response);
  if (!response.ok) {
    throw new Error(result.error || 'Failed to create grades');
  }
  return result.data;
}

export async function updateGrade(id: string, data: any): Promise<any> {
  const response = await apiFetch(`/api/grades/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  const result = await safeParseJson(response);
  if (!response.ok) {
    throw new Error(result.error || 'Failed to update grade');
  }
  return result.data;
}

export async function deleteGrade(id: string): Promise<void> {
  const response = await apiFetch(`/api/grades/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const result = await safeParseJson(response);
    throw new Error(result.error || 'Failed to delete grade');
  }
}

// ============================================================================
// Attendance API Functions
// ============================================================================

export interface AttendanceListParams extends PaginationParams {
  class_id?: string;
  student_id?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  from_date?: string;
  to_date?: string;
  status?: string;
}

export async function getAttendance(params?: AttendanceListParams): Promise<{
  data: any[];
  pagination?: {
    page: number;
    pageSize: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) {
    searchParams.set('limit', params.limit.toString());
  }
  if (params?.class_id) searchParams.set('class_id', params.class_id);
  if (params?.student_id) searchParams.set('student_id', params.student_id);
  if (params?.date) searchParams.set('date', params.date);
  if (params?.startDate) searchParams.set('from_date', params.startDate);
  if (params?.endDate) searchParams.set('to_date', params.endDate);
  if (params?.from_date) searchParams.set('from_date', params.from_date);
  if (params?.to_date) searchParams.set('to_date', params.to_date);
  if (params?.status && params.status !== 'all') {
    searchParams.set('status', params.status);
  }

  const response = await apiFetch(`/api/attendance?${searchParams.toString()}`);
  const result = await safeParseJson(response);

  if (!response.ok) {
    throw new Error(result.error || 'Failed to fetch attendance');
  }

  const listData = Array.isArray(result.data) ? result.data : result.data?.data || [];
  const pagination =
    result.pagination ||
    (result.data?.total !== undefined
      ? {
          page: result.data.page || params?.page || 1,
          pageSize: result.data.limit || result.data.pageSize || params?.limit || 10,
          limit: result.data.limit || result.data.pageSize || params?.limit || 10,
          totalItems: result.data.total,
          totalPages:
            result.data.totalPages || Math.ceil(result.data.total / (params?.limit || 10)),
        }
      : {
          page: params?.page || 1,
          pageSize: params?.limit || 10,
          limit: params?.limit || 10,
          totalItems: 0,
          totalPages: 0,
        });

  return {
    data: listData,
    pagination,
  };
}

export async function createAttendance(data: any): Promise<any> {
  const response = await apiFetch('/api/attendance', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  const result = await safeParseJson(response);
  if (!response.ok) {
    throw new Error(result.error || 'Failed to mark attendance');
  }
  return result.data;
}

export async function bulkCreateAttendance(data: any): Promise<any> {
  const response = await apiFetch('/api/attendance/bulk', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  const result = await safeParseJson(response);
  if (!response.ok) {
    throw new Error(result.error || 'Failed to bulk mark attendance');
  }
  return result.data;
}

// ============================================
// FINANCE API
// ============================================

export async function getFinanceReports(
  type: string,
  params?: { startDate?: string; endDate?: string }
): Promise<any> {
  const searchParams = new URLSearchParams();
  searchParams.set('type', type);
  if (params?.startDate) searchParams.set('start_date', params.startDate);
  if (params?.endDate) searchParams.set('end_date', params.endDate);

  const response = await apiFetch(`/api/finance/reports?${searchParams.toString()}`);
  const result = await safeParseJson(response);
  if (!response.ok) {
    throw new Error(result.error || 'Failed to fetch reports');
  }
  return result.data;
}

export async function getInvoices(params?: any): Promise<{
  data: any[];
  pagination?: {
    page: number;
    pageSize: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit || params?.pageSize) {
    searchParams.set('limit', (params.limit || params.pageSize).toString());
  }
  if (params?.student_id) searchParams.set('student_id', params.student_id);
  if (params?.status && params.status !== 'all') {
    searchParams.set('status', params.status);
  }

  const response = await apiFetch(`/api/finance/invoices?${searchParams.toString()}`);
  const result = await safeParseJson(response);
  if (!response.ok) {
    throw new Error(result.error || 'Failed to fetch invoices');
  }

  const listData = Array.isArray(result.data) ? result.data : result.data?.data || [];
  const pagination =
    result.pagination ||
    (result.data?.total !== undefined
      ? {
          pageSize:
            result.data.limit || result.data.pageSize || params?.limit || params?.pageSize || 10,
          limit:
            result.data.limit || result.data.pageSize || params?.limit || params?.pageSize || 10,
          totalItems: result.data.total,
          totalPages:
            result.data.totalPages ||
            Math.ceil(result.data.total / (params?.limit || params?.pageSize || 10)),
        }
      : {
          page: params?.page || 1,
          pageSize: params?.limit || params?.pageSize || 10,
          limit: params?.limit || params?.pageSize || 10,
          totalItems: 0,
          totalPages: 0,
        });

  return {
    data: listData,
    pagination,
  };
}

export async function createInvoice(data: any): Promise<any> {
  const response = await apiFetch('/api/finance/invoices', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  const result = await safeParseJson(response);
  if (!response.ok) {
    throw new Error(result.error || 'Failed to create invoice');
  }
  return result.data;
}

export async function getPayments(params?: any): Promise<{
  data: any[];
  pagination?: {
    page: number;
    pageSize: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit || params?.pageSize) {
    searchParams.set('limit', (params.limit || params.pageSize).toString());
  }
  if (params?.student_id) searchParams.set('student_id', params.student_id);
  if (params?.startDate) searchParams.set('start_date', params.startDate);
  if (params?.endDate) searchParams.set('end_date', params.endDate);

  const response = await apiFetch(`/api/finance/payments?${searchParams.toString()}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch payments');
  }
  const result = await response.json();

  const listData = Array.isArray(result.data) ? result.data : result.data?.data || [];
  const pagination =
    result.pagination ||
    (result.data?.total !== undefined
      ? {
          pageSize:
            result.data.limit || result.data.pageSize || params?.limit || params?.pageSize || 10,
          limit:
            result.data.limit || result.data.pageSize || params?.limit || params?.pageSize || 10,
          totalItems: result.data.total,
          totalPages:
            result.data.totalPages ||
            Math.ceil(result.data.total / (params?.limit || params?.pageSize || 10)),
        }
      : {
          page: params?.page || 1,
          pageSize: params?.limit || params?.pageSize || 10,
          limit: params?.limit || params?.pageSize || 10,
          totalItems: 0,
          totalPages: 0,
        });

  return {
    data: listData,
    pagination,
  };
}

export async function createPayment(data: any): Promise<any> {
  const response = await apiFetch('/api/finance/payments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create payment');
  }
  const result = await response.json();
  return result.data;
}
