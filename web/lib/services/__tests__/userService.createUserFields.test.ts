import { UserService } from '@/lib/services/userService';
import { studentService } from '@/lib/services/studentService';
import { sendEmail } from '@/lib/email/emailService';

jest.mock('@/lib/services/studentService', () => ({
  studentService: { updateStudent: jest.fn() },
}));
jest.mock('@/lib/services/teacherService', () => ({
  teacherService: { syncTeacherProfile: jest.fn() },
}));
jest.mock('@/lib/email/emailService', () => ({
  generateWelcomeEmail: jest.fn(() => ({ html: 'welcome', text: 'welcome' })),
  sendEmail: jest.fn(),
}));

describe('UserService.createUser profile fields', () => {
  it('persists student fields supplied by the import workflow', async () => {
    const profile = {
      id: 'profile-1',
      user_id: 'auth-user-1',
      email: 'student@example.com',
      role: 'student',
      student_code: 'HS20260001',
    };
    const profileSingle = jest.fn().mockResolvedValue({ data: profile, error: null });
    const profileSelect = jest.fn(() => ({ single: profileSingle }));
    const profileUpsert = jest.fn(() => ({ select: profileSelect }));
    const activityInsert = jest.fn().mockResolvedValue({ error: null });
    const createUser = jest.fn().mockResolvedValue({
      data: { user: { id: 'auth-user-1' } },
      error: null,
    });
    const supabase = {
      auth: { admin: { createUser, deleteUser: jest.fn() } },
      from: jest.fn((table: string) => {
        if (table === 'profiles') return { upsert: profileUpsert };
        if (table === 'user_activity_logs') return { insert: activityInsert };
        throw new Error(`Unexpected table: ${table}`);
      }),
    } as any;
    (studentService.updateStudent as jest.Mock).mockResolvedValue({});
    (sendEmail as jest.Mock).mockResolvedValue({});

    const service = new UserService(supabase);
    await service.createUser(
      {
        role: 'student',
        full_name: 'Nguyễn Văn An',
        student_code: 'HS20260001',
        email: 'student@example.com',
        phone: '0901234567',
        address: '12 Nguyễn Huệ',
        date_of_birth: '2010-05-15',
        gender: 'male',
        emergency_contact: '0909999999',
        enrollment_date: '2026-09-01',
        status: 'inactive',
        is_active: false,
        is_managed: false,
      },
      'admin',
      'admin-1'
    );

    expect(profileUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        phone: '0901234567',
        address: '12 Nguyễn Huệ',
        date_of_birth: '2010-05-15',
        gender: 'male',
        emergency_contact: '0909999999',
        enrollment_date: '2026-09-01',
        status: 'inactive',
        is_active: false,
        is_managed: false,
      }),
      expect.objectContaining({ onConflict: 'user_id' })
    );
  });
});
