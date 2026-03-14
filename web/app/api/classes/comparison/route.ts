import { NextResponse } from "next/server";
import { apiSuccess, createGetHandler, serverError } from "@/lib/api";
import { createServiceClient } from "@/lib/supabase/server";

// Cache for 1 hour
export const revalidate = 3600;

export const GET = createGetHandler(
    { requireAuth: true },
    async ({ request, user }) => {
        const supabase = createServiceClient();

        // Teachers only see their own classes; admins see all (pass null)
        const { data: classes, error } = await supabase.rpc(
            "get_class_averages",
            { p_teacher_id: user.role === "teacher" ? user.id : null },
        );

        if (error) {
            console.error("Error fetching class averages:", error);
            return serverError("Failed to fetch class comparison metrics");
        }

        const formattedClasses = (classes || []).map((cls: any) => ({
            classId: cls.class_id,
            className: cls.class_name,
            teacherName: cls.teacher_name,
            studentCount: parseInt(cls.student_count) || 0,
            averageGPA: parseFloat(cls.average_gpa) || 0,
            attendanceRate: parseFloat(cls.attendance_rate) || 0,
            passRate: parseFloat(cls.pass_rate) || 0,
        }));

        return apiSuccess({ classes: formattedClasses });
    },
);
