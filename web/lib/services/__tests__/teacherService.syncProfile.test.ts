import { TeacherService } from '@/lib/services/teacherService';

const SUBJECT_ID = '11111111-1111-4111-8111-111111111111';

function setupSupabase(
  options: {
    deleteError?: unknown;
    insertError?: unknown;
    subjects?: Array<{ id: string; name: string; code: string }>;
    subjectsError?: unknown;
  } = {}
) {
  const upsert = jest.fn().mockResolvedValue({ error: null });
  const eq = jest.fn().mockResolvedValue({ error: options.deleteError || null });
  const deleteSubjects = jest.fn().mockReturnValue({ eq });
  const insertSubjects = jest.fn().mockResolvedValue({ error: options.insertError || null });
  const supabase = {
    from: jest.fn((table: string) => {
      if (table === 'teacher_profiles') return { upsert };
      if (table === 'teacher_subjects') {
        return { delete: deleteSubjects, insert: insertSubjects };
      }
      if (table === 'subjects') {
        return {
          select: jest.fn().mockResolvedValue({
            data: options.subjects || [],
            error: options.subjectsError || null,
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    }),
  } as any;
  return { supabase, upsert, eq, deleteSubjects, insertSubjects };
}

describe('TeacherService.syncTeacherProfile', () => {
  it('clears the join table when an empty subject list is supplied', async () => {
    const { supabase, upsert, eq, insertSubjects } = setupSupabase();

    await new TeacherService(supabase).syncTeacherProfile('teacher-1', {
      teaching_subjects: [],
    });

    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ teaching_subjects: null }), {
      onConflict: 'profile_id',
    });
    expect(eq).toHaveBeenCalledWith('profile_id', 'teacher-1');
    expect(insertSubjects).not.toHaveBeenCalled();
  });

  it('preserves subject assignments when subjects are omitted', async () => {
    const { supabase, upsert, deleteSubjects } = setupSupabase();

    await new TeacherService(supabase).syncTeacherProfile('teacher-1', {
      department: 'Khoa học tự nhiên',
    });

    expect(upsert.mock.calls[0]?.[0]).not.toHaveProperty('teaching_subjects');
    expect(upsert.mock.calls[0]?.[0]).not.toHaveProperty('teacher_type');
    expect(deleteSubjects).not.toHaveBeenCalled();
  });

  it('reports join-table insert failures', async () => {
    const { supabase } = setupSupabase({ insertError: { message: 'Insert failed' } });

    await expect(
      new TeacherService(supabase).syncTeacherProfile('teacher-1', {
        teaching_subjects: [SUBJECT_ID],
      })
    ).rejects.toThrow('Failed to replace teacher subjects: Insert failed');
  });

  it('rejects unknown subject names without changing teacher data', async () => {
    const { supabase, upsert, deleteSubjects } = setupSupabase({
      subjects: [{ id: SUBJECT_ID, name: 'Toán', code: 'TOAN' }],
    });

    await expect(
      new TeacherService(supabase).syncTeacherProfile('teacher-1', {
        teaching_subjects: ['Môn không tồn tại'],
      })
    ).rejects.toThrow('Không tìm thấy môn học: Môn không tồn tại');

    expect(upsert).not.toHaveBeenCalled();
    expect(deleteSubjects).not.toHaveBeenCalled();
  });

  it('preserves teacher data when the subject catalog cannot be loaded', async () => {
    const { supabase, upsert, deleteSubjects } = setupSupabase({
      subjectsError: { message: 'Database unavailable' },
    });

    await expect(
      new TeacherService(supabase).syncTeacherProfile('teacher-1', {
        teaching_subjects: ['Toán'],
      })
    ).rejects.toThrow('Failed to resolve teaching subjects: Database unavailable');

    expect(upsert).not.toHaveBeenCalled();
    expect(deleteSubjects).not.toHaveBeenCalled();
  });
});

describe('TeacherService.createTeacher', () => {
  it('upserts details into the row provisioned by the profile trigger', async () => {
    const profile = { id: 'teacher-1', full_name: 'Nguyễn Văn An', role: 'teacher' };
    const profileQuery: Record<string, any> = {};
    profileQuery.insert = jest.fn().mockReturnValue(profileQuery);
    profileQuery.select = jest.fn().mockReturnValue(profileQuery);
    profileQuery.single = jest.fn().mockResolvedValue({ data: profile, error: null });
    const upsert = jest.fn().mockResolvedValue({ error: null });
    const supabase = {
      from: jest.fn((table: string) => {
        if (table === 'profiles') return profileQuery;
        if (table === 'teacher_profiles') return { upsert };
        throw new Error(`Unexpected table: ${table}`);
      }),
    } as any;

    const result = await new TeacherService(supabase).createTeacher({
      full_name: 'Nguyễn Văn An',
      department: 'Toán',
    });

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ profile_id: 'teacher-1', department: 'Toán' }),
      { onConflict: 'profile_id' }
    );
    expect(result).toMatchObject(profile);
  });
});
