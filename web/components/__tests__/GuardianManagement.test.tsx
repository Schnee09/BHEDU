import { render, screen, waitFor } from '@testing-library/react';
import GuardianManagement from '@/components/GuardianManagement';
import { apiFetch } from '@/lib/api/client';
import { usePermissions } from '@/hooks/usePermissions';

jest.mock('@/lib/api/client', () => ({ apiFetch: jest.fn() }));
jest.mock('@/hooks/usePermissions', () => ({ usePermissions: jest.fn() }));

const guardian = {
  id: 'guardian-1',
  student_id: 'student-1',
  name: 'Nguyễn Văn Bình',
  relationship: 'father',
  phone: '0901234567',
  email: 'binh@example.com',
  address: null,
  is_primary_contact: true,
  is_emergency_contact: false,
  occupation: null,
  workplace: null,
  work_phone: null,
  notes: null,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

function arrange(canEdit: boolean) {
  jest.mocked(usePermissions).mockReturnValue({
    can: (permission: string) => permission === 'students.edit' && canEdit,
  } as ReturnType<typeof usePermissions>);
  jest.mocked(apiFetch).mockResolvedValue({
    ok: true,
    json: jest.fn().mockResolvedValue({ data: [guardian] }),
  } as unknown as Response);
}

describe('GuardianManagement permissions', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows guardian contacts without mutation actions in read-only mode', async () => {
    arrange(false);
    render(<GuardianManagement studentId="student-1" />);

    expect(await screen.findByText('Nguyễn Văn Bình')).toBeInTheDocument();
    expect(screen.queryByText('Thêm phụ huynh')).not.toBeInTheDocument();
    expect(screen.queryByText('Chỉnh sửa')).not.toBeInTheDocument();
    expect(screen.queryByText('Xóa hồ sơ')).not.toBeInTheDocument();
  });

  it('shows mutation actions with students.edit', async () => {
    arrange(true);
    render(<GuardianManagement studentId="student-1" />);

    await waitFor(() => expect(screen.getByText('Nguyễn Văn Bình')).toBeInTheDocument());
    expect(screen.getByText('Thêm phụ huynh')).toBeInTheDocument();
    expect(screen.getByText('Chỉnh sửa')).toBeInTheDocument();
    expect(screen.getByText('Xóa hồ sơ')).toBeInTheDocument();
  });
});
