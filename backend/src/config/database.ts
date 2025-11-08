// src/config/database.ts
import { User, Course, Lesson, Enrollment } from '../types';

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at'>;
        Update: Partial<User>;
      };
      courses: {
        Row: Course;
        Insert: Omit<Course, 'id' | 'created_at'>;
        Update: Partial<Course>;
      };
      lessons: {
        Row: Lesson;
        Insert: Omit<Lesson, 'id' | 'created_at'>;
        Update: Partial<Lesson>;
      };
      enrollments: {
        Row: Enrollment;
        Insert: Omit<Enrollment, 'id' | 'enrolled_at' | 'updated_at'>;
        Update: Partial<Enrollment>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
