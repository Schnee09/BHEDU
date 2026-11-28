import { LinkService } from '@/lib/services/linkService';

function currentLinkQuery(status: string | null) {
  const query = {
    select: jest.fn(),
    eq: jest.fn(),
    maybeSingle: jest.fn().mockResolvedValue({
      data: status ? { id: 'link-1', status } : null,
      error: null,
    }),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  return query;
}

describe('LinkService.updateLinkStatus', () => {
  it('rejects links that are no longer pending', async () => {
    const current = currentLinkQuery('approved');
    const supabase = { from: jest.fn().mockReturnValue(current) } as any;

    await expect(
      new LinkService(supabase).updateLinkStatus(
        { id: '11111111-1111-4111-8111-111111111111', status: 'rejected' },
        'admin-1'
      )
    ).rejects.toThrow('Chỉ có thể xử lý yêu cầu đang chờ duyệt.');

    expect(supabase.from).toHaveBeenCalledTimes(1);
  });

  it('records reviewer metadata while approving a pending link', async () => {
    const current = currentLinkQuery('pending');
    const update = jest.fn();
    const updateQuery = {
      eq: jest.fn(),
      select: jest.fn(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'link-1', status: 'approved' },
        error: null,
      }),
    };
    update.mockReturnValue(updateQuery);
    updateQuery.eq.mockReturnValue(updateQuery);
    updateQuery.select.mockReturnValue(updateQuery);
    const supabase = {
      from: jest.fn().mockReturnValueOnce(current).mockReturnValueOnce({ update }),
    } as any;

    const result = await new LinkService(supabase).updateLinkStatus(
      { id: '11111111-1111-4111-8111-111111111111', status: 'approved' },
      'admin-1'
    );

    expect(result).toEqual({ id: 'link-1', status: 'approved' });
    expect(update).toHaveBeenCalledWith({
      status: 'approved',
      reviewed_at: expect.any(String),
      reviewed_by: 'admin-1',
      notes: undefined,
      rejection_reason: null,
    });
    expect(updateQuery.eq).toHaveBeenNthCalledWith(1, 'id', '11111111-1111-4111-8111-111111111111');
    expect(updateQuery.eq).toHaveBeenNthCalledWith(2, 'status', 'pending');
  });
});
