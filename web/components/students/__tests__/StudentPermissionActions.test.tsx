import { fireEvent, render, screen } from '@testing-library/react';
import MobileStudentList, { type Student } from '@/components/students/MobileStudentList';
import StudentGridView from '@/components/students/StudentGridView';
import StudentQuickActions from '@/components/students/StudentQuickActions';

const student: Student = {
  id: 'student-1',
  full_name: 'Nguyễn Văn An',
  email: 'an@example.com',
  role: 'student',
  date_of_birth: '2012-01-02',
  phone: '0901234567',
  address: null,
  student_code: 'HS001',
  student_id: 'CID001',
  grade_level: 'Lớp 8',
  status: 'active',
  created_at: '2026-01-01T00:00:00.000Z',
};

const callbacks = {
  onEdit: jest.fn(),
  onArchive: jest.fn(),
  onSelect: jest.fn(),
  onViewDetails: jest.fn(),
  onToggleStatus: jest.fn(),
};

describe('student action permissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('omits edit from quick actions without students.edit', () => {
    render(
      <StudentQuickActions studentId={student.id} studentName={student.full_name} canEdit={false} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Thao tác nhanh' }));

    expect(screen.queryByText('Chỉnh sửa')).not.toBeInTheDocument();
    expect(screen.getByText('Hồ sơ chi tiết')).toBeInTheDocument();
  });

  it('keeps the desktop card read-only without edit or delete permissions', () => {
    render(
      <StudentGridView
        students={[student]}
        selectedIds={new Set()}
        canEdit={false}
        canArchive={false}
        {...callbacks}
      />
    );

    expect(screen.queryByTitle('Chỉnh sửa thông tin')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Lưu trữ học sinh')).not.toBeInTheDocument();
    expect(screen.getByTitle('Click đổi trạng thái')).toBeDisabled();
  });

  it('keeps the mobile card read-only without edit or delete permissions', () => {
    render(
      <MobileStudentList
        students={[student]}
        selectedIds={new Set()}
        canEdit={false}
        canArchive={false}
        {...callbacks}
      />
    );

    expect(screen.queryByRole('button', { name: 'Sửa' })).not.toBeInTheDocument();
    expect(screen.queryByTitle('Lưu trữ học sinh')).not.toBeInTheDocument();
    expect(screen.getByText('Xem hồ sơ')).toBeInTheDocument();
  });
});
