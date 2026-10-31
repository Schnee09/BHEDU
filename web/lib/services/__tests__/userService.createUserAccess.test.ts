import { UserService } from '@/lib/services/userService';

describe('UserService.createUser role protection', () => {
  const service = new UserService({} as any);
  const input = (role: 'owner' | 'super_admin' | 'admin' | 'staff', full_name: string) => ({
    role,
    full_name,
    status: 'active' as const,
    is_managed: true,
  });

  it.each(['owner', 'super_admin'] as const)(
    'prevents an admin from creating a %s account',
    async (role) => {
      await expect(
        service.createUser(input(role, 'Tài khoản đặc quyền'), 'admin', 'admin-1')
      ).rejects.toMatchObject({ statusCode: 403, code: 'AUTHORIZATION_ERROR' });
    }
  );

  it('prevents an owner from creating another owner account', async () => {
    await expect(
      service.createUser(input('owner', 'Chủ trung tâm khác'), 'owner', 'owner-1')
    ).rejects.toMatchObject({ statusCode: 403, code: 'AUTHORIZATION_ERROR' });
  });

  it.each(['admin', 'staff'] as const)(
    'prevents a teacher from creating a %s account',
    async (role) => {
      await expect(
        service.createUser(input(role, 'Tài khoản nhân sự'), 'teacher', 'teacher-1')
      ).rejects.toMatchObject({ statusCode: 403, code: 'AUTHORIZATION_ERROR' });
    }
  );
});
