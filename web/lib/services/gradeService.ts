/**
 * Grade Service - Student academic performance management
 *
 * Architecture v5.0 (Instance-based)
 * Consolidates Vietnamese education system (Midterm/Final) logic.
 */

import { createServiceClient } from "@/lib/supabase/server";
import {
    ConflictError,
    NotFoundError,
    ValidationError,
} from "@/lib/api/errors";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
    calculateAverageGrade,
    EvaluationType,
    type Semester,
} from "@/lib/grades/types";

export interface GradeEntry {
    student_id: string;
    midterm?: number | null;
    final?: number | null;
    average?: number | null;
}

export interface SaveGradesInput {
    class_id: string;
    subject_code: string;
    semester: Semester;
    students: {
        student_id: string;
        grades: {
            [EvaluationType.MIDTERM]?: number | null;
            [EvaluationType.FINAL]?: number | null;
        };
    }[];
}

export class GradeService {
    private supabase: SupabaseClient;

    constructor(supabase?: SupabaseClient) {
        this.supabase = supabase || createServiceClient();
    }

    /**
     * Get grades for a class, subject, and semester
     */
    async getGrades(classId: string, subjectCode: string, semester: Semester) {
        // 1. Get subject ID from code
        const { data: subject } = await this.supabase
            .from("subjects")
            .select("id")
            .eq("code", subjectCode.toUpperCase())
            .single();

        if (!subject) {
            throw new NotFoundError(`Không tìm thấy môn học: ${subjectCode}`);
        }

        // 2. Get grades joined with profiles
        const { data, error } = await this.supabase
            .from("grades")
            .select(`
        student_id,
        evaluation_type,
        grade_value,
        student:profiles!grades_student_id_fkey(full_name, student_code)
      `)
            .eq("class_id", classId)
            .eq("subject_id", subject.id)
            .eq("semester", semester);

        if (error) throw error;

        // 3. Transform into row-based structure (one row per student)
        const studentMap = new Map<string, any>();

        (data || []).forEach((record: any) => {
            const student = Array.isArray(record.student)
                ? record.student[0]
                : record.student;
            if (!student) return;

            if (!studentMap.has(record.student_id)) {
                studentMap.set(record.student_id, {
                    student_id: record.student_id,
                    full_name: student.full_name,
                    student_code: student.student_code,
                    midterm: null,
                    final: null,
                    average: null,
                });
            }

            const row = studentMap.get(record.student_id);
            if (record.evaluation_type === EvaluationType.MIDTERM) {
                row.midterm = record.grade_value;
            } else if (record.evaluation_type === EvaluationType.FINAL) {
                row.final = record.grade_value;
            }

            row.average = calculateAverageGrade(row.midterm, row.final);
        });

        return Array.from(studentMap.values());
    }

    /**
     * Save grades in bulk
     */
    async saveGrades(input: SaveGradesInput) {
        const { class_id, subject_code, semester, students } = input;

        // 1. Get subject ID
        const { data: subject } = await this.supabase
            .from("subjects")
            .select("id")
            .eq("code", subject_code.toUpperCase())
            .single();

        if (!subject) {
            throw new NotFoundError(`Không tìm thấy môn học: ${subject_code}`);
        }

        const recordsToInsert = [];

        for (const s of students) {
            if (s.grades[EvaluationType.MIDTERM] !== undefined) {
                recordsToInsert.push({
                    student_id: s.student_id,
                    class_id,
                    subject_id: subject.id,
                    semester,
                    evaluation_type: EvaluationType.MIDTERM,
                    grade_value: s.grades[EvaluationType.MIDTERM],
                });
            }
            if (s.grades[EvaluationType.FINAL] !== undefined) {
                recordsToInsert.push({
                    student_id: s.student_id,
                    class_id,
                    subject_id: subject.id,
                    semester,
                    evaluation_type: EvaluationType.FINAL,
                    grade_value: s.grades[EvaluationType.FINAL],
                });
            }
        }

        if (recordsToInsert.length === 0) return { success: true, count: 0 };

        // 2. Upsert grades
        const { error } = await this.supabase
            .from("grades")
            .upsert(recordsToInsert, {
                onConflict:
                    "student_id,class_id,subject_id,semester,evaluation_type",
            });

        if (error) throw error;

        return { success: true, count: recordsToInsert.length };
    }

    /**
     * Get student transcript for an academic year (or all time)
     */
    async getStudentTranscript(studentId: string, academicYearId?: string) {
        let query = this.supabase
            .from("grades")
            .select(`
        grade_value,
        evaluation_type,
        semester,
        class:classes!grades_class_id_fkey(name),
        subject:subjects!grades_subject_id_fkey(name, code)
      `)
            .eq("student_id", studentId);

        if (academicYearId) {
            // Need to join classes to filter by academic year if not in grades table
            // Assuming grades table doesn't have academic_year_id directly but classes does
        }

        const { data, error } = await query;
        if (error) throw error;

        return data;
    }

    // ===================================
    // STATIC METHODS (Compatibility)
    // ===================================

    static async getGrades(
        classId: string,
        subjectCode: string,
        semester: Semester,
    ) {
        return gradeService.getGrades(classId, subjectCode, semester);
    }

    static async getStudentsWithGrades(
        classId: string,
        subjectCode: string,
        semester: Semester,
    ) {
        const students = await gradeService.getGrades(
            classId,
            subjectCode,
            semester,
        );
        return { students };
    }

    static async saveGrades(input: SaveGradesInput) {
        const result = await gradeService.saveGrades(input);
        return { ...result, ok: true };
    }
}

export const gradeService = new GradeService();
