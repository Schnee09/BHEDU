import { POST } from '@/app/api/admin/create-user/route';

describe('POST /api/admin/create-user retired endpoint', () => {
  it('directs callers to the permission-protected user workflow', async () => {
    const response = POST();
    const body = await response.json();

    expect(response.status).toBe(410);
    expect(body).toEqual(
      expect.objectContaining({
        success: false,
        replacement: '/api/admin/users',
      })
    );
  });
});
