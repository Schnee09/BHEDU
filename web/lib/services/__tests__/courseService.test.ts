/**
 * Tests for CourseService
 *
 * Updated for instance-based pattern (Phase 2)
 */

import { CourseService, courseService } from "@/lib/services/courseService";
import { NotFoundError, ValidationError } from "@/lib/api/errors";

// Mock Supabase client
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
  createServiceClient: jest.fn(),
}));

import { createServiceClient } from "@/lib/supabase/server";

describe("CourseService", () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabase = {
      from: jest.fn(),
    };

    (createServiceClient as jest.Mock).mockReturnValue(mockSupabase);
    courseService.setSupabase(mockSupabase);
  });

  describe("getCourses", () => {
    it("should return paginated courses", async () => {
      const mockCourses = [
        { id: "1", name: "Math 101", code: "MATH101", subject_id: "sub1" },
        { id: "2", name: "Physics 101", code: "PHYS101", subject_id: "sub2" },
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          range: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockCourses,
              error: null,
              count: 2,
            }),
          }),
        }),
      });

      const service = new CourseService(mockSupabase);
      const result = await service.getCourses({ page: 1, pageSize: 20 });

      expect(result.courses).toEqual(mockCourses);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
      expect(mockSupabase.from).toHaveBeenCalledWith("courses");
    });

    it("should filter courses by subject", async () => {
      const subjectId = "sub1";
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            range: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: [],
                error: null,
                count: 0,
              }),
            }),
          }),
        }),
      });

      const service = new CourseService(mockSupabase);
      await service.getCourses({ subjectId });

      expect(mockSupabase.from).toHaveBeenCalledWith("courses");
    });

    it("should throw error when database fails", async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          range: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: null,
              error: { message: "Database error" },
            }),
          }),
        }),
      });

      const service = new CourseService(mockSupabase);
      await expect(service.getCourses()).rejects.toThrow(
        "Failed to fetch courses",
      );
    });
  });

  describe("getCourseById", () => {
    it("should return a course by ID", async () => {
      const mockCourse = { id: "1", name: "Math 101", code: "MATH101" };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockCourse,
              error: null,
            }),
          }),
        }),
      });

      const service = new CourseService(mockSupabase);
      const course = await service.getCourseById("1");

      expect(course).toEqual(mockCourse);
      expect(mockSupabase.from).toHaveBeenCalledWith("courses");
    });

    it("should throw NotFoundError when course does not exist", async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: "Not found" },
            }),
          }),
        }),
      });

      const service = new CourseService(mockSupabase);
      await expect(service.getCourseById("999")).rejects.toThrow(NotFoundError);
    });
  });

  describe("createCourse", () => {
    const validInput = {
      name: "New Course",
      code: "NEW101",
      subject_id: "00000000-0000-0000-0000-000000000001",
      description: "A new course",
      credits: 3,
      status: "active" as const,
    };

    it("should create a new course", async () => {
      // Mock code check (no existing)
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });

      // Mock subject check
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: "00000000-0000-0000-0000-000000000001" },
              error: null,
            }),
          }),
        }),
      });

      // Mock insert
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: "1", ...validInput },
              error: null,
            }),
          }),
        }),
      });

      const service = new CourseService(mockSupabase);
      const course = await service.createCourse(validInput);

      expect(course).toMatchObject(validInput as any);
    });

    it("should throw ValidationError when code already exists", async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: "1" },
              error: null,
            }),
          }),
        }),
      });

      const service = new CourseService(mockSupabase);
      await expect(service.createCourse(validInput)).rejects.toThrow(
        ValidationError,
      );
    });

    it("should throw ValidationError when subject does not exist", async () => {
      // Mock code check (no existing)
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });

      // Mock subject check (not found)
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });

      const service = new CourseService(mockSupabase);
      await expect(service.createCourse(validInput)).rejects.toThrow(
        ValidationError,
      );
    });
  });

  describe("deleteCourse", () => {
    it("should delete a course with no classes", async () => {
      // Mock getCourseById
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: "1", name: "Math 101" },
              error: null,
            }),
          }),
        }),
      });

      // Mock classes check
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      // Mock delete
      mockSupabase.from.mockReturnValueOnce({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      const service = new CourseService(mockSupabase);
      await service.deleteCourse("1");

      expect(mockSupabase.from).toHaveBeenCalledWith("courses");
    });

    it("should throw ValidationError when course has classes", async () => {
      // Mock getCourseById
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: "1", name: "Math 101" },
              error: null,
            }),
          }),
        }),
      });

      // Mock classes check (has classes)
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [{ id: "class1" }],
              error: null,
            }),
          }),
        }),
      });

      const service = new CourseService(mockSupabase);
      await expect(service.deleteCourse("1")).rejects.toThrow(ValidationError);
    });
  });

  describe("Static methods backward compatibility", () => {
    it("should delegate static getCourses to instance method", async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          range: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [],
              error: null,
              count: 0,
            }),
          }),
        }),
      });

      const result = await CourseService.getCourses();
      expect(result.courses).toEqual([]);
    });
  });
});
