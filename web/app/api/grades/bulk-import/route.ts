/**
 * Bulk Grade Import API (Vietnamese Education System)
 * POST /api/grades/bulk-import
 *
 * Import multiple grades from Excel/CSV
 *
 * Required fields:
 * - class_id: UUID of the class
 * - subject_id: UUID of the subject
 * - component_type: Grade component (oral, fifteen_min, one_period, midterm, final)
 * - semester: Semester identifier ("1" or "2")
 * - grades: Array of { student_id, score, notes? }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { adminAuth } from '@/lib/auth/adminAuth';
import { logger } from '@/lib/logger';

interface GradeInput {
  student_id: string;
  score: number;
  notes?: string;
}

const VALID_COMPONENT_TYPES = ['oral', 'fifteen_min', 'one_period', 'midterm', 'final'];
const VALID_SEMESTERS = ['1', '2'];

export async function POST(request: NextRequest) {
  try {
    const authResult = await adminAuth(request);
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Staff or Admin required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { class_id, subject_id, component_type, semester, grades } = body as {
      class_id: string;
      subject_id: string;
      component_type: string;
      semester: string;
      grades: GradeInput[];
    };

    // Validate required fields
    if (!class_id || !subject_id || !component_type || !semester) {
      return NextResponse.json(
        {
          success: false,
          error: 'class_id, subject_id, component_type, and semester are required',
        },
        { status: 400 }
      );
    }

    if (!grades || !Array.isArray(grades) || grades.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'grades array is required and cannot be empty',
        },
        { status: 400 }
      );
    }

    // Validate component_type
    if (!VALID_COMPONENT_TYPES.includes(component_type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid component_type. Must be one of: ${VALID_COMPONENT_TYPES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate semester
    if (!VALID_SEMESTERS.includes(semester)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid semester. Must be one of: ${VALID_SEMESTERS.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Get students in the class from enrollments
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('student_id, profiles!enrollments_student_id_fkey(id, student_id, full_name)')
      .eq('class_id', class_id)
      .in('status', ['active', 'enrolled']);

    const studentMap = new Map<string, string>();
    enrollments?.forEach((e: any) => {
      if (e.profiles) {
        // Map both profile.id and student_id (mã học sinh) to profile.id
        studentMap.set(e.profiles.id, e.profiles.id);
        if (e.profiles.student_id) {
          studentMap.set(e.profiles.student_id, e.profiles.id);
        }
      }
    });

    // Process grades
    const results = {
      imported: 0,
      failed: 0,
      errors: [] as string[],
    };

    const gradesToUpsert = [];

    for (const grade of grades) {
      // Look up student by ID or student_id code
      const profileId = studentMap.get(grade.student_id);
      if (!profileId) {
        results.failed++;
        results.errors.push(`Không tìm thấy học sinh: ${grade.student_id}`);
        continue;
      }

      // Validate score (Vietnamese 0-10 scale)
      if (grade.score < 0 || grade.score > 10) {
        results.failed++;
        results.errors.push(`Điểm không hợp lệ cho ${grade.student_id}: ${grade.score}`);
        continue;
      }

      gradesToUpsert.push({
        student_id: profileId,
        class_id,
        subject_id,
        component_type,
        semester,
        score: grade.score,
        points_earned: grade.score,
        feedback: grade.notes || null,
        graded_by: authResult.userId,
        graded_at: new Date().toISOString(),
      });
    }

    // Bulk upsert all valid grades
    if (gradesToUpsert.length > 0) {
      const { error } = await supabase.from('grades').upsert(gradesToUpsert, {
        onConflict: 'student_id,class_id,subject_id,component_type,semester',
      });

      if (error) {
        logger.error('Bulk grade import error', { error });
        return NextResponse.json(
          { success: false, error: `Database error: ${error.message}` },
          { status: 500 }
        );
      }

      results.imported = gradesToUpsert.length;
    }

    logger.info('Bulk grade import completed', {
      class_id,
      subject_id,
      component_type,
      semester,
      total: grades.length,
      imported: results.imported,
      failed: results.failed,
      user_id: authResult.userId,
    });

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error: any) {
    logger.error('Error in bulk grade import', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
