import { UserService } from '@/lib/services/userService';

function fetchQuery(user: Record<string, unknown>) {
  const query: Record<string, any> = {};
  query.select = jest.fn().mockReturnValue(query);
  query.eq = jest.fn().mockReturnValue(query);
  query.single = jest.fn().mockResolvedValue({ data: user, error: null });
  return query;
}

function deleteQuery(error: unknown = null) {
  const query: Record<string, any> = {};
  query.delete = jest.fn().mockReturnValue(query);
  query.eq = jest.fn().mockResolvedValue({ data: null, error });
  return query;
}

describe('UserService.deleteUser', () => {
  it('deletes the business profile before removing the Auth account', async () => {
    const profileFetch = fetchQuery({ role: 'student', user_id: 'auth-1' });
    const profileDelete = deleteQuery();
    const deleteAuthUser = jest.fn().mockResolvedValue({ error: null });
    const supabase = {
      from: jest.fn().mockReturnValueOnce(profileFetch).mockReturnValueOnce(profileDelete),
      auth: { admin: { deleteUser: deleteAuthUser } },
    } as any;

    await new UserService(supabase).deleteUser('profile-1');

    expect(supabase.from).toHaveBeenNthCalledWith(1, 'profiles');
    expect(supabase.from).toHaveBeenNthCalledWith(2, 'profiles');
    expect(profileDelete.delete).toHaveBeenCalled();
    expect(profileDelete.eq).toHaveBeenCalledWith('id', 'profile-1');
    expect(deleteAuthUser).toHaveBeenCalledWith('auth-1');
    expect(profileDelete.eq.mock.invocationCallOrder[0]!).toBeLessThan(
      deleteAuthUser.mock.invocationCallOrder[0]!
    );
  });

  it('keeps the Auth account when deleting the business profile fails', async () => {
    const profileFetch = fetchQuery({ role: 'teacher', user_id: 'auth-1' });
    const profileDelete = deleteQuery({ message: 'Profile is still referenced' });
    const deleteAuthUser = jest.fn();
    const supabase = {
      from: jest.fn().mockReturnValueOnce(profileFetch).mockReturnValueOnce(profileDelete),
      auth: { admin: { deleteUser: deleteAuthUser } },
    } as any;

    await expect(new UserService(supabase).deleteUser('profile-1')).rejects.toEqual({
      message: 'Profile is still referenced',
    });
    expect(deleteAuthUser).not.toHaveBeenCalled();
  });
});
