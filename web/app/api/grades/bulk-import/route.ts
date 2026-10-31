import { NextRequest, NextResponse } from 'next/server';
import { canAccessClass } from '@/lib/auth/classAccess';
import { getAuthContext } from '@/lib/auth/guard';
import { logger } from '@/lib/logger';
import { createServiceClient } from '@/lib/supabase/server';

interface GradeInput {
  student_id: string;
  score: number;
  component_type: 'midterm' | 'final';
  notes?: string;
}

const VALID_COMPONENT_TYPES = new Set(['midterm', 'final']);
const VALID_SEMESTERS = new Set(['1', '2']);

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext(request, 'grades.entry');
    if (!auth.authorized || !auth.profile || !auth.role) {
      const status = auth.reason?.startsWith('Forbidden') ? 403 : 401;
      return NextResponse.json(
        { success: false, error: status === 403 ? 'Forbidden' : 'Unauthorized' },
        { status }
      );
    }

    const body = (await request.json()) as {
      class_id?: string;
      subject_id?: string;
      semester?: string;
      grades?: GradeInput[];
    };
    const { class_id, subject_id, semester, grades } = body;

    if (!class_id || !subject_id || !semester) {
      return NextResponse.json(
        { success: false, error: 'class_id, subject_id, and semester are required' },
        { status: 400 }
      );
    }
    if (!VALID_SEMESTERS.has(semester)) {
      return NextResponse.json({ success: false, error: 'Học kỳ không hợp lệ' }, { status: 400 });
    }
    if (!Array.isArray(grades) || grades.length === 0 || grades.length > 1000) {
      return NextResponse.json(
        { success: false, error: 'Danh sách điểm phải có từ 1 đến 1000 dòng' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    if (!(await canAccessClass(supabase, { id: auth.profile.id, role: auth.role }, class_id))) {
      return NextResponse.json(
        { success: false, error: 'Bạn không có quyền nhập điểm cho lớp này' },
        { status: 403 }
      );
    }

    const { data: enrollments, error: enrollmentError } = await supabase
      .from('enrollments')
      .select(
        'student_id, profiles!enrollments_student_id_fkey(id, student_id, student_code, full_name)'
      )
      .eq('class_id', class_id)
      .in('status', ['active', 'enrolled']);

    if (enrollmentError) {
      logger.error('Unable to load class enrollments for grade import', { enrollmentError });
      return NextResponse.json(
        { success: false, error: 'Không thể tải danh sách học sinh của lớp' },
        { status: 500 }
      );
    }

    const studentMap = new Map<string, string>();
    enrollments?.forEach((enrollment: any) => {
      const profile = enrollment.profiles;
      if (!profile) return;
      studentMap.set(profile.id, profile.id);
      if (profile.student_id) studentMap.set(profile.student_id, profile.id);
      if (profile.student_code) studentMap.set(profile.student_code, profile.id);
    });

    const results = { imported: 0, failed: 0, errors: [] as string[] };
    const gradesToUpsert = [];

    for (const grade of grades) {
      const profileId = studentMap.get(String(grade.student_id || '').trim());
      if (!profileId) {
        results.failed++;
        results.errors.push(`Không tìm thấy học sinh: ${grade.student_id}`);
        continue;
      }
      if (!Number.isFinite(grade.score) || grade.score < 0 || grade.score > 10) {
        results.failed++;
        results.errors.push(`Điểm không hợp lệ cho ${grade.student_id}: ${grade.score}`);
        continue;
      }
      if (!VALID_COMPONENT_TYPES.has(grade.component_type)) {
        results.failed++;
        results.errors.push(`Loại điểm không hợp lệ cho ${grade.student_id}`);
        continue;
      }

      gradesToUpsert.push({
        student_id: profileId,
        class_id,
        subject_id,
        component_type: grade.component_type,
        semester,
        score: grade.score,
        points_earned: grade.score,
        feedback: grade.notes || null,
        graded_by: auth.profile.id,
        graded_at: new Date().toISOString(),
      });
    }

    if (gradesToUpsert.length > 0) {
      const { error } = await supabase.from('grades').upsert(gradesToUpsert, {
        onConflict: 'student_id,class_id,subject_id,component_type,semester',
      });
      if (error) {
        logger.error('Bulk grade import failed', { error });
        return NextResponse.json(
          { success: false, error: 'Không thể lưu dữ liệu điểm' },
          { status: 500 }
        );
      }
      results.imported = gradesToUpsert.length;
    }

    logger.info('Bulk grade import completed', {
      class_id,
      subject_id,
      semester,
      total: grades.length,
      imported: results.imported,
      failed: results.failed,
      user_id: auth.profile.id,
    });
    return NextResponse.json({ success: true, ...results });
  } catch (error: unknown) {
    logger.error('Error in bulk grade import', error);
    return NextResponse.json({ success: false, error: 'Không thể nhập điểm' }, { status: 500 });
  }
}
