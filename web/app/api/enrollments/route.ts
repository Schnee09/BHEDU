import {
  apiSuccess,
  createApiHandler,
  createGetHandler,
} from "@/lib/api/apiHandler";
import { enrollmentQuerySchema } from "@/lib/schemas";
import { logger } from "@/lib/logger";
import { ValidationError } from "@/lib/api/errors";
import { EnrollmentRepository } from "@/lib/repositories/EnrollmentRepository";
import { getDataClient } from "@/lib/auth/dataClient";

// GET /api/enrollments
export const GET = createGetHandler(
  { permission: "enrollments.view" },
  async ({ searchParams, request }) => {
    const { supabase } = await getDataClient(request);
    const repository = new EnrollmentRepository(supabase);

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

    const result = await repository.findAll(validatedQuery);
    return apiSuccess({
      data: result.data,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    });
  },
);

// POST /api/enrollments
export const POST = createApiHandler(
  {
    permission: "enrollments.manage",
  },
  async ({ body, request }) => {
    const { supabase } = await getDataClient(request);
    const repository = new EnrollmentRepository(supabase);

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
      const result = await repository.createBulk({
        class_id: targetClassId,
        student_ids: targetStudentIds,
      });
      
      const successCount = result.filter(r => r.status === 'enrolled').length;
      const failedCount = result.length - successCount;

      logger.info("Bulk enrollment completed", {
        classId: targetClassId,
        successCount,
        failedCount,
      });

      return apiSuccess({
        message: `Đã ghi danh ${successCount} học sinh, ${failedCount} thất bại`,
        enrolledCount: successCount,
        failedCount: failedCount,
        results: result,
      });
    }

    // Single enrollment
    const targetStudentId = studentId || student_id;
    if (!targetStudentId) {
      throw new ValidationError("Mã học sinh là bắt buộc");
    }

    const enrollment = await repository.create({
      student_id: targetStudentId,
      class_id: targetClassId,
      status: "enrolled",
    });

    return apiSuccess({ enrollment });
  },
);
