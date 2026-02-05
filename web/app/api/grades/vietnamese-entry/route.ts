import {
  apiSuccess,
  createApiHandler,
  createGetHandler,
} from "@/lib/api/apiHandler";
import { gradeService } from "@/lib/services/gradeService";
import { EvaluationType } from "@/lib/grades/types";
import { logger } from "@/lib/logger";

// GET: Fetch students with their grades for a specific class, subject, and semester
export const GET = createGetHandler(
  { permission: "grades.view" },
  async ({ searchParams }) => {
    const classId = searchParams.get("class_id") || searchParams.get("classId");
    const subjectCode = searchParams.get("subject_code") ||
      searchParams.get("subjectCode");
    const semester: any = searchParams.get("semester");

    if (!classId || !semester) {
      return apiSuccess({
        success: false,
        error: "Missing classId or semester",
      });
    }

    // Default subjectCode to classId if not provided (common pattern in this project)
    const targetSubjectCode = subjectCode || classId;

    const students = await gradeService.getGrades(
      classId,
      targetSubjectCode,
      semester,
    );

    // Map back to the structure expected by the frontend
    const mappedStudents = students.map((s) => ({
      id: s.student_id,
      student_code: s.student_code,
      full_name: s.full_name,
      grades: {
        [EvaluationType.MIDTERM]: s.midterm,
        [EvaluationType.FINAL]: s.final,
        average: s.average,
        // Legacy fields (null for now as we transition to Midterm/Final only)
        oral: null,
        fifteen_min: null,
        one_period: null,
      },
    }));

    return apiSuccess({ students: mappedStudents });
  },
);

// POST: Save grades for multiple students
export const POST = createApiHandler(
  {
    permission: "grades.entry",
  },
  async ({ body }) => {
    const { class_id, subject_code, semester, students } = body as any;

    if (!class_id || !semester || !Array.isArray(students)) {
      return apiSuccess({
        success: false,
        error: "Invalid request data",
      }, { _status: 400 });
    }

    const targetSubjectCode = subject_code || class_id;

    const result = await gradeService.saveGrades({
      class_id,
      subject_code: targetSubjectCode,
      semester,
      students: students.map((s: any) => ({
        student_id: s.student_id,
        grades: {
          [EvaluationType.MIDTERM]: s.grades?.[EvaluationType.MIDTERM],
          [EvaluationType.FINAL]: s.grades?.[EvaluationType.FINAL],
        },
      })),
    });

    logger.info("Grades updated via modernized API", {
      classId: class_id,
      subjectCode: targetSubjectCode,
      count: result.count,
    });

    return apiSuccess({
      message: "Grades saved successfully",
      count: result.count,
    });
  },
);
