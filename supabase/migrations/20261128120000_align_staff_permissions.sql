-- Align staff defaults with the current front-desk and daily operations role.
-- Explicit role/user overrides remain untouched and continue to take precedence.

-- Some production environments predate the complete permission catalog. Seed the
-- definitions used below so the role assignment remains portable and atomic.
INSERT INTO public.permission_definitions
  (code, name, description, resource, action, category, is_system)
VALUES
  ('students.view', 'Xem hồ sơ học sinh', 'Tra cứu thông tin và hồ sơ học sinh', 'students', 'read', 'students', true),
  ('students.create', 'Thêm học sinh', 'Tiếp nhận và tạo hồ sơ học sinh mới', 'students', 'write', 'students', true),
  ('students.edit', 'Cập nhật học sinh', 'Cập nhật hồ sơ và thông tin liên hệ của học sinh', 'students', 'write', 'students', true),
  ('classes.view', 'Xem lớp học', 'Tra cứu thông tin lớp học', 'classes', 'read', 'classes', true),
  ('classes.enroll', 'Xếp lớp học sinh', 'Thêm hoặc chuyển học sinh giữa các lớp', 'enrollments', 'manage', 'classes', true),
  ('enrollments.view', 'Xem đăng ký lớp', 'Tra cứu danh sách đăng ký lớp của học sinh', 'enrollments', 'read', 'enrollments', true),
  ('enrollments.manage', 'Quản lý đăng ký lớp', 'Xác nhận, thay đổi hoặc kết thúc đăng ký lớp', 'enrollments', 'manage', 'enrollments', true),
  ('timetable.view', 'Xem thời khóa biểu', 'Xem lịch học và lịch dạy của trung tâm', 'timetable', 'read', 'timetable', true),
  ('parent_links.view', 'Xem liên kết phụ huynh', 'Tra cứu liên kết giữa phụ huynh và học sinh', 'parent_links', 'read', 'users', true),
  ('parent_links.approve', 'Duyệt liên kết phụ huynh', 'Xác minh yêu cầu liên kết phụ huynh với học sinh', 'parent_links', 'manage', 'users', true),
  ('attendance.view', 'Xem chuyên cần', 'Tra cứu lịch sử điểm danh của học sinh', 'attendance', 'read', 'attendance', true),
  ('attendance.mark', 'Điểm danh buổi học', 'Ghi nhận tình trạng tham gia buổi học', 'attendance', 'write', 'attendance', true),
  ('attendance.reports', 'Xem báo cáo chuyên cần', 'Xem báo cáo chuyên cần theo lớp và thời gian', 'attendance', 'read', 'attendance', true),
  ('grades.view', 'Xem kết quả học tập', 'Tra cứu điểm và kết quả học tập của học sinh', 'grades', 'read', 'grades', true),
  ('grades.entry', 'Nhập điểm', 'Nhập và cập nhật điểm của học sinh', 'grades', 'write', 'grades', true),
  ('finance.view', 'Xem học phí', 'Tra cứu học phí, phiếu thu và thanh toán', 'finance', 'read', 'finance', true),
  ('finance.manage', 'Quản lý học phí', 'Lập khoản thu và ghi nhận thanh toán học phí', 'finance', 'manage', 'finance', true),
  ('reports.view', 'Xem báo cáo trung tâm', 'Xem báo cáo tổng hợp phục vụ vận hành', 'reports', 'read', 'reports', true),
  ('subjects.view', 'Xem môn học', 'Tra cứu danh mục môn học', 'subjects', 'read', 'subjects', true),
  ('curriculum.view', 'Xem chương trình học', 'Tra cứu nội dung và tài liệu chương trình học', 'curriculum', 'read', 'curriculum', true)
ON CONFLICT (code) DO NOTHING;

DELETE FROM public.role_permissions
WHERE role = 'staff';

INSERT INTO public.role_permissions (role, permission_code) VALUES
  ('staff', 'students.view'),
  ('staff', 'students.create'),
  ('staff', 'students.edit'),
  ('staff', 'classes.view'),
  ('staff', 'classes.enroll'),
  ('staff', 'enrollments.view'),
  ('staff', 'enrollments.manage'),
  ('staff', 'timetable.view'),
  ('staff', 'parent_links.view'),
  ('staff', 'parent_links.approve'),
  ('staff', 'attendance.view'),
  ('staff', 'attendance.mark'),
  ('staff', 'attendance.reports'),
  ('staff', 'grades.view'),
  ('staff', 'grades.entry'),
  ('staff', 'finance.view'),
  ('staff', 'finance.manage'),
  ('staff', 'reports.view'),
  ('staff', 'subjects.view'),
  ('staff', 'curriculum.view')
ON CONFLICT (role, permission_code) DO NOTHING;
