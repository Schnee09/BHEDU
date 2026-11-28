import { render, screen } from '@testing-library/react';
import StudentActions from '@/components/StudentActions';
import { usePermissions } from '@/hooks/usePermissions';

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@/hooks/usePermissions', () => ({ usePermissions: jest.fn() }));

function mockPermissions(granted: string[]) {
  jest.mocked(usePermissions).mockReturnValue({
    can: (permission: string) => granted.includes(permission),
  } as ReturnType<typeof usePermissions>);
}

describe('StudentActions permissions', () => {
  it('does not expose mutation or finance actions to a read-only viewer', () => {
    mockPermissions(['students.view', 'grades.view']);

    render(<StudentActions studentId="student-1" studentName="Nguyễn Văn An" />);

    expect(screen.queryByText('Chỉnh sửa')).not.toBeInTheDocument();
    expect(screen.queryByText('Lưu trữ')).not.toBeInTheDocument();
    expect(screen.queryByText('Mật mã')).not.toBeInTheDocument();
    expect(screen.queryByText('Học phí')).not.toBeInTheDocument();
    expect(screen.queryByText('Thu phí')).not.toBeInTheDocument();
    expect(screen.getByText('Kết quả học tập')).toBeInTheDocument();
  });

  it('shows each action when its dedicated permission is granted', () => {
    mockPermissions([
      'students.edit',
      'students.delete',
      'users.edit',
      'finance.view',
      'grades.view',
    ]);

    render(<StudentActions studentId="student-1" studentName="Nguyễn Văn An" />);

    expect(screen.getByText('Chỉnh sửa')).toBeInTheDocument();
    expect(screen.getByText('Lưu trữ')).toBeInTheDocument();
    expect(screen.getByText('Mật mã')).toBeInTheDocument();
    expect(screen.getByText('Học phí')).toBeInTheDocument();
    expect(screen.getByText('Thu phí')).toBeInTheDocument();
    expect(screen.getByText('Kết quả học tập')).toBeInTheDocument();
  });
});
