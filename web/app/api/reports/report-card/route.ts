import { NextResponse } from "next/server";
import { apiSuccess, createGetHandler } from "@/lib/api";
import { createServiceClient } from "@/lib/supabase/server";
import { ReportsRepository } from "@/lib/repositories/ReportsRepository";
import { reportCardQuerySchema } from "@/lib/schemas";
import { createAbility } from "@/lib/auth/permissions";
import { validateQuery } from "@/lib/api/validation";
import {
  calculateSubjectAverage,
  getLetterGradeFromScore,
} from "@/lib/grades/gpaCalculator";

export const GET = createGetHandler(
  { requireAuth: true },
  async ({ request, user }) => {
    // 1. Validation
    const query = validateQuery(request, reportCardQuerySchema);
    const { studentId, semesterId, academicYearId } = query;

    // 2. Auth Check
    const ability = createAbility({ userId: user.id, role: user.role });
    if (user.role === "student" && user.id !== studentId) {
      if (ability.cannot("read", "Grade")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }
    if (ability.cannot("read", "Grade")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // 3. Data Fetching
    const supabase = createServiceClient();
    const repository = new ReportsRepository(supabase);

    const data = await repository.getReportCard(studentId, {
      semesterId,
      academicYearId,
    });

    if (!data) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const { student, enrollment, grades, attendance } = data;

    // 4. Transformation Logic (Subject grouping & GPA)
    const subjectGrades = new Map<string, {
      name: string;
      credits: number;
      oral?: number;
      fifteenMin?: number;
      fortyFiveMin?: number;
      midterm?: number;
      final?: number;
    }>();

    for (const grade of grades || []) {
      const subjectId = (grade.subject as any)?.id;
      const subjectName = (grade.subject as any)?.name || "Unknown";
      const credits = (grade.subject as any)?.credits || 1;

      if (!subjectId) continue;

      if (!subjectGrades.has(subjectId)) {
        subjectGrades.set(subjectId, { name: subjectName, credits });
      }

      const subject = subjectGrades.get(subjectId)!;
      const evalType = grade.evaluation_type?.toLowerCase() || "";

      // Map scores
      if (evalType.includes("oral") || evalType.includes("miệng")) {
        subject.oral = grade.score;
      } else if (evalType.includes("15") || evalType.includes("kiểm tra 15")) {
        subject.fifteenMin = grade.score;
      } else if (evalType.includes("45") || evalType.includes("1 tiết")) {
        subject.fortyFiveMin = grade.score;
      } else if (evalType.includes("midterm") || evalType.includes("giữa kỳ")) {
        subject.midterm = grade.score;
      } else if (evalType.includes("final") || evalType.includes("cuối kỳ")) {
        subject.final = grade.score;
      }
    }

    // Calculate averages
    const subjects = Array.from(subjectGrades.entries()).map(([id, data]) => {
      const gradeData = {
        subjectId: id,
        subjectName: data.name,
        credits: data.credits,
        oralScore: data.oral,
        fifteenMinScore: data.fifteenMin,
        fortyFiveMinScore: data.fortyFiveMin,
        midtermScore: data.midterm,
        finalScore: data.final,
      };

      const avg = calculateSubjectAverage(gradeData);

      return {
        name: data.name,
        oralScore: data.oral,
        fifteenMinScore: data.fifteenMin,
        fortyFiveMinScore: data.fortyFiveMin,
        midtermScore: data.midterm,
        finalScore: data.final,
        averageScore: avg || 0,
        letterGrade: avg ? getLetterGradeFromScore(avg) : "N/A",
      };
    });

    // Calculate overall GPA
    const validSubjects = subjects.filter((s) => s.averageScore > 0);
    const semesterGPA = validSubjects.length > 0
      ? validSubjects.reduce((sum, s) => sum + s.averageScore, 0) /
        validSubjects.length
      : 0;

    // Calculate Attendance Rate
    const totalDays = attendance.length;
    const presentDays =
      attendance.filter((a: any) =>
        a.status === "present" || a.status === "late"
      ).length;
    // Note: If totalDays is 0, we might want to show N/A or 100%.
    const attendanceRate = totalDays > 0
      ? (presentDays / totalDays) * 100
      : 100;

    const className = (enrollment?.class as any)?.name || "Chưa phân lớp";

    // Conduct Grade (Simplified logic)
    const conductGrade = semesterGPA >= 8.0
      ? "Tốt"
      : semesterGPA >= 6.5
      ? "Khá"
      : semesterGPA >= 5.0
      ? "Trung bình"
      : "Yếu";

    const reportCardData = {
      studentName: student.full_name,
      studentCode: student.student_id || "",
      className: className,
      dateOfBirth: student.date_of_birth || "",
      gender: student.gender || "",
      subjects,
      semesterGPA,
      attendanceRate,
      conductGrade,
    };

    return apiSuccess(reportCardData);
  },
);
