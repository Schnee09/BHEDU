/**
 * Tests for StudentService
 *
 * Updated for instance-based pattern (Phase 2)
 */

import { StudentService, studentService } from "@/lib/services/studentService";
import { NotFoundError, ValidationError } from "@/lib/api/errors";

// Mock Supabase client
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
  createServiceClient: jest.fn(),
}));

import { createServiceClient } from "@/lib/supabase/server";

describe("StudentService", () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabase = {
      from: jest.fn(),
      auth: {
        admin: {
          createUser: jest.fn(),
          deleteUser: jest.fn(),
        },
      },
    };

    (createServiceClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  describe("getStudents", () => {
    it("should return paginated students", async () => {
      const mockStudents = [
        {
          id: "1",
          first_name: "John",
          last_name: "Doe",
          email: "john@example.com",
          role: "student",
        },
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            range: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: mockStudents,
                error: null,
                count: 1,
              }),
            }),
          }),
        }),
      });

      const service = new StudentService(mockSupabase);
      const result = await service.getStudents({ page: 1, pageSize: 20 });

      expect(result.students).toEqual(mockStudents);
      expect(result.total).toBe(1);
      expect(mockSupabase.from).toHaveBeenCalledWith("profiles");
    });

    it("should filter by search term", async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            or: jest.fn().mockReturnValue({
              range: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: [],
                  error: null,
                  count: 0,
                }),
              }),
            }),
          }),
        }),
      });

      const service = new StudentService(mockSupabase);
      await service.getStudents({ search: "John" });

      expect(mockSupabase.from).toHaveBeenCalledWith("profiles");
    });

    it("should throw error when database fails", async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            range: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: null,
                error: { message: "Database error" },
              }),
            }),
          }),
        }),
      });

      const service = new StudentService(mockSupabase);
      await expect(service.getStudents()).rejects.toThrow(
        "Failed to fetch students",
      );
    });
  });

  describe("getStudentById", () => {
    it("should return student with enrollments", async () => {
      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: "1", first_name: "John", last_name: "Doe" },
                  error: null,
                }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [{
                id: "e1",
                class_id: "c1",
                enrollment_date: "2023-01-01",
                status: "active",
                classes: { id: "c1", name: "Class", course_id: "crs1" },
              }],
              error: null,
            }),
          }),
        });

      const service = new StudentService(mockSupabase);
      const student = await service.getStudentById("1");

      expect(student.first_name).toEqual("John");
      expect(student.enrollments).toHaveLength(1);
    });

    it("should throw NotFoundError when student not found", async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: "Not found" },
              }),
            }),
          }),
        }),
      });

      const service = new StudentService(mockSupabase);
      await expect(service.getStudentById("999")).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe("enrollStudent", () => {
    it("should enroll student in class", async () => {
      const mockStudent = {
        id: "1",
        first_name: "John",
        enrollments: [],
      };

      const mockEnrollment = {
        id: "e1",
        student_id: "1",
        class_id: "c1",
        status: "active",
      };

      // Mock getStudentById
      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockStudent,
                  error: null,
                }),
              }),
            }),
          }),
        })
        // Mock check for existing enrollment
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          }),
        })
        // Mock insert
        .mockReturnValueOnce({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockEnrollment,
                error: null,
              }),
            }),
          }),
        });

      const service = new StudentService(mockSupabase);
      const enrollment = await service.enrollStudent("1", "c1");

      expect(enrollment.student_id).toBe("1");
      expect(enrollment.class_id).toBe("c1");
    });

    it("should throw ValidationError if already enrolled", async () => {
      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: "1", enrollments: [] },
                  error: null,
                }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: "existing" },
                  error: null,
                }),
              }),
            }),
          }),
        });

      const service = new StudentService(mockSupabase);
      await expect(service.enrollStudent("1", "c1")).rejects.toThrow(
        ValidationError,
      );
    });
  });

  describe("deleteStudent", () => {
    it("should throw ValidationError if student has active enrollments", async () => {
      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: "1", enrollments: [] },
                  error: null,
                }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({
                  data: [{ id: "e1" }],
                  error: null,
                }),
              }),
            }),
          }),
        });

      const service = new StudentService(mockSupabase);
      await expect(service.deleteStudent("1")).rejects.toThrow(ValidationError);
    });
  });

  describe("Static methods backward compatibility", () => {
    it("should delegate static getStudents to instance method", async () => {
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

      const result = await StudentService.getStudents();
      expect(result.students).toEqual([]);
    });
  });
});
