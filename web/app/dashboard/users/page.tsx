// @ts-nocheck
/**
 * Modern User Management Page - Refactored with new UI components
 * 
 * Features:
 * - Clean, consistent UI using component library
 * - Better loading states and error handling
 * - Improved accessibility
 * - Audit trail integration
 * - Better UX with proper feedback
 */

"use client"

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import {
  Button,
  EmptyState,
  Alert,
  Input,
  Modal
} from '@/components/ui';
import { DropdownMenu, DropdownItem } from '@/components/ui/dropdown-menu';
import { Card, StatCard } from '@/components/ui/Card';
import { SkeletonTable, SkeletonStatCard } from '@/components/ui/skeleton';
import { Table } from '@/components/ui/table';
import Badge from '@/components/ui/badge';
import { Select, Textarea, Checkbox } from '@/components/ui/form';
import { Icons } from '@/components/ui/Icons';
import PageGuard from '@/components/PageGuard';
import type { UserRole } from '@/lib/database.types';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  phone?: string;
  department?: string;
  student_id?: string;
  grade_level?: string;
  notes?: string;
}

interface UserStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  admin_count: number;
  teacher_count: number;
  student_count: number;
  recent_signups: number;
}

const roleOptions = [
  { value: 'student', label: 'Student' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'admin', label: 'Administrator' },
];

export default function UserManagementPage() {
  return (
    <PageGuard permissions="users.view">
      <UserManagementPageContent />
    </PageGuard>
  );
}

function UserManagementPageContent() {
  // State management
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Filter states
  const [roleFilter, setRoleFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Form states
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'student' as UserRole,
    phone: '',
    department: '',
    student_id: '',
    grade_level: '',
    notes: '',
    is_active: true
  });

  const [passwordData, setPasswordData] = useState({
    new_password: '',
    confirm_password: ''
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      logger.info('Fetching users', { roleFilter, activeFilter, searchQuery, page });

      const params = new URLSearchParams({
        role: roleFilter,
        isActive: activeFilter,
        search: searchQuery,
        page: page.toString(),
        limit: '20'
      });

      const response = await apiFetch(`/api/admin/users?${params}`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.data || data.users || []);
        setStats(data.statistics || null);
        setTotalPages(data.pagination?.pages || 1);
        logger.info('Users fetched successfully', { count: data.data?.length || 0 });
      } else {
        throw new Error(data.error || 'Không thể tải danh sách người dùng');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch users';
      setError(errorMsg);
      logger.error('Error fetching users', err instanceof Error ? err : new Error(errorMsg), { originalError: errorMsg });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [roleFilter, activeFilter, searchQuery, page]);

  // Fetch users when filters change
  useEffect(() => {
    fetchUsers();
  }, [roleFilter, activeFilter, searchQuery, page, fetchUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate form
      if (!formData.email || !formData.password || !formData.full_name) {
        throw new Error('Vui lòng điền đầy đủ các trường bắt buộc');
      }

      if (formData.password.length < 6) {
        throw new Error('Mật khẩu phải có ít nhất 6 ký tự');
      }

      logger.info('Creating user', { email: formData.email, role: formData.role });

      const response = await apiFetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Tạo người dùng thành công!');
        setShowCreateModal(false);
        resetForm();
        fetchUsers();

        // Log to audit trail (in production, get current admin user from session)
        logger.audit('User created', {}, {
          newUserId: data.user?.id,
          email: formData.email,
          role: formData.role
        });
      } else {
        throw new Error(data.error || 'Không thể tạo người dùng');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Không thể tạo người dùng';
      setError(errorMsg);
      logger.error('Error creating user', err instanceof Error ? err : new Error(errorMsg), { originalError: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setLoading(true);
    setError(null);

    try {
      logger.info('Updating user', { userId: selectedUser.id, email: formData.email });

      const response = await apiFetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Cập nhật người dùng thành công!');
        setShowEditModal(false);
        setSelectedUser(null);
        resetForm();
        fetchUsers();

        logger.audit('User updated', {}, {
          userId: selectedUser.id,
          changes: formData
        });
      } else {
        throw new Error(data.error || 'Không thể cập nhật người dùng');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Không thể cập nhật người dùng';
      setError(errorMsg);
      logger.error('Error updating user', err instanceof Error ? err : new Error(errorMsg), { originalError: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('Passwords do not match');
      return;
    }

    if (passwordData.new_password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch(`/api/admin/users/${selectedUser.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: passwordData.new_password })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Đặt lại mật khẩu thành công!');
        setShowResetPasswordModal(false);
        setSelectedUser(null);
        setPasswordData({ new_password: '', confirm_password: '' });

        logger.audit('Password reset', {}, { userId: selectedUser.id });
      } else {
        throw new Error(data.error || 'Không thể đặt lại mật khẩu');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Không thể đặt lại mật khẩu';
      setError(errorMsg);
      logger.error('Error resetting password', err instanceof Error ? err : new Error(errorMsg), { originalError: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (user: User) => {
    setLoading(true);
    setError(null);

    try {
      logger.info('Toggling user active status', {
        userId: user.id,
        currentStatus: user.is_active
      });

      const response = await apiFetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...user, is_active: !user.is_active })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Người dùng đã được ${user.is_active ? 'vô hiệu hóa' : 'kích hoạt'} thành công!`);
        fetchUsers();

        logger.audit('User status changed', {}, {
          userId: user.id,
          newStatus: !user.is_active
        });
      } else {
        throw new Error(data.error || 'Failed to toggle user status');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to toggle user status';
      setError(errorMsg);
      logger.error('Error toggling user status', err instanceof Error ? err : new Error(errorMsg), { originalError: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setLoading(true);
    setError(null);

    try {
      logger.info('Deleting user', { userId: selectedUser.id, email: selectedUser.email });

      const response = await apiFetch(`/api/admin/users/${selectedUser.id}?permanent=true`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Người dùng "${selectedUser.full_name}" đã được xóa thành công!`);
        setShowDeleteModal(false);
        setSelectedUser(null);
        fetchUsers();

        logger.audit('User deleted', {}, {
          userId: selectedUser.id,
          email: selectedUser.email
        });
      } else {
        throw new Error(data.error || 'Không thể xóa người dùng');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Không thể xóa người dùng';
      setError(errorMsg);
      logger.error('Error deleting user', err instanceof Error ? err : new Error(errorMsg), { originalError: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      full_name: '',
      role: 'student',
      phone: '',
      department: '',
      student_id: '',
      grade_level: '',
      notes: '',
      is_active: true
    });
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      password: '',
      full_name: user.full_name,
      role: user.role,
      phone: user.phone || '',
      department: user.department || '',
      student_id: user.student_id || '',
      grade_level: user.grade_level || '',
      notes: user.notes || '',
      is_active: user.is_active
    });
    setShowEditModal(true);
  };

  const openResetPasswordModal = (user: User) => {
    setSelectedUser(user);
    setPasswordData({ new_password: '', confirm_password: '' });
    setShowResetPasswordModal(true);
  };

  // Role badge color
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'danger';
      case 'teacher': return 'info';
      case 'student': return 'success';
      default: return 'default';
    }
  };

  // Render statistics cards
  const renderStats = () => {
    if (!stats) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Tổng số người dùng"
          value={stats.total_users}
          icon={<Icons.Users className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          label="Đang hoạt động"
          value={stats.active_users}
          icon={<Icons.Success className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          label="Giáo viên"
          value={stats.teacher_count}
          icon={<Icons.Teachers className="w-6 h-6" />}
          color="orange"
        />
        <StatCard
          label="Học sinh"
          value={stats.student_count}
          icon={<Icons.Students className="w-6 h-6" />}
          color="purple"
        />
      </div>
    );
  };

  // Main render
  if (loading && users.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="h-10 w-64 bg-stone-200 rounded animate-pulse mb-2" />
          <div className="h-6 w-96 bg-stone-200 rounded animate-pulse" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>

        <Card>
          <SkeletonTable rows={10} columns={5} />
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Icons.Users className="w-8 h-8 text-primary" />
              Quản lý người dùng
            </h1>
            <p className="text-muted mt-1">Quản lý người dùng, vai trò và quyền hạn</p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Alert
            variant="error"
            title="Error"
            message={error}
            onClose={() => setError(null)}
          />
        )}

        {success && (
          <Alert
            variant="success"
            title="Success"
            message={success}
            onClose={() => setSuccess(null)}
          />
        )}

        {/* Statistics */}
        {renderStats()}

        {/* Filters and Search */}
        <div className="bg-surface border border-border rounded-xl p-4 shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              type="text"
              placeholder="Tìm kiếm người dùng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-border focus:border-primary focus:ring-primary/20"
              leftIcon={<Icons.Search className="w-5 h-5 text-muted" />}
            />

            <Select
              placeholder="Tất cả vai trò"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              options={[
                { value: 'all', label: 'Tất cả vai trò' },
                ...roleOptions
              ]}
            />

            <Select
              placeholder="Tất cả trạng thái"
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              options={[
                { value: 'all', label: 'Tất cả trạng thái' },
                { value: 'true', label: 'Chỉ hoạt động' },
                { value: 'false', label: 'Chỉ không hoạt động' },
              ]}
            />

            <Button
              variant="primary"
              onClick={() => setShowCreateModal(true)}
              className="shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all"
              leftIcon={<Icons.Add className="w-4 h-4" />}
              fullWidth
            >
              Thêm người dùng
            </Button>
          </div>
        </div>

        {/* User Table */}
        {users.length === 0 ? (
          <EmptyState
            icon={<Icons.Users className="w-12 h-12 text-stone-400" />}
            title="Không tìm thấy người dùng"
            description="Thử điều chỉnh tìm kiếm hoặc bộ lọc"
            action={
              <Button onClick={() => {
                setSearchQuery('');
                setRoleFilter('all');
                setActiveFilter('all');
              }}>
                Xóa bộ lọc
              </Button>
            }
          />
        ) : (
          <Card className="p-0">
            <Table
              data={users}
              keyExtractor={(user) => user.id}
              columns={[
                {
                  key: 'full_name',
                  header: 'Họ tên',
                  render: (user) => (
                    <div>
                      <p className="font-medium text-stone-900">{user.full_name}</p>
                      <p className="text-sm text-stone-500">{user.email}</p>
                    </div>
                  )
                },
                {
                  key: 'role',
                  header: 'Vai trò',
                  render: (user) => (
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Badge>
                  )
                },
                {
                  key: 'is_active',
                  header: 'Trạng thái',
                  render: (user) => (
                    <Badge variant={user.is_active ? 'success' : 'default'}>
                      {user.is_active ? 'Hoạt động' : 'Không hoạt động'}
                    </Badge>
                  )
                },
                {
                  key: 'last_login_at',
                  header: 'Đăng nhập cuối',
                  render: (user) => (
                    <span className="text-sm text-stone-600">
                      {user.last_login_at
                        ? new Date(user.last_login_at).toLocaleDateString('vi-VN')
                        : 'Never'}
                    </span>
                  )
                },
                {
                  key: 'actions',
                  header: 'Thao tác',
                  render: (user) => (
                    <div className="flex justify-end pr-2">
                      <DropdownMenu
                        trigger={
                          <button className="p-2 rounded-lg hover:bg-surface-hover text-muted transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>
                        }
                      >
                        <DropdownItem
                          onClick={() => openEditModal(user)}
                          icon={<Icons.Edit className="w-4 h-4" />}
                        >
                          Chỉnh sửa
                        </DropdownItem>
                        <DropdownItem
                          onClick={() => openResetPasswordModal(user)}
                          icon={<Icons.Lock className="w-4 h-4" />}
                        >
                          Đặt lại mật khẩu
                        </DropdownItem>
                        <DropdownItem
                          onClick={() => handleToggleActive(user)}
                          variant={user.is_active ? "danger" : "success"}
                          icon={user.is_active ? <Icons.Error className="w-4 h-4" /> : <Icons.Success className="w-4 h-4" />}
                        >
                          {user.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                        </DropdownItem>
                        <DropdownItem
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDeleteModal(true);
                          }}
                          variant="danger"
                          icon={<Icons.Trash className="w-4 h-4" />}
                        >
                          Xóa người dùng
                        </DropdownItem>
                      </DropdownMenu>
                    </div>
                  )
                }
              ]}
            />
          </Card>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-6">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Trước
            </Button>
            <span className="text-sm text-stone-600">
              Trang {page} của {totalPages}
            </span>
            <Button
              variant="outline"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              Tiếp theo
            </Button>
          </div>
        )}

        {/* Create User Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            resetForm();
          }}
          title="Tạo người dùng mới"
          size="lg"
        >
          <form onSubmit={handleCreateUser}>
            <div className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="user@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />

              <Input
                label="Mật khẩu"
                type="password"
                placeholder="Ít nhất 6 ký tự"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                hint="Tối thiểu 6 ký tự"
              />

              <Input
                label="Họ và tên"
                type="text"
                placeholder="Nguyễn Văn A"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />

              <Select
                label="Vai trò"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                options={roleOptions}
                required
              />

              <Input
                label="Số điện thoại"
                type="tel"
                placeholder="0123 456 789"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />

              {formData.role === 'teacher' && (
                <Input
                  label="Bộ môn"
                  type="text"
                  placeholder="Toán học, Ngữ văn, v.v."
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                />
              )}

              {formData.role === 'student' && (
                <>
                  <Input
                    label="Mã học sinh"
                    type="text"
                    placeholder="HS-12345"
                    value={formData.student_id}
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                  />
                  <Input
                    label="Khối lớp"
                    type="text"
                    placeholder="10, 11, 12"
                    value={formData.grade_level}
                    onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
                  />
                </>
              )}

              <Textarea
                label="Ghi chú"
                placeholder="Thông tin bổ sung..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />

              <Checkbox
                label="Hoạt động"
                description="Người dùng có thể đăng nhập và truy cập hệ thống"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
              >
                Hủy
              </Button>
              <Button type="submit" variant="primary" isLoading={loading}>
                Tạo người dùng
              </Button>
            </div>
          </form>
        </Modal>

        {/* Edit User Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
            resetForm();
          }}
          title="Chỉnh sửa người dùng"
          size="lg"
        >
          <form onSubmit={handleUpdateUser}>
            <div className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />

              <Input
                label="Full Name"
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />

              <Select
                label="Role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                options={roleOptions}
                required
              />

              <Input
                label="Phone Number"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />

              {formData.role === 'teacher' && (
                <Input
                  label="Department"
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                />
              )}

              {formData.role === 'student' && (
                <>
                  <Input
                    label="Student ID"
                    type="text"
                    value={formData.student_id}
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                  />
                  <Input
                    label="Grade Level"
                    type="text"
                    value={formData.grade_level}
                    onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
                  />
                </>
              )}

              <Textarea
                label="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />

              <Checkbox
                label="Active"
                description="Người dùng có thể đăng nhập và truy cập hệ thống"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedUser(null);
                  resetForm();
                }}
              >
                Hủy
              </Button>
              <Button type="submit" variant="primary" isLoading={loading}>
                Lưu thay đổi
              </Button>
            </div>
          </form>
        </Modal>

        {/* Reset Password Modal */}
        <Modal
          isOpen={showResetPasswordModal}
          onClose={() => {
            setShowResetPasswordModal(false);
            setSelectedUser(null);
            setPasswordData({ new_password: '', confirm_password: '' });
          }}
          title="Đặt lại mật khẩu"
          size="md"
        >
          <form onSubmit={handleResetPassword}>
            <div className="space-y-4">
              <Alert
                variant="info"
                title="Đặt lại mật khẩu"
                message={`Bạn đang đặt lại mật khẩu cho ${selectedUser?.full_name}`}
              />

              <Input
                label="Mật khẩu mới"
                type="password"
                placeholder="Ít nhất 6 ký tự"
                value={passwordData.new_password}
                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                required
                hint="Tối thiểu 6 ký tự"
              />

              <Input
                label="Xác nhận mật khẩu"
                type="password"
                placeholder="Nhập lại mật khẩu"
                value={passwordData.confirm_password}
                onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                required
                error={
                  passwordData.confirm_password &&
                    passwordData.new_password !== passwordData.confirm_password
                    ? 'Mật khẩu không khớp'
                    : undefined
                }
              />
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowResetPasswordModal(false);
                  setSelectedUser(null);
                  setPasswordData({ new_password: '', confirm_password: '' });
                }}
              >
                Hủy
              </Button>
              <Button type="submit" variant="danger" isLoading={loading}>
                Đặt lại mật khẩu
              </Button>
            </div>
          </form>
        </Modal>

        {/* Delete User Confirmation Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedUser(null);
          }}
          title="Xác nhận xóa người dùng"
          size="md"
        >
          <div className="space-y-4">
            <Alert
              variant="error"
              title="Cảnh báo: Thao tác không thể hoàn tác!"
              message="Người dùng và tất cả dữ liệu liên quan sẽ bị xóa vĩnh viễn."
            />

            <div className="bg-stone-100 dark:bg-stone-800 rounded-lg p-4">
              <p className="text-sm text-stone-600 dark:text-stone-400 mb-2">Bạn sắp xóa người dùng:</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Icons.Users className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="font-semibold text-stone-900 dark:text-stone-100">{selectedUser?.full_name}</p>
                  <p className="text-sm text-stone-500">{selectedUser?.email}</p>
                </div>
              </div>
            </div>

            <p className="text-sm text-stone-600 dark:text-stone-400">
              Nhập <strong>&quot;{selectedUser?.email}&quot;</strong> để xác nhận xóa.
            </p>
            <Input
              type="text"
              placeholder="Nhập email để xác nhận"
              id="delete-confirm-input"
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedUser(null);
              }}
            >
              Hủy
            </Button>
            <Button
              variant="danger"
              isLoading={loading}
              onClick={() => {
                const input = document.getElementById('delete-confirm-input') as HTMLInputElement;
                if (input?.value === selectedUser?.email) {
                  handleDeleteUser();
                } else {
                  setError('Email xác nhận không khớp');
                }
              }}
            >
              Xóa vĩnh viễn
            </Button>
          </div>
        </Modal>
      </div>
    </div>
  );
}
