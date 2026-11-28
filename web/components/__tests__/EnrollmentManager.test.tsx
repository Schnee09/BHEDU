import { render, screen, waitFor } from '@testing-library/react';
import EnrollmentManager from '@/components/EnrollmentManager';
import { apiFetch } from '@/lib/api/client';
import { usePermissions } from '@/hooks/usePermissions';

jest.mock('@/lib/api/client', () => ({
  apiFetch: jest.fn(),
  enrollStudent: jest.fn(),
  endEnrollment: jest.fn(),
  transferEnrollment: jest.fn(),
}));
jest.mock('@/hooks/usePermissions', () => ({ usePermissions: jest.fn() }));

const enrollment = {
  id: 'enrollment-1',
  class_id: 'class-1',
  class_name: 'Toán 8',
  enrollment_date: '2026-11-01',
  status: 'enrolled',
};

function arrange(canManage: boolean) {
  jest.mocked(usePermissions).mockReturnValue({
    can: (permission: string) => permission === 'enrollments.manage' && canManage,
  } as ReturnType<typeof usePermissions>);

  jest.mocked(apiFetch).mockImplementation(async (url) => {
    const body = String(url).includes('/classes')
      ? { classes: [{ id: 'class-2', name: 'Vật lý 8' }] }
      : { enrollments: [enrollment] };

    return {
      ok: true,
      json: jest.fn().mockResolvedValue(body),
    } as unknown as Response;
  });
}

describe('EnrollmentManager permissions', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows enrollment history without mutation actions in read-only mode', async () => {
    arrange(false);
    render(<EnrollmentManager studentId="student-1" />);

    expect(await screen.findByText('Toán 8')).toBeInTheDocument();
    expect(screen.queryByText('Ghi danh lớp mới')).not.toBeInTheDocument();
    expect(screen.queryByText('Chuyển lớp')).not.toBeInTheDocument();
    expect(screen.queryByText('Nghỉ lớp')).not.toBeInTheDocument();
    expect(apiFetch).toHaveBeenCalledTimes(1);
    expect(apiFetch).toHaveBeenCalledWith('/api/admin/students/student-1/enrollments');
  });

  it('shows mutation actions and loads available classes with enrollments.manage', async () => {
    arrange(true);
    render(<EnrollmentManager studentId="student-1" />);

    expect(await screen.findByText('Toán 8')).toBeInTheDocument();
    expect(screen.getByText('Ghi danh lớp mới')).toBeInTheDocument();
    expect(screen.getByText('Chuyển lớp')).toBeInTheDocument();
    expect(screen.getByText('Nghỉ lớp')).toBeInTheDocument();
    await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(2));
    expect(apiFetch).toHaveBeenCalledWith('/api/admin/classes?status=active');
  });
});
