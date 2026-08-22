/**
 * Notification Settings API
 * GET /api/admin/notifications/settings - Get channels, events, and templates
 * PUT /api/admin/notifications/settings - Update channels, events, and templates
 */

import { apiSuccess, createApiHandler, createGetHandler } from '@/lib/api';
import { createServiceClient } from '@/lib/supabase/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const DEFAULT_CHANNELS = [
  { id: 'email', label: 'Email', description: 'Gửi qua máy chủ SMTP hoặc Resend', active: true, badge: 'Đã kết nối' },
  { id: 'sms', label: 'SMS Brandname', description: 'Gửi tin nhắn SMS tới số phụ huynh/học sinh', active: false, badge: 'Chưa kích hoạt' },
  { id: 'push', label: 'Web / App Push', description: 'Thông báo đẩy trực tiếp trên trình duyệt & di động', active: true, badge: 'Hoạt động' },
  { id: 'zalo', label: 'Zalo ZNS', description: 'Gửi tin chăm sóc khách hàng qua Zalo Official Account', active: false, badge: 'Tùy chọn' },
];

const DEFAULT_EVENTS = [
  { id: 'scores', label: 'Điểm số mới', description: 'Thông báo khi giáo viên cập nhật điểm bài kiểm tra', category: 'academic', push: true, email: true, sms: false, zalo: true },
  { id: 'billing', label: 'Yêu cầu học phí', description: 'Thông báo phát hành phiếu thu học phí mới hoặc quá hạn', category: 'finance', push: true, email: true, sms: true, zalo: true },
  { id: 'attendance', label: 'Điểm danh / Vắng học', description: 'Báo cáo khi học sinh vắng hoặc đến muộn trong buổi học', category: 'academic', push: true, email: false, sms: true, zalo: true },
  { id: 'schedule', label: 'Thay đổi thời khóa biểu', description: 'Thông báo khi có ca học mới hoặc giáo viên dạy bù', category: 'timetable', push: true, email: true, sms: false, zalo: false },
  { id: 'system', label: 'Thông báo hệ thống', description: 'Thông báo bảo trì hoặc các sự kiện chung của trung tâm', category: 'system', push: true, email: true, sms: false, zalo: false },
];

const DEFAULT_TEMPLATES = [
  {
    id: 'scores-push',
    eventId: 'scores',
    eventName: 'Điểm số mới',
    channel: 'push',
    titleTemplate: 'Điểm mới môn {subject_name}',
    bodyTemplate: 'Học sinh {student_name} vừa có điểm {score_type}: {score} điểm ({assessment_title}).',
    variables: [
      { key: 'student_name', label: 'Tên học sinh', example: 'Nguyễn Văn An' },
      { key: 'subject_name', label: 'Tên môn học', example: 'Toán 10' },
      { key: 'score', label: 'Điểm số', example: '9.0' },
      { key: 'score_type', label: 'Loại điểm', example: 'Kiểm tra 1 tiết' },
      { key: 'assessment_title', label: 'Tên bài kiểm tra', example: 'Chương 1 - Đại số' },
    ],
  },
  {
    id: 'billing-email',
    eventId: 'billing',
    eventName: 'Yêu cầu học phí',
    channel: 'email',
    titleTemplate: '[{school_name}] Thông báo học phí kỳ {period_name}',
    bodyTemplate: 'Kính gửi phụ huynh học sinh {student_name},\n\nTrung tâm xin gửi thông báo học phí kỳ {period_name} với tổng số tiền {amount} VNĐ. Hạn thanh toán đến ngày {due_date}.\n\nTrân trọng cảm ơn!',
    variables: [
      { key: 'school_name', label: 'Tên trung tâm', example: 'Bùi Hoàng Edu' },
      { key: 'student_name', label: 'Tên học sinh', example: 'Nguyễn Văn An' },
      { key: 'period_name', label: 'Kỳ học phí', example: 'Tháng 10/2026' },
      { key: 'amount', label: 'Số tiền', example: '2.500.000' },
      { key: 'due_date', label: 'Hạn thanh toán', example: '25/10/2026' },
    ],
  },
  {
    id: 'attendance-sms',
    eventId: 'attendance',
    eventName: 'Điểm danh / Vắng học',
    channel: 'sms',
    titleTemplate: '[{school_name}] Báo cáo chuyên cần',
    bodyTemplate: '{school_name}: Hoc sinh {student_name} vang mat buoi hoc lop {class_name} ngay {date}. Lien he: {hotline}.',
    variables: [
      { key: 'school_name', label: 'Tên trung tâm', example: 'BH-EDU' },
      { key: 'student_name', label: 'Tên học sinh', example: 'Nguyen Van An' },
      { key: 'class_name', label: 'Lớp học', example: '10A1' },
      { key: 'date', label: 'Ngày học', example: '11/08/2026' },
      { key: 'hotline', label: 'Hotline', example: '028-1234-5678' },
    ],
  },
];

const updateNotificationSettingsSchema = z.object({
  channels: z.array(z.any()).optional(),
  events: z.array(z.any()).optional(),
  templates: z.array(z.any()).optional(),
});

export const GET = createGetHandler({ allowedRoles: ['admin', 'super_admin'] }, async () => {
  const supabase = createServiceClient();

  const { data: settingRow } = await supabase
    .from('settings')
    .select('value_json')
    .eq('key', 'notification_config')
    .maybeSingle();

  const config = settingRow?.value_json || {};

  return apiSuccess({
    channels: config.channels || DEFAULT_CHANNELS,
    events: config.events || DEFAULT_EVENTS,
    templates: config.templates || DEFAULT_TEMPLATES,
  });
});

export const PUT = createApiHandler(
  {
    allowedRoles: ['admin', 'super_admin'],
    bodySchema: updateNotificationSettingsSchema,
  },
  async ({ body, user }) => {
    const supabase = createServiceClient();
    const { channels, events, templates } = body;

    const payload = {
      channels: channels || DEFAULT_CHANNELS,
      events: events || DEFAULT_EVENTS,
      templates: templates || DEFAULT_TEMPLATES,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    };

    const { error } = await supabase
      .from('settings')
      .upsert(
        {
          key: 'notification_config',
          category: 'notification',
          value_json: payload,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );

    if (error) {
      console.error('Failed to update notification settings:', error);
      throw new Error('Không thể lưu cấu hình thông báo');
    }

    return apiSuccess(payload, { message: 'Đã lưu cấu hình thông báo thành công' });
  }
);
