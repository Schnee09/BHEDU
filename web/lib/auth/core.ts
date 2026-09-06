/**
 * Unified Permission System Core
 * This is the single source of truth for both client and server-side authorization.
 */

// ============================================
// TYPES
// ============================================

export type SystemRole =
  | 'super_admin'
  | 'owner'
  | 'admin'
  | 'teacher'
  | 'tutor'
  | 'parent'
  | 'student';

export type UserRole = SystemRole | (string & {});

export type PermissionCode =
  // System - Super Admin only
  | 'system.settings'
  | 'system.audit'
  | 'system.database'
  | 'system.impersonate'
  | 'system.deploy'
  // Roles & Permissions
  | 'roles.view'
  | 'roles.manage'
  | 'permissions.manage'
  // Users
  | 'users.view'
  | 'users.create'
  | 'users.edit'
  | 'users.delete.soft'
  | 'users.delete.hard'
  | 'users.delete'
  | 'users.invite'
  | 'users.bulk_import'
  // Parent-Student Links
  | 'parent_links.view'
  | 'parent_links.approve'
  // Students
  | 'students.view'
  | 'students.create'
  | 'students.edit'
  | 'students.delete'
  | 'students.import'
  // Classes
  | 'classes.manage'
  | 'classes.view'
  | 'classes.create'
  | 'classes.edit'
  | 'classes.delete'
  | 'classes.enroll'
  // Timetable
  | 'timetable.view'
  | 'timetable.edit'
  // Grades
  | 'grades.view'
  | 'grades.entry'
  | 'grades.manage'
  | 'grades.delete'
  | 'grades.analytics'
  // Curriculum
  | 'curriculum.view'
  | 'curriculum.manage'
  // Parent
  | 'parent.view_students'
  | 'parent.link_student'
  // Attendance
  | 'attendance.view'
  | 'attendance.mark'
  | 'attendance.manage'
  | 'attendance.reports'
  // Enrollments
  | 'enrollments.view'
  | 'enrollments.manage'
  // Subjects
  | 'subjects.view'
  | 'subjects.manage'
  // Reports
  | 'reports.view'
  | 'reports.export'
  // Finance
  | 'finance.view'
  | 'finance.manage'
  | 'finance.refund'
  | 'finance.export'
  // Tutoring Sessions
  | 'tutoring.sessions.view'
  | 'tutoring.sessions.manage'
  | 'tutoring.feedback.submit'
  // Announcements
  | 'announcements.manage'
  | '*'; // Wildcard

export interface Permission {
  code: PermissionCode;
  name: string;
  category: string;
}

export interface PermissionDefinition {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
}

export const SYSTEM_PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  // Hệ thống
  {
    id: 'system.settings',
    code: 'system.settings',
    name: 'Cấu hình hệ thống',
    description: 'Thay đổi các thiết lập trung tâm, API và hệ thống',
    category: 'system',
  },
  {
    id: 'system.audit',
    code: 'system.audit',
    name: 'Xem nhật ký bảo mật',
    description: 'Truy cập toàn bộ nhật ký kiểm toán và thao tác người dùng',
    category: 'system',
  },
  {
    id: 'system.database',
    code: 'system.database',
    name: 'Quản trị cơ sở dữ liệu',
    description: 'Sao lưu, khôi phục và tối ưu dữ liệu',
    category: 'system',
  },
  {
    id: 'system.impersonate',
    code: 'system.impersonate',
    name: 'Đăng nhập giả lập',
    description: 'Đăng nhập tạm thời với tư cách tài khoản khác để hỗ trợ',
    category: 'system',
  },
  {
    id: 'system.deploy',
    code: 'system.deploy',
    name: 'Triển khai & Bảo trì',
    description: 'Quản lý phiên bản và bảo trì hệ thống',
    category: 'system',
  },

  // Vai trò & Quyền
  {
    id: 'roles.view',
    code: 'roles.view',
    name: 'Xem danh sách vai trò',
    description: 'Tra cứu các vai trò và quyền hạn tương ứng',
    category: 'roles',
  },
  {
    id: 'roles.manage',
    code: 'roles.manage',
    name: 'Quản lý vai trò tùy biến',
    description: 'Thêm, sửa, xóa các vai trò tùy biến',
    category: 'roles',
  },
  {
    id: 'permissions.manage',
    code: 'permissions.manage',
    name: 'Quản lý phân quyền',
    description: 'Cấp và từ chối quyền hạn cho từng vai trò và tài khoản',
    category: 'permissions',
  },

  // Người dùng
  {
    id: 'users.view',
    code: 'users.view',
    name: 'Xem danh sách người dùng',
    description: 'Tra cứu thông tin hồ sơ tài khoản',
    category: 'users',
  },
  {
    id: 'users.create',
    code: 'users.create',
    name: 'Tạo tài khoản mới',
    description: 'Khởi tạo tài khoản học sinh, giáo viên, phụ huynh',
    category: 'users',
  },
  {
    id: 'users.edit',
    code: 'users.edit',
    name: 'Chỉnh sửa người dùng',
    description: 'Cập nhật thông tin, trạng thái hoạt động tài khoản',
    category: 'users',
  },
  {
    id: 'users.delete',
    code: 'users.delete',
    name: 'Xóa người dùng',
    description: 'Xóa hoặc vô hiệu hóa tài khoản khỏi hệ thống',
    category: 'users',
  },
  {
    id: 'users.delete.soft',
    code: 'users.delete.soft',
    name: 'Vô hiệu hóa tài khoản',
    description: 'Khóa tạm thời tài khoản người dùng',
    category: 'users',
  },
  {
    id: 'users.invite',
    code: 'users.invite',
    name: 'Gửi thư mời tham gia',
    description: 'Gửi link mời tham gia cho giáo viên/phụ huynh',
    category: 'users',
  },
  {
    id: 'users.bulk_import',
    code: 'users.bulk_import',
    name: 'Nhập người dùng hàng loạt',
    description: 'Nhập danh sách tài khoản từ file Excel/CSV',
    category: 'users',
  },

  // Học sinh
  {
    id: 'students.view',
    code: 'students.view',
    name: 'Xem hồ sơ học sinh',
    description: 'Tra cứu thông tin học sinh, lớp học và phụ huynh',
    category: 'students',
  },
  {
    id: 'students.create',
    code: 'students.create',
    name: 'Thêm học sinh mới',
    description: 'Tiếp nhận và cấp mã học sinh mới',
    category: 'students',
  },
  {
    id: 'students.edit',
    code: 'students.edit',
    name: 'Sửa thông tin học sinh',
    description: 'Cập nhật hồ sơ và thông tin liên lạc học sinh',
    category: 'students',
  },
  {
    id: 'students.delete',
    code: 'students.delete',
    name: 'Xóa học sinh',
    description: 'Xóa hồ sơ học sinh khỏi trung tâm',
    category: 'students',
  },
  {
    id: 'students.import',
    code: 'students.import',
    name: 'Nhập học sinh từ file',
    description: 'Nhập danh sách học sinh từ Excel',
    category: 'students',
  },

  // Lớp học
  {
    id: 'classes.view',
    code: 'classes.view',
    name: 'Xem danh sách lớp học',
    description: 'Tra cứu thông tin lớp học, sĩ số và giáo viên',
    category: 'classes',
  },
  {
    id: 'classes.create',
    code: 'classes.create',
    name: 'Tạo lớp học mới',
    description: 'Khởi tạo lớp học mới và phân công giáo viên',
    category: 'classes',
  },
  {
    id: 'classes.edit',
    code: 'classes.edit',
    name: 'Chỉnh sửa lớp học',
    description: 'Thay đổi thông tin lớp, phòng học, học phí',
    category: 'classes',
  },
  {
    id: 'classes.delete',
    code: 'classes.delete',
    name: 'Hủy/Xóa lớp học',
    description: 'Đóng hoặc xóa lớp học',
    category: 'classes',
  },
  {
    id: 'classes.manage',
    code: 'classes.manage',
    name: 'Quản trị lớp học toàn diện',
    description: 'Toàn quyền điều hành học vụ lớp học',
    category: 'classes',
  },
  {
    id: 'classes.enroll',
    code: 'classes.enroll',
    name: 'Xếp lớp học sinh',
    description: 'Gán học sinh vào lớp học',
    category: 'classes',
  },

  // Điểm số
  {
    id: 'grades.view',
    code: 'grades.view',
    name: 'Xem bảng điểm',
    description: 'Tra cứu kết quả học tập và điểm số',
    category: 'grades',
  },
  {
    id: 'grades.entry',
    code: 'grades.entry',
    name: 'Nhập điểm số',
    description: 'Vào điểm bài tập, kiểm tra cho học sinh',
    category: 'grades',
  },
  {
    id: 'grades.manage',
    code: 'grades.manage',
    name: 'Quản lý điểm số',
    description: 'Chỉnh sửa, phê duyệt và khóa bảng điểm',
    category: 'grades',
  },
  {
    id: 'grades.delete',
    code: 'grades.delete',
    name: 'Xóa điểm số',
    description: 'Xóa bản ghi điểm thi / kiểm tra',
    category: 'grades',
  },
  {
    id: 'grades.analytics',
    code: 'grades.analytics',
    name: 'Phân tích học lực',
    description: 'Xem biểu đồ phân phối điểm và xếp loại học lực',
    category: 'grades',
  },

  // Điểm danh
  {
    id: 'attendance.view',
    code: 'attendance.view',
    name: 'Xem chuyên cần',
    description: 'Tra cứu lịch sử điểm danh của học sinh',
    category: 'attendance',
  },
  {
    id: 'attendance.mark',
    code: 'attendance.mark',
    name: 'Điểm danh buổi học',
    description: 'Chấm điểm danh có mặt, vắng mặt, đi muộn',
    category: 'attendance',
  },
  {
    id: 'attendance.manage',
    code: 'attendance.manage',
    name: 'Quản lý chuyên cần',
    description: 'Sửa thông tin điểm danh và lý do nghỉ',
    category: 'attendance',
  },
  {
    id: 'attendance.reports',
    code: 'attendance.reports',
    name: 'Báo cáo chuyên cần',
    description: 'Xuất báo cáo tỷ lệ chuyên cần theo lớp/tháng',
    category: 'attendance',
  },

  // Thời khóa biểu
  {
    id: 'timetable.view',
    code: 'timetable.view',
    name: 'Xem thời khóa biểu',
    description: 'Xem lịch học và lịch dạy của trung tâm',
    category: 'timetable',
  },
  {
    id: 'timetable.edit',
    code: 'timetable.edit',
    name: 'Xếp thời khóa biểu',
    description: 'Tạo ca học, xếp phòng học và giáo viên',
    category: 'timetable',
  },

  // Môn học & Đăng ký
  {
    id: 'subjects.view',
    code: 'subjects.view',
    name: 'Xem danh mục môn học',
    description: 'Tra cứu môn học, khối lớp và học phần',
    category: 'subjects',
  },
  {
    id: 'subjects.manage',
    code: 'subjects.manage',
    name: 'Quản lý môn học',
    description: 'Thêm, sửa, cấu hình môn học',
    category: 'subjects',
  },
  {
    id: 'enrollments.view',
    code: 'enrollments.view',
    name: 'Xem đăng ký học',
    description: 'Tra cứu danh sách đăng ký ghi danh',
    category: 'enrollments',
  },
  {
    id: 'enrollments.manage',
    code: 'enrollments.manage',
    name: 'Duyệt đăng ký học',
    description: 'Xác nhận hoặc hủy đăng ký lớp',
    category: 'enrollments',
  },
  {
    id: 'curriculum.view',
    code: 'curriculum.view',
    name: 'Xem giáo trình',
    description: 'Tra cứu giáo án và tài liệu môn học',
    category: 'curriculum',
  },
  {
    id: 'curriculum.manage',
    code: 'curriculum.manage',
    name: 'Quản lý giáo trình',
    description: 'Tải lên tài liệu và phân phối bài giảng',
    category: 'curriculum',
  },

  // Tài chính & Báo cáo
  {
    id: 'finance.view',
    code: 'finance.view',
    name: 'Xem doanh thu & học phí',
    description: 'Tra cứu phiếu thu học phí và báo cáo thu chi',
    category: 'finance',
  },
  {
    id: 'finance.manage',
    code: 'finance.manage',
    name: 'Quản lý thu chi học phí',
    description: 'Tạo phiếu thu, xác nhận thanh toán',
    category: 'finance',
  },
  {
    id: 'finance.refund',
    code: 'finance.refund',
    name: 'Hoàn phí học tập',
    description: 'Xử lý hoàn tiền học phí theo quy định',
    category: 'finance',
  },
  {
    id: 'finance.export',
    code: 'finance.export',
    name: 'Xuất báo cáo tài chính',
    description: 'Xuất sổ thu chi ra file Excel',
    category: 'finance',
  },
  {
    id: 'reports.view',
    code: 'reports.view',
    name: 'Xem báo cáo trung tâm',
    description: 'Xem các chỉ số KPI hoạt động học vụ',
    category: 'reports',
  },
  {
    id: 'reports.export',
    code: 'reports.export',
    name: 'Xuất báo cáo thống kê',
    description: 'Tải về các biểu mẫu báo cáo tổng hợp',
    category: 'reports',
  },

  // Gia sư & Dạy kèm
  {
    id: 'tutoring.sessions.view',
    code: 'tutoring.sessions.view',
    name: 'Xem buổi dạy kèm',
    description: 'Xem lịch và nội dung các buổi kèm riêng 1-1',
    category: 'tutoring',
  },
  {
    id: 'tutoring.sessions.manage',
    code: 'tutoring.sessions.manage',
    name: 'Quản lý buổi dạy kèm',
    description: 'Lên lịch và ghi chú tiến độ buổi dạy kèm',
    category: 'tutoring',
  },
  {
    id: 'tutoring.feedback.submit',
    code: 'tutoring.feedback.submit',
    name: 'Gửi nhận xét gia sư',
    description: 'Nhận xét chi tiết sau mỗi buổi dạy',
    category: 'tutoring',
  },

  // Phụ huynh & Thông báo
  {
    id: 'parent_links.view',
    code: 'parent_links.view',
    name: 'Xem liên kết phụ huynh',
    description: 'Tra cứu phụ huynh liên kết với học sinh',
    category: 'parent',
  },
  {
    id: 'parent_links.approve',
    code: 'parent_links.approve',
    name: 'Duyệt liên kết phụ huynh',
    description: 'Xác thực quan hệ phụ huynh - học sinh',
    category: 'parent',
  },
  {
    id: 'parent.view_students',
    code: 'parent.view_students',
    name: 'Xem tình hình con em',
    description: 'Theo dõi điểm và chuyên cần của con',
    category: 'parent',
  },
  {
    id: 'parent.link_student',
    code: 'parent.link_student',
    name: 'Yêu cầu liên kết con',
    description: 'Gửi yêu cầu ghép nối với hồ sơ học sinh',
    category: 'parent',
  },
  {
    id: 'announcements.manage',
    code: 'announcements.manage',
    name: 'Đăng thông báo',
    description: 'Gửi thông báo toàn trung tâm hoặc theo lớp',
    category: 'announcements',
  },
];

// ============================================
// ROLE HIERARCHY (Inheritance)
// ============================================

/**
 * Defines which roles inherit from which other roles.
 * A role inherits everything from its parent.
 *
 * Owner is a STANDALONE strategic oversight role.
 * It does NOT inherit from admin — its permissions are
 * explicitly listed in BASE_ROLE_PERMISSIONS below.
 */
export const ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
  super_admin: ['owner', 'admin'],
  owner: [], // Standalone — strategic oversight, no operational inheritance
  admin: ['teacher'],
  teacher: ['student'],
  tutor: ['student'],
  parent: ['student'],
  student: [],
};

// ============================================
// BASE PERMISSIONS
// ============================================

/**
 * Permissions explicitly granted to each role.
 * Does not include inherited permissions.
 */
export const BASE_ROLE_PERMISSIONS: Record<UserRole, PermissionCode[]> = {
  super_admin: ['*'], // God mode
  owner: [
    // ── Visibility (read-only across the board) ──
    'users.view',
    'students.view',
    'classes.view',
    'timetable.view',
    'grades.view',
    'grades.analytics',
    'grades.manage',
    'attendance.view',
    'attendance.reports',
    'enrollments.view',
    'curriculum.view',
    'subjects.view',
    // ── Operational Controls (Same as Admin but standalone) ──
    'students.create',
    'students.edit',
    'students.delete',
    'students.import',
    'classes.manage',
    'classes.create',
    'classes.edit',
    'classes.delete',
    'classes.enroll',
    'enrollments.manage',
    'curriculum.manage',
    'grades.entry',
    'grades.delete',
    'timetable.edit',
    'subjects.manage',
    'parent_links.approve',
    // ── Finance — full control ──
    'finance.view',
    'finance.manage',
    'finance.refund',
    'finance.export',
    // ── Reports — full export control ──
    'reports.view',
    'reports.export',
    // ── Announcements — center-wide comms ──
    'announcements.manage',
    // ── Staff management (hiring/firing) ──
    'users.create',
    'users.edit',
    'users.delete',
    'users.delete.soft',
    'users.invite',
    'users.bulk_import',
    // ── Oversight ──
    'roles.view',
    'roles.manage',
    'permissions.manage',
    'parent_links.view',
  ],
  admin: [
    'roles.view',
    'permissions.manage',
    'users.view',
    'users.create',
    'users.edit',
    'users.delete',
    'users.delete.soft',
    'users.invite',
    'users.bulk_import',
    'parent_links.view',
    'parent_links.approve',
    'students.create',
    'students.edit',
    'students.delete',
    'students.import',
    'classes.manage',
    'classes.create',
    'classes.edit',
    'classes.delete',
    'classes.enroll',
    'classes.view',
    'enrollments.view',
    'enrollments.manage',
    'curriculum.manage',
    'grades.entry',
    'grades.manage',
    'grades.analytics',
    'attendance.manage',
    'timetable.edit',
    'tutoring.sessions.view',
    'tutoring.sessions.manage',
    'announcements.manage',
    'finance.view',
    'finance.manage',
    'finance.refund',
    'finance.export',
    'reports.view',
    'reports.export',
    'subjects.view',
    'subjects.manage',
  ],
  teacher: [
    'grades.entry',
    'grades.manage',
    'grades.delete',
    'attendance.mark',
    'attendance.reports',
    'curriculum.manage',
    'timetable.edit',
  ],
  tutor: [
    'tutoring.sessions.view',
    'tutoring.sessions.manage',
    'tutoring.feedback.submit',
    'timetable.view',
  ],
  parent: ['parent.view_students', 'parent.link_student'],
  student: [
    'students.view',
    'classes.view',
    'timetable.view',
    'grades.view',
    'attendance.view',
    'reports.view',
    'curriculum.view',
  ],
};

// ============================================
// RESOLUTION LOGIC
// ============================================

/**
 * Gets all permissions for a role, including all inherited ones.
 */
export function getFlattenedPermissions(role: UserRole): Set<PermissionCode> {
  const permissions = new Set<PermissionCode>(BASE_ROLE_PERMISSIONS[role] || []);
  const parents = ROLE_HIERARCHY[role] || [];

  for (const parent of parents) {
    const parentPerms = getFlattenedPermissions(parent);
    parentPerms.forEach((p) => permissions.add(p));
  }

  return permissions;
}

/**
 * Core check function.
 */
export function hasPermission(role: UserRole, permission: PermissionCode): boolean {
  if (role === 'super_admin') return true; // Safety override

  const flattened = getFlattenedPermissions(role);
  if (flattened.has('*')) return true;
  return flattened.has(permission);
}

/**
 * Check if a role is at or above a certain "clearance level".
 * e.g., isAdmin(role) -> includes admin and super_admin via inheritance.
 */
export function isAtLeast(currentRole: UserRole, requiredRole: UserRole): boolean {
  if (currentRole === requiredRole) return true;
  const parents = ROLE_HIERARCHY[currentRole] || [];
  return parents.some((parent) => isAtLeast(parent, requiredRole));
}
