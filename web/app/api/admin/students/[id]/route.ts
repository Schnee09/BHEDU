import { apiSuccess, createApiHandler, createGetHandler } from "@/lib/api";
import { updateStudentSchema } from "@/lib/schemas";
import { createServiceClient } from "@/lib/supabase/server";
import { StudentRepository } from "@/lib/repositories/StudentRepository";
import { userService } from "@/lib/services/userService";
import { studentService } from "@/lib/services/studentService";

// GET /api/admin/students/[id]
export const GET = createGetHandler(
  { permission: "students.view" },
  async ({ params }) => {
    // Use service to fetch student with enrollments
    const student = await studentService.getStudentById(params.id);

    return apiSuccess(student);
  },
);

// PUT /api/admin/students/[id]
export const PUT = createApiHandler(
  {
    permission: "students.edit",
    bodySchema: updateStudentSchema,
  },
  async ({ params, body, user }) => {
    const id = params.id;

    // Use service for centralized update logic
    const updatedStudent = await studentService.updateStudent(id, body as any);

    return apiSuccess(updatedStudent, {
      message: "Thông tin học sinh đã được cập nhật thành công.",
    });
  },
);

// DELETE /api/admin/students/[id]
export const DELETE = createApiHandler(
  { permission: "students.delete" },
  async ({ params, user }) => {
    // Soft delete via service
    await studentService.deleteStudent(params.id);

    return apiSuccess(null, {
      message: "Học sinh đã được chuyển vào kho lưu trữ (tạm khóa).",
    });
  },
);
