// src/types.ts
export type Role = 'student' | 'teacher' | 'admin';

export interface Profile {
  id: string;
  full_name: string;
  role: Role;
  avatar_url?: string;
 email?: string;
 phone?: string;
 address?: string;
 date_of_birth?: string;
  metadata?: Record<string, any>;
  created_at?: string;
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  author_id?: string;
  created_at?: string;
  is_published?: boolean;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  content?: string;
  video_url?: string;
  order_index?: number;
  is_published?: boolean;
  created_at?: string;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  progress?: number;
  status?: 'active' | 'completed' | 'dropped' | string;
  enrolled_at?: string;
  updated_at?: string;
}
