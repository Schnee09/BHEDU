import { sendEmail } from '@/lib/email/emailService';
import { UserService } from '@/lib/services/userService';

jest.mock('@/lib/email/emailService', () => ({
  generateWelcomeEmail: jest.fn(() => ({ html: 'welcome', text: 'welcome' })),
  sendEmail: jest.fn(),
}));
jest.mock('@/lib/services/studentService', () => ({
  studentService: { updateStudent: jest.fn() },
}));
jest.mock('@/lib/services/teacherService', () => ({
  teacherService: { syncTeacherProfile: jest.fn() },
}));

function profileUpsert(result: Record<string, unknown>) {
  const single = jest.fn().mockResolvedValue(result);
  const select = jest.fn().mockReturnValue({ single });
  return jest.fn().mockReturnValue({ select });
}

describe('UserService.createUser cleanup', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('keeps a successfully provisioned user when the welcome email fails', async () => {
    const upsert = profileUpsert({
      data: { id: 'profile-1', user_id: 'auth-1', role: 'staff' },
      error: null,
    });
    const deleteAuthUser = jest.fn();
    const supabase = {
      auth: {
        admin: {
          createUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'auth-1' } },
            error: null,
          }),
          deleteUser: deleteAuthUser,
        },
      },
      from: jest.fn((table: string) => {
        if (table === 'profiles') return { upsert };
        if (table === 'user_activity_logs') {
          return { insert: jest.fn().mockResolvedValue({ error: null }) };
        }
        throw new Error(`Unexpected table: ${table}`);
      }),
    } as any;
    (sendEmail as jest.Mock).mockRejectedValue(new Error('Mail provider unavailable'));

    const result = await new UserService(supabase).createUser(
      {
        role: 'staff',
        full_name: 'Nguyễn Văn An',
        email: 'an@example.com',
        status: 'active',
        is_managed: false,
      },
      'owner'
    );

    expect(result).toMatchObject({ id: 'profile-1', user_id: 'auth-1' });
    expect(deleteAuthUser).not.toHaveBeenCalled();
  });

  it('deletes the profile before Auth when required provisioning fails', async () => {
    const upsert = profileUpsert({
      data: null,
      error: { message: 'Profile insert failed', code: 'PGRST116' },
    });
    const deleteProfileEq = jest.fn().mockResolvedValue({ error: null });
    const deleteProfile = jest.fn().mockReturnValue({ eq: deleteProfileEq });
    const deleteAuthUser = jest.fn().mockResolvedValue({ error: null });
    const supabase = {
      auth: {
        admin: {
          createUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'auth-1' } },
            error: null,
          }),
          deleteUser: deleteAuthUser,
        },
      },
      from: jest.fn((table: string) => {
        if (table === 'profiles') return { upsert, delete: deleteProfile };
        throw new Error(`Unexpected table: ${table}`);
      }),
    } as any;

    await expect(
      new UserService(supabase).createUser(
        {
          role: 'staff',
          full_name: 'Nguyễn Văn An',
          email: 'an@example.com',
          status: 'active',
          is_managed: false,
        },
        'owner'
      )
    ).rejects.toThrow('Không thể tạo hồ sơ người dùng trong cơ sở dữ liệu.');

    expect(deleteProfileEq).toHaveBeenCalledWith('user_id', 'auth-1');
    expect(deleteAuthUser).toHaveBeenCalledWith('auth-1');
    expect(deleteProfileEq.mock.invocationCallOrder[0]!).toBeLessThan(
      deleteAuthUser.mock.invocationCallOrder[0]!
    );
  });

  it('keeps the Auth account when profile cleanup fails', async () => {
    const upsert = profileUpsert({
      data: null,
      error: { message: 'Profile insert failed', code: 'PGRST116' },
    });
    const deleteProfileEq = jest.fn().mockResolvedValue({
      error: { message: 'Profile cleanup failed' },
    });
    const deleteAuthUser = jest.fn();
    const supabase = {
      auth: {
        admin: {
          createUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'auth-1' } },
            error: null,
          }),
          deleteUser: deleteAuthUser,
        },
      },
      from: jest.fn((table: string) => {
        if (table === 'profiles') {
          return {
            upsert,
            delete: jest.fn().mockReturnValue({ eq: deleteProfileEq }),
          };
        }
        throw new Error(`Unexpected table: ${table}`);
      }),
    } as any;

    await expect(
      new UserService(supabase).createUser(
        {
          role: 'staff',
          full_name: 'Nguyễn Văn An',
          email: 'an@example.com',
          status: 'active',
          is_managed: false,
        },
        'owner'
      )
    ).rejects.toThrow('Không thể tạo hồ sơ người dùng trong cơ sở dữ liệu.');

    expect(deleteProfileEq).toHaveBeenCalledWith('user_id', 'auth-1');
    expect(deleteAuthUser).not.toHaveBeenCalled();
  });
});
