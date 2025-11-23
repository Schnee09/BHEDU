/**
 * Unified API Client for BH-EDU
 * All frontend pages should use this instead of direct Supabase queries
 */

const API_BASE = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export class ApiError extends Error {
  constructor(public statusCode: number, message: string, public data?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new ApiError(
        response.status,
        data.error || 'Request failed',
        data
      );
    }

    return data.data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, 'Network error', error);
  }
}

// Students API
export const studentsApi = {
  list: (params?: { search?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    return apiRequest<any[]>(`/api/admin/students${query.toString() ? `?${query}` : ''}`);
  },
  
  get: (id: string) => 
    apiRequest<any>(`/api/admin/students/${id}`),
  
  create: (data: any) =>
    apiRequest<any>('/api/admin/students', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Teachers API
export const teachersApi = {
  list: (params?: { search?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    return apiRequest<any[]>(`/api/admin/teachers${query.toString() ? `?${query}` : ''}`);
  },
  
  get: (id: string) => 
    apiRequest<any>(`/api/admin/teachers/${id}`),
  
  create: (data: any) =>
    apiRequest<any>('/api/admin/teachers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Classes API
export const classesApi = {
  list: (params?: { search?: string; teacher_id?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiRequest<any[]>(`/api/admin/classes${query ? `?${query}` : ''}`);
  },
  
  get: (id: string) => 
    apiRequest<any>(`/api/admin/classes/${id}`),
  
  create: (data: any) =>
    apiRequest<any>('/api/admin/classes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Enrollments API
export const enrollmentsApi = {
  list: (params?: { student_id?: string; class_id?: string; status?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiRequest<any[]>(`/api/admin/enrollments${query ? `?${query}` : ''}`);
  },
  
  create: (data: { student_id: string; class_id: string; status?: string }) =>
    apiRequest<any>('/api/admin/enrollments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Grades API
export const gradesApi = {
  list: (params?: { student_id?: string; assignment_id?: string; class_id?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiRequest<any[]>(`/api/admin/grades${query ? `?${query}` : ''}`);
  },
  
  create: (data: any) =>
    apiRequest<any>('/api/admin/grades', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Attendance API
export const attendanceApi = {
  list: (params?: { student_id?: string; class_id?: string; date?: string; status?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiRequest<any[]>(`/api/admin/attendance${query ? `?${query}` : ''}`);
  },
  
  create: (data: any) =>
    apiRequest<any>('/api/admin/attendance', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Assignments API
export const assignmentsApi = {
  list: (params?: { class_id?: string; category_id?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiRequest<any[]>(`/api/admin/assignments${query ? `?${query}` : ''}`);
  },
  
  create: (data: any) =>
    apiRequest<any>('/api/admin/assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Export all APIs
export const api = {
  students: studentsApi,
  teachers: teachersApi,
  classes: classesApi,
  enrollments: enrollmentsApi,
  grades: gradesApi,
  attendance: attendanceApi,
  assignments: assignmentsApi,
};
