/**
 * Tests for TuitionService
 */

import { TuitionService, tuitionService } from "@/lib/services/tuitionService";

// Mock Supabase client
jest.mock("@/lib/supabase/server", () => ({
    createClient: jest.fn(),
    createServiceClient: jest.fn(),
}));

import { createServiceClient } from "@/lib/supabase/server";

describe("TuitionService", () => {
    let mockSupabase: any;

    beforeEach(() => {
        jest.clearAllMocks();

        mockSupabase = {
            from: jest.fn(),
        };

        (createServiceClient as jest.Mock).mockReturnValue(mockSupabase);
    });

    describe("getTuitionRates", () => {
        it("should return active tuition rates", async () => {
            const mockRates = [
                {
                    id: "1",
                    class_type: "group",
                    sessions_per_week: 2,
                    monthly_fee: 800000,
                    is_active: true,
                },
                {
                    id: "2",
                    class_type: "tutoring",
                    sessions_per_week: 2,
                    monthly_fee: 1200000,
                    is_active: true,
                },
            ];

            mockSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        order: jest.fn().mockReturnValue({
                            order: jest.fn().mockResolvedValue({
                                data: mockRates,
                                error: null,
                            }),
                        }),
                    }),
                }),
            });

            const service = new TuitionService(mockSupabase);
            const result = await service.getTuitionRates();

            expect(result).toHaveLength(2);
            expect(result[0].classType).toBe("group");
            expect(result[0].monthlyFee).toBe(800000);
            expect(result[1].classType).toBe("tutoring");
        });

        it("should throw error when database fails", async () => {
            mockSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        order: jest.fn().mockReturnValue({
                            order: jest.fn().mockResolvedValue({
                                data: null,
                                error: { message: "Database error" },
                            }),
                        }),
                    }),
                }),
            });

            const service = new TuitionService(mockSupabase);
            await expect(service.getTuitionRates()).rejects.toThrow(
                "Failed to fetch tuition rates",
            );
        });
    });

    describe("getClassTuition", () => {
        it("should return tuition for a class", async () => {
            // Mock class fetch
            mockSupabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: {
                                id: "1",
                                class_type: "group",
                                sessions_per_week: 2,
                            },
                            error: null,
                        }),
                    }),
                }),
            });

            // Mock rate fetch
            mockSupabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                single: jest.fn().mockResolvedValue({
                                    data: { monthly_fee: 800000 },
                                    error: null,
                                }),
                            }),
                        }),
                    }),
                }),
            });

            const service = new TuitionService(mockSupabase);
            const result = await service.getClassTuition("1");

            expect(result).toBe(800000);
        });

        it("should return 0 when class not found", async () => {
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

            const service = new TuitionService(mockSupabase);
            const result = await service.getClassTuition("999");

            expect(result).toBe(0);
        });
    });

    describe("calculateStudentTuition", () => {
        it("should calculate total monthly tuition", async () => {
            // Mock enrollments
            mockSupabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockResolvedValue({
                            data: [
                                {
                                    class: {
                                        id: "c1",
                                        name: "Math",
                                        class_type: "group",
                                        sessions_per_week: 2,
                                    },
                                },
                                {
                                    class: {
                                        id: "c2",
                                        name: "Physics",
                                        class_type: "tutoring",
                                        sessions_per_week: 2,
                                    },
                                },
                            ],
                            error: null,
                        }),
                    }),
                }),
            });

            // Mock rates for getTuitionRates
            mockSupabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        order: jest.fn().mockReturnValue({
                            order: jest.fn().mockResolvedValue({
                                data: [
                                    {
                                        id: "1",
                                        class_type: "group",
                                        sessions_per_week: 2,
                                        monthly_fee: 800000,
                                        is_active: true,
                                    },
                                    {
                                        id: "2",
                                        class_type: "tutoring",
                                        sessions_per_week: 2,
                                        monthly_fee: 1200000,
                                        is_active: true,
                                    },
                                ],
                                error: null,
                            }),
                        }),
                    }),
                }),
            });

            const service = new TuitionService(mockSupabase);
            const result = await service.calculateStudentTuition("student-1");

            expect(result.totalMonthly).toBe(2000000); // 800k + 1200k
            expect(result.classes).toHaveLength(2);
            expect(result.classes[0].className).toBe("Math");
            expect(result.classes[1].className).toBe("Physics");
        });

        it("should return 0 for student with no enrollments", async () => {
            // Mock empty enrollments
            mockSupabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockResolvedValue({
                            data: [],
                            error: null,
                        }),
                    }),
                }),
            });

            // Mock rates
            mockSupabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        order: jest.fn().mockReturnValue({
                            order: jest.fn().mockResolvedValue({
                                data: [],
                                error: null,
                            }),
                        }),
                    }),
                }),
            });

            const service = new TuitionService(mockSupabase);
            const result = await service.calculateStudentTuition(
                "student-empty",
            );

            expect(result.totalMonthly).toBe(0);
            expect(result.classes).toHaveLength(0);
        });
    });

    describe("updateTuitionRate", () => {
        it("should update tuition rate", async () => {
            mockSupabase.from.mockReturnValue({
                update: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockResolvedValue({
                            error: null,
                        }),
                    }),
                }),
            });

            const service = new TuitionService(mockSupabase);
            await service.updateTuitionRate("group", 2, 900000);

            expect(mockSupabase.from).toHaveBeenCalledWith("tuition_config");
        });

        it("should throw error when update fails", async () => {
            mockSupabase.from.mockReturnValue({
                update: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockResolvedValue({
                            error: { message: "Update failed" },
                        }),
                    }),
                }),
            });

            const service = new TuitionService(mockSupabase);
            await expect(service.updateTuitionRate("group", 2, 900000))
                .rejects.toThrow("Failed to update tuition rate");
        });
    });

    describe("Static methods backward compatibility", () => {
        it("should delegate static getTuitionRates to instance method", async () => {
            mockSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        order: jest.fn().mockReturnValue({
                            order: jest.fn().mockResolvedValue({
                                data: [],
                                error: null,
                            }),
                        }),
                    }),
                }),
            });

            const result = await TuitionService.getTuitionRates();
            expect(result).toEqual([]);
        });
    });
});
