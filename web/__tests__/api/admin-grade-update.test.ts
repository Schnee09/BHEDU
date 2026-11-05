/**
 * @jest-environment node
 */
import { PATCH } from '@/app/api/admin/grades/[id]/route';
import { getDataClient } from '@/lib/auth/dataClient';
import { getAuthContext } from '@/lib/auth/guard';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/auth/dataClient', () => ({ getDataClient: jest.fn() }));

const mockQuery: any = {};
for (const method of ['select', 'eq', 'is', 'update']) {
  mockQuery[method] = jest.fn(() => mockQuery);
}
mockQuery.insert = jest.fn().mockResolvedValue({ error: null });
mockQuery.single = jest.fn();

const mockFrom = jest.fn(() => mockQuery);

function request(body: unknown) {
  const value: any = new Request('http://localhost/api/admin/grades/grade-1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  value.nextUrl = {
    pathname: '/api/admin/grades/grade-1',
    searchParams: new URLSearchParams(),
  };
  return value;
}

describe('PATCH /api/admin/grades/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAuthContext as jest.Mock).mockResolvedValue({
      authorized: true,
      profile: { id: 'admin-1', email: 'admin@example.com' },
      role: 'admin',
    });
    (getDataClient as jest.Mock).mockResolvedValue({ supabase: { from: mockFrom } });
    mockQuery.select.mockReturnValue(mockQuery);
    mockQuery.eq.mockReturnValue(mockQuery);
    mockQuery.is.mockReturnValue(mockQuery);
    mockQuery.update.mockReturnValue(mockQuery);
    mockQuery.insert.mockResolvedValue({ error: null });
    mockQuery.single
      .mockResolvedValueOnce({
        data: {
          id: 'grade-1',
          student_id: 'student-1',
          assignment_id: 'assignment-1',
          points_earned: 35,
          feedback: null,
          assignment: { id: 'assignment-1', total_points: 50 },
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { id: 'grade-1', points_earned: 40, score: 8, feedback: 'Tiến bộ' },
        error: null,
      });
  });

  it('persists only grade fields and converts assignment points to a ten-point score', async () => {
    const response = await PATCH(
      request({ points_earned: 40, notes: 'Tiến bộ', reason: 'Điều chỉnh bài chấm' }),
      { params: Promise.resolve({ id: 'grade-1' }) } as any
    );

    expect(response.status).toBe(200);
    expect(mockQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({ points_earned: 40, score: 8, feedback: 'Tiến bộ' })
    );
    const updates = mockQuery.update.mock.calls[0][0];
    expect(updates).not.toHaveProperty('reason');
    expect(updates).not.toHaveProperty('notes');
  });

  it('rejects immutable grade identity fields', async () => {
    const response = await PATCH(request({ student_id: '223e4567-e89b-12d3-a456-426614174000' }), {
      params: Promise.resolve({ id: 'grade-1' }),
    } as any);

    expect(response.status).toBe(400);
    expect(mockQuery.update).not.toHaveBeenCalled();
  });

  it('clears the normalized score when assignment points are cleared', async () => {
    const response = await PATCH(request({ points_earned: null }), {
      params: Promise.resolve({ id: 'grade-1' }),
    } as any);

    expect(response.status).toBe(200);
    expect(mockQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({ points_earned: null, score: null })
    );
  });
});
