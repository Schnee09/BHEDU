import { GET, POST } from '@/app/api/users/route';

describe('/api/users retired endpoint', () => {
  it.each([
    ['GET', GET],
    ['POST', POST],
  ])('returns 410 for %s', async (_method, handler) => {
    const response = handler();
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
