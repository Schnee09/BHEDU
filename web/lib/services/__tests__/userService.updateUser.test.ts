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
});
