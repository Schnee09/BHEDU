import {
  canAccessClass,
  canAccessStudent,
  canAccessTimetableSlot,
  canAccessTimetableTarget,
} from '@/lib/auth/classAccess';

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

  it.each(['tutor', 'staff'])(
    'allows an assigned %s to access the requested class',
    async (role) => {
      const { client } = createSupabaseResult({ id: 'class-1' });

      await expect(canAccessClass(client, { id: `${role}-1`, role }, 'class-1')).resolves.toBe(
        true
      );
    }
  );

  it('allows an assigned custom operational role', async () => {
    const { client, query } = createSupabaseResult({ id: 'class-1' });

    await expect(
      canAccessClass(client, { id: 'scheduler-1', role: 'scheduler' }, 'class-1')
    ).resolves.toBe(true);
    expect(query.eq).toHaveBeenNthCalledWith(2, 'teacher_id', 'scheduler-1');
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

  it.each(['student', 'parent', undefined])(
    'rejects non-teacher role %s without a query',
    async (role) => {
      const { client } = createSupabaseResult({ id: 'class-1' });

      await expect(canAccessClass(client, { id: 'user-1', role }, 'class-1')).resolves.toBe(false);
      expect(client.from).not.toHaveBeenCalled();
    }
  );
});

describe('canAccessStudent', () => {
  it.each(['teacher', 'tutor'])(
    'allows an assigned %s when the student is enrolled in one of their classes',
    async (role) => {
      const { client, query } = createSupabaseResult({ class_id: 'class-1' });

      await expect(canAccessStudent(client, { id: `${role}-1`, role }, 'student-1')).resolves.toBe(
        true
      );
      expect(query.eq).toHaveBeenNthCalledWith(1, 'student_id', 'student-1');
      expect(query.eq).toHaveBeenNthCalledWith(2, 'status', 'enrolled');
      expect(query.eq).toHaveBeenNthCalledWith(3, 'classes.teacher_id', `${role}-1`);
    }
  );

  it('rejects a teacher without a shared class', async () => {
    const { client } = createSupabaseResult(null);

    await expect(
      canAccessStudent(client, { id: 'teacher-2', role: 'teacher' }, 'student-1')
    ).resolves.toBe(false);
  });

  it('allows operational staff to view student records without a class query', async () => {
    const { client } = createSupabaseResult(null);

    await expect(
      canAccessStudent(client, { id: 'staff-1', role: 'staff' }, 'student-1')
    ).resolves.toBe(true);
    expect(client.from).not.toHaveBeenCalled();
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

describe('canAccessTimetableSlot', () => {
  function createSlotClient(slot: unknown) {
    const query: Record<string, jest.Mock> = {};
    query.select = jest.fn(() => query);
    query.eq = jest.fn(() => query);
    query.is = jest.fn(() => query);
    query.maybeSingle = jest.fn().mockResolvedValue({ data: slot, error: null });
    return { from: jest.fn(() => query) } as any;
  }

  it('allows the teacher assigned directly to a slot', async () => {
    const client = createSlotClient({
      class_id: null,
      student_id: 'student-1',
      teacher_id: 'teacher-1',
    });

    await expect(
      canAccessTimetableSlot(client, { id: 'teacher-1', role: 'teacher' }, 'slot-1')
    ).resolves.toBe(true);
  });

  it('rejects an unrelated user when the slot cannot be resolved', async () => {
    const client = createSlotClient(null);

    await expect(
      canAccessTimetableSlot(client, { id: 'teacher-2', role: 'teacher' }, 'slot-1')
    ).resolves.toBe(false);
  });
});

describe('canAccessTimetableTarget', () => {
  it('allows a teacher to create a slot assigned to themselves', async () => {
    const { client } = createSupabaseResult(null);

    await expect(
      canAccessTimetableTarget(
        client,
        { id: 'teacher-1', role: 'teacher' },
        { teacherId: 'teacher-1' }
      )
    ).resolves.toBe(true);
  });

  it('rejects a target with no relationship to the user', async () => {
    const { client } = createSupabaseResult(null);

    await expect(
      canAccessTimetableTarget(
        client,
        { id: 'teacher-1', role: 'teacher' },
        { teacherId: 'teacher-2' }
      )
    ).resolves.toBe(false);
  });
});
