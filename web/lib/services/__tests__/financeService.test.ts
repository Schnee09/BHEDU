import { ValidationError } from '@/lib/api/errors';
import { FinanceService } from '@/lib/services/financeService';

describe('FinanceService enrollment safeguards', () => {
  it('rejects clearing a paid state because payments require a refund trail', async () => {
    const supabase = {
      from: jest.fn(),
    } as any;

    const service = new FinanceService(supabase);

    await expect(
      service.updateTuitionMatrix('class-1', 'year-1', [
        {
          studentId: 'student-1',
          month: '2026-10-01',
          paid: false,
        },
      ])
    ).rejects.toEqual(
      new ValidationError(
        'Không thể bỏ trạng thái đã đóng tại bảng học phí. Hãy dùng nghiệp vụ hoàn tiền và ghi rõ lý do để giữ lịch sử giao dịch'
      )
    );

    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('rejects a tuition matrix update outside the student enrollment period', async () => {
    const enrollmentQuery = {
      select: jest.fn(),
      eq: jest.fn(),
      in: jest.fn(),
      lte: jest.fn(),
      or: jest.fn(),
      is: jest.fn(),
    };
    enrollmentQuery.select.mockReturnValue(enrollmentQuery);
    enrollmentQuery.eq.mockReturnValue(enrollmentQuery);
    enrollmentQuery.in.mockReturnValue(enrollmentQuery);
    enrollmentQuery.lte.mockReturnValue(enrollmentQuery);
    enrollmentQuery.or.mockReturnValue(enrollmentQuery);
    enrollmentQuery.is.mockResolvedValue({ data: [], error: null });

    const supabase = {
      from: jest.fn((table: string) => {
        if (table === 'enrollments') return enrollmentQuery;
        throw new Error(`Unexpected table access: ${table}`);
      }),
    } as any;

    const service = new FinanceService(supabase);

    await expect(
      service.updateTuitionMatrix('class-1', 'year-1', [
        {
          studentId: 'student-1',
          month: '2026-10-01',
          paid: true,
        },
      ])
    ).rejects.toEqual(
      new ValidationError(
        'Không thể cập nhật học phí tháng 10/2026: học sinh không học lớp này trong tháng đó'
      )
    );

    expect(supabase.from).toHaveBeenCalledTimes(1);
    expect(supabase.from).toHaveBeenCalledWith('enrollments');
  });
});
