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
import { Card, StatCard } from '@/components/ui/Card';
import { SkeletonTable, SkeletonStatCard } from '@/components/ui/skeleton';
import { Table } from '@/components/ui/table';
import Badge from '@/components/ui/badge';
import { Select, Textarea, Checkbox } from '@/components/ui/form';
import { Icons } from '@/components/ui/Icons';
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
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-stone-900 mb-2">Quản lý người dùng</h1>
        <p className="text-stone-600">Quản lý người dùng, vai trò và quyền hạn</p>
      </div>

      {/* Alerts */}
      {error && (
        <Alert 
          variant="error" 
          title="Error" 
          message={error}
          onClose={() => setError(null)}
          className="mb-4"
        />
      )}

      {success && (
        <Alert 
          variant="success" 
          title="Success" 
          message={success}
          onClose={() => setSuccess(null)}
          className="mb-4"
        />
      )}

      {/* Statistics */}
      {renderStats()}

      {/* Filters and Search */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            type="text"
            placeholder="Tìm kiếm người dùng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<span>🔍</span>}
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
            leftIcon={<Icons.Add className="w-4 h-4" />}
            fullWidth
          >
            Thêm người dùng
          </Button>
        </div>
      </Card>

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
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => openEditModal(user)}
                    >
                      Chỉnh sửa
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => openResetPasswordModal(user)}
                    >
                      Đặt lại mật khẩu
                    </Button>
                    <Button 
                      size="sm" 
                      variant={user.is_active ? 'danger' : 'success'}
                      onClick={() => handleToggleActive(user)}
                    >
                      {user.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                    </Button>
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
    </div>
  );
}
