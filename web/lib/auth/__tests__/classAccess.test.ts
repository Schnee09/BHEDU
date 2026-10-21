import { canAccessClass, canAccessStudent } from '@/lib/auth/classAccess';

function createSupabaseResult(data: unknown, error: unknown = null) {
  const query: Record<string, jest.Mock> = {};
  query.select = jest.fn(() => query);
  query.eq = jest.fn(() => query);
  query.limit = jest.fn(() => query);
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

  it('rejects a teacher when a legacy record has no class', async () => {
    const { client } = createSupabaseResult({ id: 'class-1' });

    await expect(canAccessClass(client, { id: 'teacher-1', role: 'teacher' }, null)).resolves.toBe(
      false
    );
    expect(client.from).not.toHaveBeenCalled();
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

describe('canAccessStudent', () => {
  it('allows a teacher when the student is enrolled in one of their classes', async () => {
    const { client, query } = createSupabaseResult({ class_id: 'class-1' });

    await expect(
      canAccessStudent(client, { id: 'teacher-1', role: 'teacher' }, 'student-1')
    ).resolves.toBe(true);
    expect(query.eq).toHaveBeenNthCalledWith(1, 'student_id', 'student-1');
    expect(query.eq).toHaveBeenNthCalledWith(2, 'classes.teacher_id', 'teacher-1');
  });

  it('rejects a teacher without a shared class', async () => {
    const { client } = createSupabaseResult(null);

    await expect(
      canAccessStudent(client, { id: 'teacher-2', role: 'teacher' }, 'student-1')
    ).resolves.toBe(false);
  });

  it('allows a student to access only their own record', async () => {
    const { client } = createSupabaseResult(null);

    await expect(
      canAccessStudent(client, { id: 'student-1', role: 'student' }, 'student-1')
    ).resolves.toBe(true);
    await expect(
      canAccessStudent(client, { id: 'student-1', role: 'student' }, 'student-2')
    ).resolves.toBe(false);
  });

  it('requires an approved parent link', async () => {
    const { client, query } = createSupabaseResult({ id: 'link-1' });

    await expect(
      canAccessStudent(client, { id: 'parent-1', role: 'parent' }, 'student-1')
    ).resolves.toBe(true);
    expect(query.eq).toHaveBeenNthCalledWith(1, 'parent_id', 'parent-1');
    expect(query.eq).toHaveBeenNthCalledWith(2, 'student_id', 'student-1');
    expect(query.eq).toHaveBeenNthCalledWith(3, 'status', 'approved');
  });
});
