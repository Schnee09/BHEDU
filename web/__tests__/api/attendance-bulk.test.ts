/**
 * @jest-environment node
 */
import { POST } from "@/app/api/attendance/bulk/route";
import { AttendanceRepository } from "@/lib/repositories/AttendanceRepository";

// Mock dependencies
jest.mock("@/lib/repositories/AttendanceRepository");

// Mock auth guard to bypass 401
jest.mock("@/lib/auth/guard", () => ({
    getAuthContext: jest.fn().mockResolvedValue({
        authorized: true,
        profile: { id: "mock-user-id", email: "test@example.com" },
        role: "teacher", // valid role for the endpoint
    }),
}));

describe("POST /api/attendance/bulk", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const createMockRequest = (body: any) => {
        const req: any = new Request("http://localhost/api/attendance/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        // Add nextUrl which apiHandler expects
        req.nextUrl = {
            pathname: "/api/attendance/bulk",
            searchParams: new URLSearchParams(),
        };
        return req;
    };

    it("rejects missing or invalid payload (Zod validation)", async () => {
        const req = createMockRequest({ invalidField: true });

        const res: any = await POST(
            req,
            { params: Promise.resolve({}) } as any,
        );
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.success).toBe(false);
    });

    it("calls repository.createBulk and returns success for valid payload", async () => {
        const mockCreateBulk = jest.fn().mockResolvedValue({ count: 2 });
        (AttendanceRepository as jest.Mock).mockImplementation(() => ({
            createBulk: mockCreateBulk,
        }));

        const req = createMockRequest({
            classId: "123e4567-e89b-12d3-a456-426614174000",
            date: "2023-10-01",
            records: [
                {
                    studentId: "223e4567-e89b-12d3-a456-426614174000",
                    status: "present",
                    remarks: "On time",
                },
            ],
        });

        const res: any = await POST(
            req,
            { params: Promise.resolve({}) } as any,
        );
        expect(res.status).toBe(200);
        const json = await res.json();

        expect(json.success).toBe(true);
        expect(mockCreateBulk).toHaveBeenCalledWith({
            class_id: "123e4567-e89b-12d3-a456-426614174000",
            date: "2023-10-01",
            records: [{
                student_id: "223e4567-e89b-12d3-a456-426614174000",
                status: "present",
                notes: "On time",
            }],
            marked_by: "mock-user-id",
        });
    });
});
