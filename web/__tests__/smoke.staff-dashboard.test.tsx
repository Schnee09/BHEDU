import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import StaffDashboard from '@/components/dashboard/portals/StaffDashboard';

jest.mock('@/hooks/useProfile', () => ({
  useProfile: () => ({ profile: { id: 'staff-1', full_name: 'Mai Anh', role: 'staff' } }),
}));

jest.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({
    loading: false,
    can: (permission: string) => ['students.view', 'attendance.view'].includes(permission),
  }),
}));

jest.mock(
  '@/components/dashboard/widgets/StudentRequestWidget',
  () =>
    function MockStudentRequestWidget() {
      return <div>Yêu cầu học sinh</div>;
    }
);
jest.mock(
  '@/components/dashboard/widgets/AnnouncementsFeedWidget',
  () =>
    function MockAnnouncementsFeedWidget() {
      return <div>Thông báo trung tâm</div>;
    }
);

describe('StaffDashboard', () => {
  it('shows only operational actions granted to the staff account', () => {
    render(<StaffDashboard />);

    expect(screen.getByText('Công việc hôm nay')).toBeInTheDocument();
    expect(screen.getByText('Tra cứu học sinh')).toBeInTheDocument();
    expect(screen.getByText('Hồ sơ học sinh')).toBeInTheDocument();
    expect(screen.getByText('Chuyên cần')).toBeInTheDocument();
    expect(screen.queryByText('Thu học phí')).not.toBeInTheDocument();
    expect(screen.queryByText('Đăng ký lớp')).not.toBeInTheDocument();
  });
});
