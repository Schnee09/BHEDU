/**
 * Course Service - Business logic for course management
 *
 * MIGRATED TO INSTANCE-BASED (Phase 2)
 */

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NotFoundError, ValidationError } from "@/lib/api/errors";
import type { CreateCourseInput, UpdateCourseInput } from "@/lib/schemas";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface Course {
  id: string;
  name: string;
  description: string | null;
  code: string;
  subject_id: string;
  credits: number | null;
  created_at: string;
  updated_at: string;
  status: "active" | "inactive" | "archived";
}

export class CourseService {
  private supabase: SupabaseClient;

  constructor(supabase?: SupabaseClient) {
    this.supabase = supabase || createServiceClient();
  }

  /**
   * Set the Supabase client (primarily for testing)
   */
  public setSupabase(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async getCourses(filters?: {
    subjectId?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 20;
    const offset = (page - 1) * pageSize;

    let query = this.supabase
      .from("courses")
      .select("*, subjects(id, name)", { count: "exact" });

    if (filters?.subjectId) {
      query = query.eq("subject_id", filters.subjectId);
    }

    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,code.ilike.%${filters.search}%,description.ilike.%${filters.search}%`,
      );
    }

    query = query.range(offset, offset + pageSize - 1).order("name");

    const { data, error, count } = await query;

    if (error) {
      console.error("Failed to fetch courses:", error);
      throw new Error("Failed to fetch courses");
    }

    return {
      courses: data || [],
      total: count || 0,
      page,
      pageSize,
    };
  }

  async getCourseById(id: string): Promise<Course> {
    const { data, error } = await this.supabase
      .from("courses")
      .select("*, subjects(id, name)")
      .eq("id", id)
      .single();

    if (error || !data) {
      throw new NotFoundError("Course not found");
    }

    return data;
  }

  async createCourse(input: CreateCourseInput) {
    const { data: existing } = await this.supabase
      .from("courses")
      .select("id")
      .eq("code", input.code)
      .single();

    if (existing) {
      throw new ValidationError("Course code already exists");
    }

    const { data: subject } = await this.supabase
      .from("subjects")
      .select("id")
      .eq("id", input.subject_id)
      .single();

    if (!subject) {
      throw new ValidationError("Subject not found");
    }

    const { data, error } = await this.supabase
      .from("courses")
      .insert({
        name: input.name,
        description: input.description || null,
        code: input.code,
        subject_id: input.subject_id,
        credits: input.credits || null,
        status: input.status,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create course:", error);
      throw new Error("Failed to create course");
    }

    return data;
  }

  async updateCourse(id: string, input: UpdateCourseInput) {
    await this.getCourseById(id);

    if (input.code) {
      const { data: existing } = await this.supabase
        .from("courses")
        .select("id")
        .eq("code", input.code)
        .neq("id", id)
        .single();

      if (existing) {
        throw new ValidationError("Course code already exists");
      }
    }

    if (input.subject_id) {
      const { data: subject } = await this.supabase
        .from("subjects")
        .select("id")
        .eq("id", input.subject_id)
        .single();

      if (!subject) {
        throw new ValidationError("Subject not found");
      }
    }

    const { data, error } = await this.supabase
      .from("courses")
      .update(input)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Failed to update course:", error);
      throw new Error("Failed to update course");
    }

    return data;
  }

  async deleteCourse(id: string) {
    await this.getCourseById(id);

    const { data: classes } = await this.supabase
      .from("classes")
      .select("id")
      .eq("course_id", id)
      .limit(1);

    if (classes && classes.length > 0) {
      throw new ValidationError("Cannot delete course with existing classes");
    }

    const { error } = await this.supabase
      .from("courses")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Failed to delete course:", error);
      throw new Error("Failed to delete course");
    }
  }

  async getCoursesBySubject(subjectId: string) {
    return this.getCourses({ subjectId });
  }

  // ============================================================
  // STATIC METHODS FOR BACKWARD COMPATIBILITY
  // ============================================================

  static async getCourses(
    filters?: Parameters<CourseService["getCourses"]>[0],
  ) {
    return courseService.getCourses(filters);
  }

  static async getCourseById(id: string) {
    return courseService.getCourseById(id);
  }

  static async createCourse(input: CreateCourseInput) {
    return courseService.createCourse(input);
  }

  static async updateCourse(id: string, input: UpdateCourseInput) {
    return courseService.updateCourse(id, input);
  }

  static async deleteCourse(id: string) {
    return courseService.deleteCourse(id);
  }

  static async getCoursesBySubject(subjectId: string) {
    return courseService.getCoursesBySubject(subjectId);
  }
}

// Default singleton instance
export const courseService = new CourseService();
