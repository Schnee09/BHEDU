/**
 * Kế hoạch Năm học & Lịch Nghỉ Lễ
 * Trung tâm Học thêm & Bồi dưỡng Văn hóa Bùi Hoàng
 * Tập trung chủ yếu vào các Mốc Học kỳ và Lịch Nghỉ Lễ / Tết trong năm.
 */

export interface AcademicWeek {
  weekNumber: number; // 1 to 38
  semester: 'HK1' | 'HK2' | 'SUMMER';
  startDate: string; // YYYY-MM-DD (Monday)
  endDate: string; // YYYY-MM-DD (Sunday)
  label: string; // e.g. "Tuần 1 (07/09 - 13/09)"
  phase: string;
  phaseType: 'teaching' | 'exam' | 'holiday' | 'break' | 'review' | 'closing';
  isCurrent: boolean;
  isPast: boolean;
}

export interface AcademicMilestone {
  id: string;
  title: string;
  semester: 'HK1' | 'HK2' | 'ALL' | 'SUMMER';
  startDate: string;
  endDate?: string;
  type: 'holiday' | 'academic' | 'exam' | 'tuition' | 'closing' | 'meeting' | 'general';
  description: string;
  badge: string;
  color: string;
}

export const DEFAULT_ACADEMIC_MILESTONES: AcademicMilestone[] = [
  {
    id: 'm1',
    title: 'Khai giảng Lớp học thêm Học kỳ 1',
    semester: 'HK1',
    startDate: '2026-09-05',
    type: 'academic',
    description: 'Bắt đầu lịch học thêm các môn Toán, Văn, Anh, Lý, Hóa, Sinh đầu năm',
    badge: 'Bắt đầu HK1',
    color: '#3b82f6',
  },
  {
    id: 'm2',
    title: 'Đợt Ôn tập & Kiểm tra Giữa Học kỳ 1',
    semester: 'HK1',
    startDate: '2026-10-26',
    endDate: '2026-11-01',
    type: 'exam',
    description: 'Tăng cường luyện giải đề cương ôn thi giữa kỳ trên trường cho học sinh',
    badge: 'Giữa kỳ 1',
    color: '#ef4444',
  },
  {
    id: 'm3',
    title: 'Nghỉ Lễ Ngày Nhà giáo Việt Nam 20/11',
    semester: 'HK1',
    startDate: '2026-11-20',
    type: 'holiday',
    description: 'Trung tâm nghỉ học 1 ngày nhân dịp 20/11 để tri ân thầy cô giáo',
    badge: 'Nghỉ 20/11',
    color: '#ec4899',
  },
  {
    id: 'm4',
    title: 'Nghỉ Tết Dương Lịch 2027',
    semester: 'HK1',
    startDate: '2027-01-01',
    endDate: '2027-01-03',
    type: 'holiday',
    description: 'Nghỉ Tết Dương Lịch 3 ngày. Học sinh đi học lại bình thường vào ngày 04/01',
    badge: 'Nghỉ Tết Dương',
    color: '#10b981',
  },
  {
    id: 'm5',
    title: 'Đợt Ôn thi Cuối Học kỳ 1 trên trường',
    semester: 'HK1',
    startDate: '2027-01-11',
    endDate: '2027-01-17',
    type: 'exam',
    description: 'Luyện đề tổng hợp ôn thi học kỳ 1 và chốt điểm số học kỳ',
    badge: 'Cuối kỳ 1',
    color: '#ef4444',
  },
  {
    id: 'm6',
    title: 'Nghỉ Tết Nguyên Đán (Đinh Mùi 2027)',
    semester: 'HK1',
    startDate: '2027-02-01',
    endDate: '2027-02-16',
    type: 'holiday',
    description: 'Trung tâm nghỉ Tết Âm Lịch từ 24 tháng Chạp đến hết mùng 9 tháng Giêng',
    badge: 'Nghỉ Tết Âm Lịch',
    color: '#10b981',
  },
  {
    id: 'm7',
    title: 'Bắt đầu Lớp học thêm Học kỳ 2',
    semester: 'HK2',
    startDate: '2027-02-17',
    type: 'academic',
    description: 'Học sinh đi học lại sau Tết và bắt đầu chương trình học kỳ 2',
    badge: 'Bắt đầu HK2',
    color: '#3b82f6',
  },
  {
    id: 'm8',
    title: 'Đợt Ôn tập & Kiểm tra Giữa Học kỳ 2',
    semester: 'HK2',
    startDate: '2027-04-05',
    endDate: '2027-04-11',
    type: 'exam',
    description: 'Luyện đề ôn thi giữa kỳ 2 theo chương trình trường phổ thông',
    badge: 'Giữa kỳ 2',
    color: '#ef4444',
  },
  {
    id: 'm9',
    title: 'Nghỉ Lễ Giỗ Tổ Hùng Vương & 30/4 - 1/5',
    semester: 'HK2',
    startDate: '2027-04-29',
    endDate: '2027-05-03',
    type: 'holiday',
    description: 'Nghỉ lễ Giỗ Tổ và 30/4 - 1/5. Trung tâm học bù nếu có lịch thông báo riêng',
    badge: 'Nghỉ lễ 30/4',
    color: '#10b981',
  },
  {
    id: 'm10',
    title: 'Đợt Ôn thi Cuối Học kỳ 2 & Kết thúc Năm học',
    semester: 'HK2',
    startDate: '2027-05-10',
    endDate: '2027-05-16',
    type: 'exam',
    description: 'Ôn tập nước rút cuối kỳ 2 và kết thúc các lớp học thêm chính khóa',
    badge: 'Cuối năm học',
    color: '#dc2626',
  },
  {
    id: 'm11',
    title: 'Bắt đầu Các Lớp Bồi dưỡng Hè',
    semester: 'SUMMER',
    startDate: '2027-06-15',
    type: 'academic',
    description: 'Mở các lớp học thêm hè: lấy lại căn bản và học sớm chương trình lớp mới',
    badge: 'Khóa Hè',
    color: '#f59e0b',
  },
];

/**
 * Generate weekly calendar for small tutoring center
 */
export function generateAcademicWeeks(
  startMondayStr: string = '2026-09-07',
  totalWeeks: number = 38
): AcademicWeek[] {
  const weeks: AcademicWeek[] = [];
  const parts = startMondayStr.split('-').map(Number);
  const startY = parts[0] || 2026;
  const startM = parts[1] || 9;
  const startD = parts[2] || 7;
  const baseDate = new Date(startY, startM - 1, startD);

  const today = new Date();
  const todayTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

  for (let i = 0; i < totalWeeks; i++) {
    const weekNum = i + 1;
    const weekStart = new Date(baseDate);
    weekStart.setDate(baseDate.getDate() + i * 7);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const startISO = formatDateOnly(weekStart);
    const endISO = formatDateOnly(weekEnd);

    const isCurrent = todayTime >= weekStart.getTime() && todayTime <= weekEnd.getTime() + 86399999;
    const isPast = todayTime > weekEnd.getTime() + 86399999;

    let semester: 'HK1' | 'HK2' | 'SUMMER' = 'HK1';
    let phase = 'Lịch học thêm bình thường';
    let phaseType: AcademicWeek['phaseType'] = 'teaching';

    if (weekNum <= 18) {
      semester = 'HK1';
      if (weekNum === 1) {
        phase = 'Bắt đầu ca học thêm Học kỳ 1';
        phaseType = 'teaching';
      } else if (weekNum >= 8 && weekNum <= 9) {
        phase = 'Đợt kiểm tra giữa kỳ 1 trên trường';
        phaseType = 'exam';
      } else if (weekNum >= 16 && weekNum <= 17) {
        phase = 'Đợt ôn thi cuối kỳ 1 trên trường';
        phaseType = 'exam';
      } else if (weekNum === 18) {
        phase = 'Kết thúc chương trình Học kỳ 1';
        phaseType = 'closing';
      }
    } else if (weekNum <= 20) {
      semester = 'HK1';
      phase = 'Nghỉ Tết Nguyên Đán Đinh Mùi 2027';
      phaseType = 'holiday';
    } else if (weekNum <= 36) {
      semester = 'HK2';
      const hk2Week = weekNum - 20;
      if (hk2Week === 1) {
        phase = 'Bắt đầu ca học thêm Học kỳ 2';
        phaseType = 'teaching';
      } else if (hk2Week >= 8 && hk2Week <= 9) {
        phase = 'Đợt kiểm tra giữa kỳ 2 trên trường';
        phaseType = 'exam';
      } else if (hk2Week >= 14 && hk2Week <= 15) {
        phase = 'Đợt ôn thi cuối kỳ 2 & Kết thúc năm học';
        phaseType = 'exam';
      } else if (hk2Week === 16) {
        phase = 'Tổng kết năm học & Nghỉ chuyển tiếp hè';
        phaseType = 'closing';
      }
    } else {
      semester = 'SUMMER';
      phase = 'Lớp bồi dưỡng hè / Học sớm chương trình mới';
      phaseType = 'break';
    }

    const startFormatted = `${String(weekStart.getDate()).padStart(2, '0')}/${String(
      weekStart.getMonth() + 1
    ).padStart(2, '0')}`;
    const endFormatted = `${String(weekEnd.getDate()).padStart(2, '0')}/${String(
      weekEnd.getMonth() + 1
    ).padStart(2, '0')}`;

    weeks.push({
      weekNumber: weekNum,
      semester,
      startDate: startISO,
      endDate: endISO,
      label: `Tuần ${weekNum} (${startFormatted} - ${endFormatted})`,
      phase,
      phaseType,
      isCurrent,
      isPast,
    });
  }

  return weeks;
}

function formatDateOnly(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
