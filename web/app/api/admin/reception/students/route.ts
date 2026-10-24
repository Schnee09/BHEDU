import { apiSuccess, createGetHandler } from '@/lib/api';
import { ValidationError } from '@/lib/api/errors';
import { createServiceClient } from '@/lib/supabase/server';
import { normalizeReceptionSearch, summarizeStudentFinance } from '@/lib/students/reception360';

const RECEPTION_ROLES = ['staff', 'admin', 'owner', 'super_admin'] as const;

export const GET = createGetHandler(
  { allowedRoles: [...RECEPTION_ROLES] },
  async ({ searchParams }) => {
    const query = normalizeReceptionSearch(searchParams.get('q') || '');
    if (query.length < 2) {
      throw new ValidationError('Nhập ít nhất 2 ký tự để tra cứu học sinh');
    }

    const supabase = createServiceClient();
    const phoneQuery = query.replace(/\D/g, '');
    const filters = [
      `full_name.ilike.%${query}%`,
      `student_code.ilike.%${query}%`,
      `student_id.ilike.%${query}%`,
      `email.ilike.%${query}%`,
      `personal_email.ilike.%${query}%`,
    ];
    if (phoneQuery.length >= 3) {
      filters.push(`phone.ilike.%${phoneQuery}%`);
      if (phoneQuery.length === 10) {
        filters.push(
          `phone.ilike.%${phoneQuery.slice(0, 4)} ${phoneQuery.slice(4, 7)} ${phoneQuery.slice(7)}%`
        );
      }
    }

    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select(
        'id, full_name, student_code, student_id, phone, personal_email, email, grade_level, status, photo_url'
      )
      .eq('role', 'student')
      .is('deleted_at', null)
      .or(filters.join(','))
      .order('full_name')
      .limit(12);

    if (profileError) throw new Error(`Không thể tra cứu học sinh: ${profileError.message}`);
    if (!profiles?.length) return apiSuccess({ query, students: [] });

    const studentIds = profiles.map((profile) => profile.id);
    const [{ data: enrollments, error: enrollmentError }, { data: invoices, error: invoiceError }] =
      await Promise.all([
        supabase
          .from('enrollments')
          .select('id, student_id, class_id, enrollment_date, status')
          .in('student_id', studentIds)
          .eq('status', 'enrolled')
          .is('deleted_at', null),
        supabase
          .from('invoices')
          .select('student_id, total_amount, paid_amount, status, due_date')
          .in('student_id', studentIds)
          .neq('status', 'cancelled'),
      ]);

    if (enrollmentError) throw new Error(`Không thể tải ghi danh: ${enrollmentError.message}`);
    if (invoiceError) throw new Error(`Không thể tải công nợ: ${invoiceError.message}`);

    const classIds = [...new Set((enrollments || []).map((row) => row.class_id))];
    const { data: classes, error: classError } = classIds.length
      ? await supabase.from('classes').select('id, name, schedule, room').in('id', classIds)
      : { data: [], error: null };
    if (classError) throw new Error(`Không thể tải lớp học: ${classError.message}`);

    const classMap = new Map((classes || []).map((classRow) => [classRow.id, classRow]));
    const students = profiles.map((profile) => {
      const studentEnrollments = (enrollments || [])
        .filter((row) => row.student_id === profile.id)
        .map((row) => ({
          id: row.id,
          enrollment_date: row.enrollment_date,
          class: classMap.get(row.class_id) || { id: row.class_id, name: 'Lớp chưa xác định' },
        }));
      const studentInvoices = (invoices || []).filter((row) => row.student_id === profile.id);

      return {
        ...profile,
        active_enrollments: studentEnrollments,
        finance: summarizeStudentFinance(studentInvoices),
      };
    });

    return apiSuccess({ query, students });
  }
);
