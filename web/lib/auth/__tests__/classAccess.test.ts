import { canAccessClass } from '@/lib/auth/classAccess';

function createSupabaseResult(data: unknown, error: unknown = null) {
  const query: Record<string, jest.Mock> = {};
  query.select = jest.fn(() => query);
  query.eq = jest.fn(() => query);
  query.maybeSingle = jest.fn().mockResolvedValue({ data, error });

  return {
    client: { from: jest.fn(() => query) } as any,
    query,
  };
}

describe('canAccessClass', () => {
  it.each(['admin', 'owner', 'super_admin'])(
    'allows global role %s without a query',
    async (role) => {
      const { client } = createSupabaseResult(null);

      await expect(canAccessClass(client, { id: 'user-1', role }, 'class-1')).resolves.toBe(true);
      expect(client.from).not.toHaveBeenCalled();
    }
  );

  it('allows a teacher assigned to the requested class', async () => {
    const { client, query } = createSupabaseResult({ id: 'class-1' });

    await expect(
      canAccessClass(client, { id: 'teacher-1', role: 'teacher' }, 'class-1')
    ).resolves.toBe(true);
    expect(query.eq).toHaveBeenNthCalledWith(1, 'id', 'class-1');
    expect(query.eq).toHaveBeenNthCalledWith(2, 'teacher_id', 'teacher-1');
  });

  it('rejects an unassigned teacher', async () => {
    const { client } = createSupabaseResult(null);

    await expect(
      canAccessClass(client, { id: 'teacher-2', role: 'teacher' }, 'class-1')
    ).resolves.toBe(false);
  });

  it.each(['student', 'parent', 'tutor', undefined])(
    'rejects non-teacher role %s without a query',
    async (role) => {
      const { client } = createSupabaseResult({ id: 'class-1' });

      await expect(canAccessClass(client, { id: 'user-1', role }, 'class-1')).resolves.toBe(false);
      expect(client.from).not.toHaveBeenCalled();
    }
  );
});
