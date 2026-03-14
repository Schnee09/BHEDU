import { EnrollmentService } from "../enrollmentService";
import { EnrollmentRepository } from "@/lib/repositories/EnrollmentRepository";
import { ConflictError } from "@/lib/api/errors";

// Mock the repository
jest.mock("@/lib/repositories/EnrollmentRepository");

describe("EnrollmentService", () => {
    let service: EnrollmentService;
    let mockRepository: jest.Mocked<EnrollmentRepository>;

    beforeEach(() => {
        // Clear all instances and calls to constructor and all methods:
        (EnrollmentRepository as jest.Mock).mockClear();

        // Create new service which will instantiate the mocked repository
        service = new EnrollmentService({} as any);
        mockRepository = (EnrollmentRepository as jest.Mock).mock
            .instances[0] as any;
    });

    describe("createEnrollment", () => {
        it("throws ConflictError if student is already enrolled in the class", async () => {
            mockRepository.isEnrolled = jest.fn().mockResolvedValue(true);

            await expect(
                service.createEnrollment({
                    student_id: "student-1",
                    class_id: "class-1",
                    status: "enrolled",
                }),
            ).rejects.toThrow(ConflictError);

            expect(mockRepository.create).not.toHaveBeenCalled();
        });

        it("creates an enrollment successfully if student is not enrolled", async () => {
            mockRepository.isEnrolled = jest.fn().mockResolvedValue(false);
            mockRepository.create = jest.fn().mockResolvedValue({
                id: "enrollment-1",
            });

            const result = await service.createEnrollment({
                student_id: "student-1",
                class_id: "class-1",
                status: "enrolled",
            });

            expect(mockRepository.create).toHaveBeenCalledWith({
                student_id: "student-1",
                class_id: "class-1",
                status: "enrolled",
            });
            expect(result.id).toBe("enrollment-1");
        });
    });

    describe("bulkEnroll", () => {
        it("calls repository createBulk with correct mapping", async () => {
            mockRepository.createBulk = jest.fn().mockResolvedValue(undefined);

            const result = await service.bulkEnroll("class-1", [
                "student-1",
                "student-2",
            ]);

            expect(mockRepository.createBulk).toHaveBeenCalledWith({
                class_id: "class-1",
                student_ids: ["student-1", "student-2"],
            });

            // The current implementation sets success equal to the passed array length
            expect(result.success).toBe(2);
            expect(result.failed).toBe(0);
        });
    });

    describe("transferStudent", () => {
        it("throws Error if the student is not enrolled in the source class", async () => {
            mockRepository.findByStudentAndClass = jest.fn().mockResolvedValue(
                null,
            );

            await expect(
                service.transferStudent(
                    "student-1",
                    "from-class-1",
                    "to-class-2",
                ),
            ).rejects.toThrow("Student not enrolled in source class");

            expect(mockRepository.delete).not.toHaveBeenCalled();
            expect(mockRepository.create).not.toHaveBeenCalled();
        });

        it("transfers the student by deleting the old enrollment and creating a new one", async () => {
            mockRepository.findByStudentAndClass = jest.fn().mockResolvedValue({
                id: "old-enrollment",
            });
            mockRepository.delete = jest.fn().mockResolvedValue(undefined);
            mockRepository.create = jest.fn().mockResolvedValue({
                id: "new-enrollment",
            });

            await service.transferStudent(
                "student-1",
                "from-class-1",
                "to-class-2",
            );

            expect(mockRepository.delete).toHaveBeenCalledWith(
                "old-enrollment",
            );
            expect(mockRepository.create).toHaveBeenCalledWith({
                student_id: "student-1",
                class_id: "to-class-2",
                status: "enrolled",
            });
        });
    });
});
