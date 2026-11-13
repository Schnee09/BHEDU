import { TeacherService } from '@/lib/services/teacherService';

const SUBJECT_ID = '11111111-1111-4111-8111-111111111111';

function setupSupabase(options: { deleteError?: unknown; insertError?: unknown } = {}) {
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
});
