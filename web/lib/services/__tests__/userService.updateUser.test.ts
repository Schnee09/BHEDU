import { UserService } from '@/lib/services/userService';

describe('UserService.updateUser', () => {
  it('updates Auth metadata with profiles.user_id instead of the profile id', async () => {
    const single = jest.fn().mockResolvedValue({
      data: {
        id: 'profile-1',
        user_id: 'auth-user-1',
        role: 'admin',
      },
      error: null,
    });
    const select = jest.fn(() => ({ single }));
    const eq = jest.fn(() => ({ select }));
    const update = jest.fn(() => ({ eq }));
    const updateUserById = jest.fn().mockResolvedValue({ data: {}, error: null });
    const supabase = {
      from: jest.fn(() => ({ update })),
      auth: { admin: { updateUserById } },
    } as any;

    const service = new UserService(supabase);
    await service.updateUser('profile-1', { role: 'admin' });

    expect(updateUserById).toHaveBeenCalledWith('auth-user-1', {
      user_metadata: { role: 'admin' },
    });
  });

  it('falls back to the profile id for legacy rows without user_id', async () => {
    const single = jest.fn().mockResolvedValue({
      data: { id: 'legacy-profile-1', user_id: null, role: 'admin' },
      error: null,
    });
    const select = jest.fn(() => ({ single }));
    const eq = jest.fn(() => ({ select }));
    const update = jest.fn(() => ({ eq }));
    const updateUserById = jest.fn().mockResolvedValue({ data: {}, error: null });
    const supabase = {
      from: jest.fn(() => ({ update })),
      auth: { admin: { updateUserById } },
    } as any;

    const service = new UserService(supabase);
    await service.updateUser('legacy-profile-1', { role: 'admin' });

    expect(updateUserById).toHaveBeenCalledWith('legacy-profile-1', {
      user_metadata: { role: 'admin' },
    });
  });

  it('fails safely when Supabase Auth returns a synchronization error', async () => {
    const single = jest.fn().mockResolvedValue({
      data: { id: 'profile-1', user_id: 'auth-user-1', role: 'admin' },
      error: null,
    });
    const select = jest.fn(() => ({ single }));
    const eq = jest.fn(() => ({ select }));
    const update = jest.fn(() => ({ eq }));
    const updateUserById = jest.fn().mockResolvedValue({
      data: null,
      error: new Error('internal auth provider detail'),
    });
    const supabase = {
      from: jest.fn(() => ({ update })),
      auth: { admin: { updateUserById } },
    } as any;

    const service = new UserService(supabase);

    await expect(service.updateUser('profile-1', { role: 'admin' })).rejects.toThrow(
      'Không thể đồng bộ vai trò đăng nhập. Vui lòng thử lại.'
    );
  });

  it('reports student profile synchronization failures', async () => {
    const single = jest.fn().mockResolvedValue({
      data: { id: 'student-1', user_id: 'auth-student-1', role: 'student' },
      error: null,
    });
    const select = jest.fn(() => ({ single }));
    const eq = jest.fn(() => ({ select }));
    const update = jest.fn(() => ({ eq }));
    const upsert = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Student profile update failed' },
    });
    const supabase = {
      from: jest.fn((table: string) => {
        if (table === 'profiles') return { update };
        if (table === 'student_profiles') return { upsert };
        throw new Error(`Unexpected table: ${table}`);
      }),
      auth: { admin: { updateUserById: jest.fn() } },
    } as any;

    await expect(
      new UserService(supabase).updateUser('student-1', { student_code: 'HS001' })
    ).rejects.toThrow('Không thể cập nhật thông tin học sinh');

    expect(upsert).toHaveBeenCalledWith(
      { profile_id: 'student-1', student_code: 'HS001' },
      { onConflict: 'profile_id' }
    );
  });
});
