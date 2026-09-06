/**
 * Student Request Service - Business logic & automated workflows for student requests
 * Connects requests with notification dispatch and attendance automation
 */

import { createServiceClient } from '@/lib/supabase/server';
import {
  studentRequestRepository,
  StudentRequest,
  CreateRequestInput,
  ReviewRequestInput,
} from '@/lib/repositories/StudentRequestRepository';
import type { SupabaseClient } from '@supabase/supabase-js';

export class StudentRequestService {
  private supabase: SupabaseClient;

  constructor(supabase?: SupabaseClient) {
    this.supabase = supabase || createServiceClient();
  }

  /**
   * Submit a new student request and trigger teacher notifications
   */
  async submitRequest(input: CreateRequestInput): Promise<StudentRequest | null> {
    const request = await studentRequestRepository.create(input);
    if (!request) return null;

    // Send notification to class teacher / staff
    try {
      if (input.class_id) {
        const { data: cls } = await this.supabase
          .from('classes')
          .select('id, name, teacher_id')
          .eq('id', input.class_id)
          .maybeSingle();

        if (cls && cls.teacher_id) {
          const typeLabel =
            input.request_type === 'leave_absence'
              ? 'Đơn xin nghỉ phép'
              : input.request_type === 'makeup_class'
                ? 'Đơn xin học bù'
                : input.request_type === 'class_transfer'
                  ? 'Đơn xin chuyển lớp'
                  : 'Đơn bảo lưu';

          const studentName = request.student?.full_name || 'Học sinh';

          await this.supabase.from('notifications').insert({
            user_id: cls.teacher_id,
            title: `${typeLabel} mới từ ${studentName}`,
            message: `${studentName} (Lớp ${cls.name}) vừa gửi ${typeLabel.toLowerCase()}${
              input.request_date ? ` cho ngày ${input.request_date}` : ''
            }. Lý do: ${input.reason}`,
            type: 'info',
            category: 'academic',
            link: '/dashboard/requests',
            is_read: false,
          });
        }
      }
    } catch (notifyErr) {
      console.warn('Failed to send notification for student request:', notifyErr);
    }

    return request;
  }

  /**
   * Review request: update status, notify student/parent, and automate attendance if approved
   */
  async reviewRequest(id: string, review: ReviewRequestInput): Promise<StudentRequest | null> {
    const updated = await studentRequestRepository.updateStatus(id, review);
    if (!updated) return null;

    // Automated Attendance Integration:
    // If leave request is APPROVED, mark attendance record as 'excused'
    if (
      review.status === 'approved' &&
      updated.request_type === 'leave_absence' &&
      updated.request_date &&
      updated.class_id
    ) {
      try {
        const dateStr = updated.request_date;
        const studentId = updated.student_id;
        const classId = updated.class_id;

        // Check if attendance row already exists for this date and class
        const { data: existingAtt } = await this.supabase
          .from('attendance')
          .select('id')
          .eq('student_id', studentId)
          .eq('class_id', classId)
          .eq('date', dateStr)
          .maybeSingle();

        if (existingAtt) {
          await this.supabase
            .from('attendance')
            .update({
              status: 'excused',
              remarks: `Nghỉ có phép (Đơn duyệt: ${updated.reason})`,
            })
            .eq('id', existingAtt.id);
        } else {
          await this.supabase.from('attendance').insert({
            student_id: studentId,
            class_id: classId,
            date: dateStr,
            status: 'excused',
            remarks: `Nghỉ có phép (Đơn duyệt: ${updated.reason})`,
          });
        }
      } catch (attErr) {
        console.error('Failed to auto-update attendance for approved leave request:', attErr);
      }
    }

    // Send notification back to student & parent
    try {
      const typeLabel =
        updated.request_type === 'leave_absence'
          ? 'Đơn xin nghỉ phép'
          : updated.request_type === 'makeup_class'
            ? 'Đơn xin học bù'
            : updated.request_type === 'class_transfer'
              ? 'Đơn xin chuyển lớp'
              : 'Đơn bảo lưu';

      const isApproved = review.status === 'approved';
      const statusText = isApproved ? 'đã được PHÊ DUYỆT' : 'đã bị TỪ CHỐI';

      const notifTitle = `Kết quả xét duyệt: ${typeLabel}`;
      const notifMessage = `${typeLabel}${
        updated.request_date ? ` ngày ${updated.request_date}` : ''
      } ${statusText}.${review.reviewer_note ? ` Phản hồi: "${review.reviewer_note}"` : ''}`;

      const notifyRecipients = [updated.student_id];
      if (updated.parent_id) {
        notifyRecipients.push(updated.parent_id);
      }

      const notifRows = notifyRecipients.map((uid) => ({
        user_id: uid,
        title: notifTitle,
        message: notifMessage,
        type: isApproved ? 'success' : 'warning',
        category: 'academic',
        link: '/dashboard/requests',
        is_read: false,
      }));

      await this.supabase.from('notifications').insert(notifRows);
    } catch (notifErr) {
      console.warn('Failed to notify student of request review:', notifErr);
    }

    return updated;
  }
}

export const studentRequestService = new StudentRequestService();
