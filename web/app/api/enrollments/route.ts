import {
  apiSuccess,
  createApiHandler,
  createGetHandler,
} from "@/lib/api/apiHandler";
import { enrollmentService } from "@/lib/services/EnrollmentService";
import { enrollmentQuerySchema } from "@/lib/schemas";
import { logger } from "@/lib/logger";
import { ValidationError } from "@/lib/api/errors";

// GET /api/enrollments
export const GET = createGetHandler(
  { permission: "enrollments.view" },
  async ({ searchParams }) => {
    // Validate and normalize query params
    const query = enrollmentQuerySchema.safeParse({
      class_id: searchParams.get("classId") || searchParams.get("class_id"),
      student_id: searchParams.get("studentId") ||
        searchParams.get("student_id"),
      status: searchParams.get("status"),
      page: searchParams.get("page"),
      limit: searchParams.get("limit") || searchParams.get("pageSize"),
    });

    const validatedQuery = query.success ? query.data : {
      page: 1,
      limit: 50,
      status: "enrolled" as const,
      sort: "created_at",
      order: "desc" as const,
    };

    const result = await enrollmentService.getEnrollments(validatedQuery);
    return apiSuccess(result);
  },
);

// POST /api/enrollments
export const POST = createApiHandler(
  {
    permission: "enrollments.manage",
  },
  async ({ body }) => {
    const {
      studentId,
      classId,
      studentIds,
      student_id,
      class_id,
      student_ids,
    } = body as any;

    const targetClassId = classId || class_id;
    if (!targetClassId) {
      throw new ValidationError("Mã lớp là bắt buộc");
    }

    // Bulk enrollment
    const targetStudentIds = studentIds || student_ids;
    if (targetStudentIds && Array.isArray(targetStudentIds)) {
      const result = await enrollmentService.bulkEnroll(
        targetClassId,
        targetStudentIds,
      );
      logger.info("Bulk enrollment completed", {
        classId: targetClassId,
        ...result,
      });

      return apiSuccess({
        message: `Đã ghi danh ${result.success || 0} học sinh, ${
          result.failed || 0
        } thất bại`,
        enrolledCount: result.success,
        failedCount: result.failed,
        errors: result.errors,
      });
    }

    // Single enrollment
    const targetStudentId = studentId || student_id;
    if (!targetStudentId) {
      throw new ValidationError("Mã học sinh là bắt buộc");
    }

    const enrollment = await enrollmentService.createEnrollment({
      student_id: targetStudentId,
      class_id: targetClassId,
      status: "enrolled",
    });

    return apiSuccess({ enrollment });
  },
);
