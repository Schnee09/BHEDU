import { SupabaseClient } from "@supabase/supabase-js";
import {
    generateTranscript,
    StudentTranscript,
    TranscriptGenerationOptions,
} from "@/lib/grades/transcriptService";
import { SubjectGrade } from "@/lib/grades/gpaCalculator";

export class ReportsRepository {
    private supabase: SupabaseClient;

    constructor(supabase: SupabaseClient) {
        this.supabase = supabase;
    }

    async getTranscript(
        studentId: string,
        options: TranscriptGenerationOptions = {
            includePending: false,
            includeRanking: true,
            language: "vi",
        },
    ): Promise<StudentTranscript | null> {
        // 1. Fetch Student Info
        const { data: student, error: studentError } = await this.supabase
            .from("profiles")
            .select("id, full_name, student_id, date_of_birth, created_at")
            .eq("id", studentId)
            .single();

        if (studentError || !student) return null;

        // 2. Fetch Enrollment (Current Class)
        const { data: enrollment } = await this.supabase
            .from("enrollments")
            .select("class:class_id(id, name)")
            .eq("student_id", studentId)
            .single();

        // 3. Fetch Academic Years
        const { data: academicYears } = await this.supabase
            .from("academic_years")
            .select("id, name, start_date, end_date")
            .order("start_date", { ascending: true });

        // 4. Fetch Grades
        const { data: gradesData } = await this.supabase
            .from("grades")
            .select(`
                id,
                score,
                evaluation_type,
                semester,
                academic_year_id,
                subject:subject_id(id, name, credits),
                class:class_id(id, name),
                created_at
            `)
            .eq("student_id", studentId)
            .order("created_at", { ascending: true });

        const rawGrades = (gradesData || []) as any[];

        // 5. Transform to Semester Data expected by generateTranscript
        const semesterMap = new Map<string, {
            semesterId: string;
            semesterName: string; // HK1 or HK2
            academicYear: string;
            startDate: string;
            endDate: string;
            grades: Map<string, SubjectGrade>;
        }>();

        for (const grade of rawGrades) {
            const yearId = grade.academic_year_id || "unknown";
            const semester = grade.semester || "HK1";
            const key = `${yearId}-${semester}`;

            if (!semesterMap.has(key)) {
                const year = academicYears?.find((y) => y.id === yearId);
                semesterMap.set(key, {
                    semesterId: key,
                    semesterName: semester,
                    academicYear: year?.name || "Unknown",
                    startDate: year?.start_date || "",
                    endDate: year?.end_date || "",
                    grades: new Map(),
                });
            }

            const semData = semesterMap.get(key)!;
            const subjectId = grade.subject?.id || "unknown";
            const subjectName = grade.subject?.name || "Unknown";

            if (!semData.grades.has(subjectId)) {
                semData.grades.set(subjectId, {
                    subjectId,
                    subjectName,
                    credits: (grade.subject as any)?.credits || 1,
                });
            }

            const subjectGrade = semData.grades.get(subjectId)!;
            const evalType = grade.evaluation_type?.toLowerCase() || "";
            const score = grade.score;

            if (score !== null) {
                if (evalType.includes("oral") || evalType.includes("miệng")) {
                    subjectGrade.oralScore = score;
                } else if (evalType.includes("15")) {
                    subjectGrade.fifteenMinScore = score;
                } else if (
                    evalType.includes("45") || evalType.includes("1 tiết")
                ) {
                    subjectGrade.fortyFiveMinScore = score;
                } else if (
                    evalType.includes("midterm") || evalType.includes("giữa")
                ) {
                    subjectGrade.midtermScore = score;
                } else if (
                    evalType.includes("final") || evalType.includes("cuối")
                ) {
                    subjectGrade.finalScore = score;
                }
            }
        }

        const semesterData = Array.from(semesterMap.values()).map((s) => ({
            ...s,
            grades: Array.from(s.grades.values()),
        }));

        // 6. Generate Transcript
        const className = (enrollment as any)?.class?.name || "Chưa phân lớp";

        return generateTranscript(
            {
                studentId: student.id,
                studentCode: student.student_id || "",
                fullName: student.full_name,
                dateOfBirth: student.date_of_birth || "",
                className,
                enrollmentDate: student.created_at?.split("T")[0] || "",
            },
            semesterData,
            options,
        );
    }

    async getAttendanceReport(filters: {
        dateFrom?: string;
        dateTo?: string;
        academicYearId?: string;
        classId?: string;
        courseId?: string;
        limit?: number;
    }) {
        let query = this.supabase
            .from("attendance")
            .select(`
                id, date, status, notes, class_id, student_id,
                student:profiles!student_id(id, full_name),
                class:classes(id, name)
            `)
            .order("date", { ascending: false });

        if (filters.dateFrom) query = query.gte("date", filters.dateFrom);
        if (filters.dateTo) query = query.lte("date", filters.dateTo);
        if (filters.classId) query = query.eq("class_id", filters.classId);

        // Academic Year & Course Logic (requires joining/filtering strategies)
        // Since Supabase join filtering is tricky on nested, we can filter by class list if needed.
        // Assuming 'classes' table has academic_year_id.
        if (filters.academicYearId || filters.courseId) {
            // We need to fetch class IDs first because 'attendance' -> 'class' -> 'academic_year' filter
            // via Postgrest syntax !inner join is possible but complex in strict types sometimes.
            // Let's use the 'in' strategy as per original code, but cleaner.

            let classQuery = this.supabase.from("classes").select("id");
            if (filters.academicYearId) {
                classQuery = classQuery.eq(
                    "academic_year_id",
                    filters.academicYearId,
                );
            }
            if (filters.courseId) {
                classQuery = classQuery.eq("subject_id", filters.courseId);
            }

            const { data: classes } = await classQuery;
            const classIds = classes?.map((c) => c.id) || [];

            if (classIds.length > 0) {
                query = query.in("class_id", classIds);
            } else {
                return { data: [], note: "No classes found for filter" };
            }
        }

        if (filters.limit) {
            query = query.limit(filters.limit);
        }

        const { data, error } = await query;
        if (error) {
            if (
                error.code === "42P01" ||
                error.message?.includes("does not exist")
            ) {
                return { data: [], note: "attendance table not available" };
            }
            throw error;
        }

        return { data: data || [] };
    }

    async getReportCard(
        studentId: string,
        options: { semesterId?: string; academicYearId?: string } = {},
    ) {
        // 1. Fetch basic info (student, enrollment)
        const { data: student, error: studentError } = await this.supabase
            .from("profiles")
            .select("id, full_name, student_id, date_of_birth, gender, email")
            .eq("id", studentId)
            .single();

        if (studentError || !student) return null;

        const { data: enrollment } = await this.supabase
            .from("enrollments")
            .select(`
                class:class_id(id, name)
            `)
            .eq("student_id", studentId)
            .maybeSingle();

        // 2. Fetch Grades
        // If filters provided, apply them
        let gradesQuery = this.supabase
            .from("grades")
            .select(`
                id,
                score,
                evaluation_type,
                subject:subject_id(id, name, credits),
                created_at
            `)
            .eq("student_id", studentId);

        if (options.semesterId) {
            gradesQuery = gradesQuery.eq("semester", options.semesterId);
        }
        if (options.academicYearId) {
            gradesQuery = gradesQuery.eq(
                "academic_year_id",
                options.academicYearId,
            );
        }

        const { data: grades } = await gradesQuery.order("created_at", {
            ascending: false,
        });

        // 3. Fetch Attendance
        // If scoped to semester/year, should filter attendance too.
        // For MVP/Migration, taking simplifying assumption of "all attendance" or "last 6 months"?
        // Real implementations filter by date range of academic year.
        // Let's just fetch all for now to match legacy behavior or simple list.
        const { data: attendance } = await this.supabase
            .from("attendance")
            .select("status")
            .eq("student_id", studentId);

        return {
            student,
            enrollment,
            grades: grades || [],
            attendance: attendance || [],
        };
        // Note: Transformation logic kept in Route or moved here?
        // Moving transformation logic here is cleaner for "Service" pattern,
        // but "Repository" usually returns data.
        // Given the previous pattern with 'getTranscript' returning a complex object,
        // I'll return the raw data components here and let a helper (or this method) format it?
        // Let's follow 'getTranscript' and return the formatted object if possible,
        // BUT I need to import GPA calculator functions.
    }
    async getGradesReport(
        filters: {
            academic_year_id?: string;
            class_id?: string;
            subject_id?: string;
            limit?: number;
        },
    ) {
        let query = this.supabase
            .from("grades")
            .select(
                `id, student_id, class_id, assignment_id, points_earned, max_points, created_at, score, evaluation_type, ` +
                    `assignment:assignments(id, title, max_points), student:profiles(id, full_name), class:classes(id, name)`,
            )
            .order("created_at", { ascending: false });

        if (filters.academic_year_id) {
            query = query.eq("academic_year_id", filters.academic_year_id);
        }
        if (filters.class_id) query = query.eq("class_id", filters.class_id);
        if (filters.subject_id) query = query.eq("subject_id", filters.subject_id);

        // Fetch rows
        // Note: The original code used .limit(limit) only if CSV.
        // We will just fetch reasonable amount or use limit if strict.
        if (filters.limit) {
            query = query.limit(filters.limit);
        }

        const { data, error } = await query;
        if (error) {
            if (
                error.code === "42P01" ||
                error.message?.includes("does not exist")
            ) {
                return { data: [], note: "grades table not available" };
            }
            throw error;
        }

        return { data: data || [] };
    }

    async getStudentDemographicsReport() {
        // Aggregates
        // Parallel queries
        const countsPromise = this.supabase.from("profiles").select("id", {
            count: "exact",
            head: true,
        }).eq("role", "student");
        const activePromise = this.supabase.from("profiles").select("id", {
            count: "exact",
            head: true,
        }).eq("role", "student").eq("is_active", true);
        const inactivePromise = this.supabase.from("profiles").select("id", {
            count: "exact",
            head: true,
        }).eq("role", "student").eq("is_active", false);

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
            .toISOString();
        const newThisMonthPromise = this.supabase.from("profiles").select(
            "id",
            { count: "exact", head: true },
        ).eq("role", "student").gte("created_at", startOfMonth);

        const [countsRes, activeRes, inactiveRes, newMonthRes] = await Promise
            .all([
                countsPromise,
                activePromise,
                inactivePromise,
                newThisMonthPromise,
            ]);

        const total = countsRes.count ?? 0;
        const active = activeRes.count ?? 0;
        const inactive = inactiveRes.count ?? 0;
        const newThisMonth = newMonthRes.count ?? 0;

        // By Grade
        const byGradeRes = await this.supabase.from("profiles").select(
            "grade_level, id",
            { count: "exact" },
        ).eq("role", "student");
        const gradeCounts: Record<string, number> = {};
        (byGradeRes.data || []).forEach((r: any) => {
            const g = r.grade_level || "Unknown";
            gradeCounts[g] = (gradeCounts[g] || 0) + 1;
        });

        // By Gender
        const genderRes = await this.supabase.from("profiles").select(
            "gender, id",
            { count: "exact" },
        ).eq("role", "student");
        const genderCounts: Record<string, number> = {};
        (genderRes.data || []).forEach((r: any) => {
            const g = r.gender || "Unknown";
            genderCounts[g] = (genderCounts[g] || 0) + 1;
        });

        return {
            total,
            active,
            inactive,
            newThisMonth,
            byGrade: gradeCounts,
            byGender: genderCounts,
        };
    }

    async getStudentsForExport(limit: number = 5000) {
        const { data: students, error } = await this.supabase
            .from("profiles")
            .select(
                "id, full_name, email, phone, grade_level, status, created_at",
            )
            .eq("role", "student")
            .order("created_at", { ascending: false })
            .limit(limit);

        if (error) throw error;
        return students || [];
    }
}
