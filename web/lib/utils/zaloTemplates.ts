/**
 * Zalo & SMS Academic Message Templates for BH-EDU
 * Optimized for direct copying and pasting into parent/student Zalo chats.
 */

export interface AccountHandoverData {
  fullName: string;
  roleName: string;
  loginId: string;
  password?: string;
  loginUrl?: string;
}

export function generateAccountHandoverZaloMessage(data: AccountHandoverData): string {
  const origin =
    data.loginUrl ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://bhedu.vn');
  const loginUrl = `${origin}/login`;

  return `[TRUNG TÂM GIÁO DỤC BÙI HOÀNG]
Kính gửi: ${data.fullName}
Thông tin tài khoản học vụ tại hệ thống BH-EDU:
- Họ và tên: ${data.fullName}
- Vai trò: ${data.roleName}
- Tên đăng nhập (UID): ${data.loginId}
- Mật khẩu khởi tạo: ${data.password || '******'}
- Cổng truy cập: ${loginUrl}
(Quý học sinh/phụ huynh vui lòng đổi mật khẩu sau lần đăng nhập đầu tiên. Hotline hỗ trợ: 0899 060 686).`;
}

export interface AttendanceZaloData {
  studentName: string;
  className: string;
  dateStr: string;
  status: 'present' | 'absent' | 'late' | 'excused' | string;
  notes?: string;
  teacherName?: string;
}

export function generateAttendanceZaloMessage(data: AttendanceZaloData): string {
  const statusLabel =
    data.status === 'present'
      ? '✅ Có mặt đúng giờ'
      : data.status === 'late'
      ? '⏰ Đi muộn'
      : data.status === 'excused'
      ? '📝 Vắng có phép'
      : '❌ Vắng không phép';

  let msg = `[TRUNG TÂM GIÁO DỤC BÙI HOÀNG - ĐIỂM DANH]
Kính gửi Quý Phụ huynh,
Trung tâm thông báo tình hình chuyên cần của học sinh ${data.studentName}:
- Lớp học: ${data.className}
- Buổi học ngày: ${data.dateStr}
- Trạng thái: ${statusLabel}`;

  if (data.notes) {
    msg += `\n- Ghi chú từ giáo viên: ${data.notes}`;
  }

  if (data.teacherName) {
    msg += `\n- Giáo viên/Gia sư phụ trách: ${data.teacherName}`;
  }

  msg += `\n(Mọi ý kiến đóng góp xin liên hệ Hotline trung tâm: 0899 060 686).`;
  return msg;
}

export interface GradeReportZaloData {
  studentName: string;
  subjectName: string;
  assessmentTitle: string;
  score: number | string;
  maxScore?: number | string;
  rankTitle?: string;
  teacherNotes?: string;
  reportUrl?: string;
}

export function generateGradeReportZaloMessage(data: GradeReportZaloData): string {
  const max = data.maxScore || 10;
  let msg = `[TRUNG TÂM GIÁO DỤC BÙI HOÀNG - KẾT QUẢ HỌC TẬP]
Kính gửi Quý Phụ huynh,
Kết quả bài kiểm tra/đánh giá của học sinh ${data.studentName}:
- Môn học: ${data.subjectName}
- Bài đánh giá: ${data.assessmentTitle}
- Điểm số đạt được: ${data.score}/${max}`;

  if (data.rankTitle) {
    msg += `\n- Xếp loại: ${data.rankTitle}`;
  }

  if (data.teacherNotes) {
    msg += `\n- Nhận xét của giáo viên: ${data.teacherNotes}`;
  }

  if (data.reportUrl) {
    msg += `\n- Tra cứu bảng điểm chi tiết tại: ${data.reportUrl}`;
  }

  msg += `\n(Trung tâm BH-EDU kính báo. Hotline hỗ trợ: 0899 060 686).`;
  return msg;
}

export interface TuitionReminderZaloData {
  studentName: string;
  periodName: string;
  amount: number;
  dueDateStr?: string;
  bankAccountInfo?: string;
  invoiceUrl?: string;
}

export function generateTuitionReminderZaloMessage(data: TuitionReminderZaloData): string {
  let msg = `[TRUNG TÂM GIÁO DỤC BÙI HOÀNG - THÔNG BÁO HỌC PHÍ]
Kính gửi Quý Phụ huynh học sinh ${data.studentName},
Trung tâm xin gửi thông báo học phí:
- Học kỳ / Đợt thu: ${data.periodName}
- Số tiền cần thanh toán: ${data.amount.toLocaleString('vi-VN')} VNĐ`;

  if (data.dueDateStr) {
    msg += `\n- Hạn thanh toán: ${data.dueDateStr}`;
  }

  if (data.bankAccountInfo) {
    msg += `\n- Thông tin chuyển khoản:\n${data.bankAccountInfo}`;
  }

  if (data.invoiceUrl) {
    msg += `\n- Tra cứu chi tiết phiếu thu & mã VietQR tại: ${data.invoiceUrl}`;
  }

  msg += `\n(Sau khi chuyển khoản, Quý Phụ huynh vui lòng gửi kèm ảnh biên lai. Hotline: 0899 060 686).`;
  return msg;
}
