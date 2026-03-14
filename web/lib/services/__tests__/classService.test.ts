/**
 * Tests for ClassService
 */

import { ClassService, classService } from "@/lib/services/classService";
import { NotFoundError, ValidationError } from "@/lib/api/errors";

// Mock Supabase client
jest.mock("@/lib/supabase/server", () => ({
    createClient: jest.fn(),
    createServiceClient: jest.fn(),
}));

import { createServiceClient } from "@/lib/supabase/server";

describe("ClassService", () => {
    let mockSupabase: any;

    beforeEach(() => {
        jest.clearAllMocks();

        mockSupabase = {
            from: jest.fn(),
        };

        (createServiceClient as jest.Mock).mockReturnValue(mockSupabase);
        classService.setSupabase(mockSupabase);
    });

    describe("getClasses", () => {
        it("should return paginated classes", async () => {
            const mockClasses = [
                { id: "1", name: "Class A", course_id: "c1", teacher_id: "t1" },
                { id: "2", name: "Class B", course_id: "c2", teacher_id: "t2" },
            ];

            mockSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    range: jest.fn().mockReturnValue({
                        order: jest.fn().mockResolvedValue({
                            data: mockClasses,
                            error: null,
                            count: 2,
                        }),
                    }),
                }),
            });

            const service = new ClassService(mockSupabase);
            const result = await service.getClasses({ page: 1, pageSize: 20 });

            expect(result.classes).toEqual(mockClasses);
            expect(result.total).toBe(2);
            expect(result.page).toBe(1);
            expect(result.pageSize).toBe(20);
            expect(mockSupabase.from).toHaveBeenCalledWith("classes");
        });

        it("should filter classes by teacherId", async () => {
            const teacherId = "teacher-123";
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

            const service = new ClassService(mockSupabase);
            await service.getClasses({ teacherId });

            expect(mockSupabase.from).toHaveBeenCalledWith("classes");
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

            const service = new ClassService(mockSupabase);
            await expect(service.getClasses()).rejects.toThrow(
                "Failed to fetch classes",
            );
        });
    });

    describe("getClassById", () => {
        it("should return a class with enrollment count", async () => {
            const mockClass = {
                id: "1",
                name: "Math Class",
                teacher_id: "t1",
                course_id: "c1",
                academic_year_id: "ay1",
            };

            // Mock class fetch
            mockSupabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: mockClass,
                            error: null,
                        }),
                    }),
                }),
            });

            // Mock enrollment count
            mockSupabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockResolvedValue({
                            count: 15,
                            error: null,
                        }),
                    }),
                }),
            });

            const service = new ClassService(mockSupabase);
            const result = await service.getClassById("1");

            expect(result.id).toBe("1");
            expect(result.name).toBe("Math Class");
            expect(result._count?.enrollments).toBe(15);
        });

        it("should throw NotFoundError when class does not exist", async () => {
            mockSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: null,
                            error: { code: "PGRST116" },
                        }),
                    }),
                }),
            });

            const service = new ClassService(mockSupabase);
            await expect(service.getClassById("999")).rejects.toThrow(
                NotFoundError,
            );
        });
    });

    describe("createClass", () => {
        const validInput = {
            name: "New Class",
            course_id: "course-1",
            teacher_id: "teacher-1",
            academic_year_id: "year-1",
            schedule: "Mon-Wed-Fri",
            room: "Room 101",
            status: "active" as const,
            capacity: 40,
        };

        it("should create a new class", async () => {
            // Mock teacher check
            mockSupabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: { id: "teacher-1", role: "teacher" },
                            error: null,
                        }),
                    }),
                }),
            });

            // Mock academic year check
            mockSupabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: { id: "year-1" },
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
                            data: { id: "new-class-1", ...validInput },
                            error: null,
                        }),
                    }),
                }),
            });

            const service = new ClassService(mockSupabase);
            const result = await service.createClass(validInput);

            expect(result).toMatchObject(validInput);
        });

        it("should throw ValidationError when teacher is not found", async () => {
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

            const service = new ClassService(mockSupabase);
            await expect(service.createClass(validInput)).rejects.toThrow(
                ValidationError,
            );
        });

        it("should throw ValidationError when teacher has invalid role", async () => {
            // Mock teacher check (invalid role)
            mockSupabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: { id: "teacher-1", role: "student" },
                            error: null,
                        }),
                    }),
                }),
            });

            const service = new ClassService(mockSupabase);
            await expect(service.createClass(validInput)).rejects.toThrow(
                ValidationError,
            );
        });
    });

    describe("deleteClass", () => {
        it("should delete a class with no enrollments", async () => {
            // Mock getClassById
            mockSupabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: { id: "1", name: "Class A" },
                            error: null,
                        }),
                    }),
                }),
            });

            // Mock enrollment count for getClassById
            mockSupabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockResolvedValue({
                            count: 0,
                            error: null,
                        }),
                    }),
                }),
            });

            // Mock enrollments check
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

            const service = new ClassService(mockSupabase);
            await service.deleteClass("1");

            expect(mockSupabase.from).toHaveBeenCalledWith("classes");
        });

        it("should throw ValidationError when class has enrollments", async () => {
            // Mock getClassById
            mockSupabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: { id: "1", name: "Class A" },
                            error: null,
                        }),
                    }),
                }),
            });

            // Mock enrollment count for getClassById
            mockSupabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockResolvedValue({
                            count: 5,
                            error: null,
                        }),
                    }),
                }),
            });

            // Mock enrollments check (has enrollments)
            mockSupabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        limit: jest.fn().mockResolvedValue({
                            data: [{ id: "enroll-1" }],
                            error: null,
                        }),
                    }),
                }),
            });

            const service = new ClassService(mockSupabase);
            await expect(service.deleteClass("1")).rejects.toThrow(
                ValidationError,
            );
        });
    });

    describe("Static methods backward compatibility", () => {
        it("should delegate static getClasses to instance method", async () => {
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

            // Static method should work
            const result = await ClassService.getClasses();
            expect(result.classes).toEqual([]);
        });
    });
});
