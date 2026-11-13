import { studentRequestRepository } from '@/lib/repositories/StudentRequestRepository';
import { StudentRequestService } from '@/lib/services/StudentRequestService';

jest.mock('@/lib/repositories/StudentRequestRepository', () => ({
  studentRequestRepository: {
    updateStatus: jest.fn(),
  },
}));

describe('StudentRequestService.reviewRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('records approved leave through the atomic attendance upsert', async () => {
    (studentRequestRepository.updateStatus as jest.Mock).mockResolvedValue({
      id: 'request-1',
      request_type: 'leave_absence',
      request_date: '2026-11-13',
      class_id: 'class-1',
      student_id: 'student-1',
      parent_id: null,
      reason: 'Bị ốm',
    });

    const supabase = {
      rpc: jest.fn().mockResolvedValue({ data: [], error: null }),
      from: jest.fn().mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: null }),
      }),
    } as any;

    await new StudentRequestService(supabase).reviewRequest('request-1', {
      status: 'approved',
      reviewer_id: 'staff-1',
      reviewer_note: null,
    });

    expect(supabase.rpc).toHaveBeenCalledWith('upsert_daily_attendance_batch', {
      p_class_id: 'class-1',
      p_date: '2026-11-13',
      p_records: [
        {
          student_id: 'student-1',
          status: 'excused',
          notes: 'Nghỉ có phép (Đơn duyệt: Bị ốm)',
        },
      ],
      p_marked_by: 'staff-1',
    });
    expect(supabase.from).not.toHaveBeenCalledWith('attendance');
  });
});
