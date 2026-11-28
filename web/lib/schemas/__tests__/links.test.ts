import { updateLinkStatusSchema } from '@/lib/schemas/requests/links';

const id = '11111111-1111-4111-8111-111111111111';

describe('updateLinkStatusSchema', () => {
  it('allows approval without a note', () => {
    expect(updateLinkStatusSchema.safeParse({ id, status: 'approved' }).success).toBe(true);
  });

  it('requires a rejection reason', () => {
    expect(updateLinkStatusSchema.safeParse({ id, status: 'rejected', notes: '  ' }).success).toBe(
      false
    );
    expect(
      updateLinkStatusSchema.safeParse({
        id,
        status: 'rejected',
        notes: 'Không đủ thông tin xác minh.',
      }).success
    ).toBe(true);
  });
});
