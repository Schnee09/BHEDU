'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { Button, Input, Modal, Card, Table, Badge, Alert } from '@/components/ui';
import { DropdownMenu, DropdownItem } from '@/components/ui/dropdown-menu';
import { StatCard } from '@/components/ui/Card';
import { SkeletonTable, SkeletonStatCard } from '@/components/ui/skeleton';
import { Select } from '@/components/ui/form';
import { Icons } from '@/components/ui/Icons';
import PageGuard from '@/components/PageGuard';
import type { UserRole } from '@/lib/auth/core';
import MobileUserList from '@/components/users/MobileUserList';
import UserFormModal from '@/components/users/UserFormModal';
import ResetPasswordModal from '@/components/users/ResetPasswordModal';
import DeleteUserModal from '@/components/users/DeleteUserModal';
import { AcademicBackground } from '@/components/Academic/AcademicBackground';
import { showToast } from '@/components/ToastProvider';
import { cn } from '@/lib/utils';
import { getRoleLabel } from '@/lib/role-utils';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  phone?: string;
  is_managed?: boolean;
  student_code?: string;
  student_id?: string;
  teacher_code?: string;
  department?: string;
  grade_level?: string;
  notes?: string;
  personal_email?: string;
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
  { value: 'student', label: 'Học sinh' },
  { value: 'teacher', label: 'Giáo viên' },
  { value: 'tutor', label: 'Gia sư' },
  { value: 'parent', label: 'Phụ huynh' },
  { value: 'admin', label: 'Quản trị viên' },
  { value: 'owner', label: 'Chủ trung tâm' },
  { value: 'super_admin', label: 'Siêu quản trị viên' },
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

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Redesign states
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [showDrawer, setShowDrawer] = useState(false);

  // Filter states
  const [roleFilter, setRoleFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      logger.info('Fetching users', { roleFilter, activeFilter, searchQuery, page });

      const params = new URLSearchParams({
        search: searchQuery,
        page: page.toString(),
        limit: '50',
      });

      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (activeFilter !== 'all') params.append('is_active', activeFilter);

      const response = await apiFetch(`/api/admin/users?${params}`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.data || data.users || []);
        setStats(data.statistics || null);
        setTotalPages(data.pagination?.totalPages || 1);
        logger.info('Users fetched successfully', { count: data.data?.length || 0 });
      } else {
        throw new Error(data.error || 'Không thể tải danh sách người dùng');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch users';
      setError(errorMsg);
      logger.error('Error fetching users', err instanceof Error ? err : new Error(errorMsg), {
        originalError: errorMsg,
      });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [roleFilter, activeFilter, searchQuery, page]);

  // Fetch users when filters change
  useEffect(() => {
    fetchUsers();
    setSelectedUserIds(new Set());
  }, [roleFilter, activeFilter, searchQuery, page, fetchUsers]);

  const handleToggleActive = async (user: User) => {
    setLoading(true);
    setError(null);

    try {
      logger.info('Toggling user active status', {
        userId: user.id,
        currentStatus: user.is_active,
      });

      const response = await apiFetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...user, is_active: !user.is_active }),
      });

      const data = await response.json();

      if (data.success) {
        showToast.success(
          `Người dùng đã được ${user.is_active ? 'vô hiệu hóa' : 'kích hoạt'} thành công!`
        );
        fetchUsers();

        logger.audit(
          'User status changed',
          {},
          {
            userId: user.id,
            newStatus: !user.is_active,
          }
        );
      } else {
        throw new Error(data.error || 'Failed to toggle user status');
      }
    } catch (err: any) {
      showToast.error(err.message || 'Không thể thay đổi trạng thái');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkStatus = async (isActive: boolean) => {
    const ids = Array.from(selectedUserIds);
    const toastId = showToast.loading(
      `Đang ${isActive ? 'kích hoạt' : 'khóa'} ${ids.length} tài khoản...`
    );
    try {
      await Promise.all(
        ids.map(async (id) => {
          const user = users.find((u) => u.id === id);
          if (!user) return;
          await apiFetch(`/api/admin/users/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...user, is_active: isActive }),
          });
        })
      );
      showToast.dismiss(toastId);
      showToast.success(
        `Đã ${isActive ? 'kích hoạt' : 'khóa'} hàng loạt ${ids.length} tài khoản thành công!`
      );
      setSelectedUserIds(new Set());
      fetchUsers();
    } catch (err) {
      showToast.dismiss(toastId);
      showToast.error('Không thể thay đổi trạng thái một số tài khoản');
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedUserIds);
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa vĩnh viễn ${ids.length} tài khoản đã chọn? Thao tác này không thể hoàn tác.`
      )
    ) {
      return;
    }
    const toastId = showToast.loading(`Đang xóa ${ids.length} tài khoản...`);
    try {
      await Promise.all(ids.map((id) => apiFetch(`/api/admin/users/${id}`, { method: 'DELETE' })));
      showToast.dismiss(toastId);
      showToast.success(`Đã xóa hàng loạt ${ids.length} tài khoản thành công!`);
      setSelectedUserIds(new Set());
      fetchUsers();
    } catch (err) {
      showToast.dismiss(toastId);
      showToast.error('Không thể xóa một số tài khoản');
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const openResetPasswordModal = (user: User) => {
    setSelectedUser(user);
    setShowResetPasswordModal(true);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
      case 'super_admin':
        return 'info'; // Sky/Blue for admin
      case 'owner':
        return 'warning'; // Amber for owner
      case 'teacher':
      case 'tutor':
        return 'blue'; // Sky blue for educators
      case 'student':
        return 'success'; // Emerald for students
      case 'parent':
        return 'gold'; // Amber for parents
      default:
        return 'default';
    }
  };

  // Render statistics cards
  const renderStats = () => {
    if (!stats) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          label="Tổng người dùng"
          value={stats.total_users}
          icon={<Icons.Users className="w-8 h-8 text-blue-600" />}
          color="blue"
          className="glass-crystal rounded-3xl border-none shadow-ultra hover:translate-y-[-4px] transition-all duration-300"
        />
        <StatCard
          label="Đang hoạt động"
          value={stats.active_users}
          icon={<Icons.Success className="w-8 h-8 text-emerald-600" />}
          color="green"
          className="glass-crystal rounded-3xl border-none shadow-ultra hover:translate-y-[-4px] transition-all duration-300"
        />
        <StatCard
          label="Giáo viên"
          value={stats.teacher_count}
          icon={<Icons.Teachers className="w-8 h-8 text-amber-600" />}
          color="orange"
          className="glass-crystal rounded-3xl border-none shadow-ultra hover:translate-y-[-4px] transition-all duration-300"
        />
        <StatCard
          label="Học sinh"
          value={stats.student_count}
          icon={<Icons.Students className="w-8 h-8 text-emerald-600" />}
          color="emerald"
          className="glass-crystal rounded-3xl border-none shadow-ultra hover:translate-y-[-4px] transition-all duration-300"
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
    <div className="min-h-screen relative overflow-hidden bg-stone-50 dark:bg-[#080808] font-['Be_Vietnam_Pro'] selection:bg-emerald-600/30 text-stone-900 dark:text-stone-100 p-4 md:p-12 lg:p-16">
      <AcademicBackground />
      <div className="max-w-[1600px] mx-auto space-y-12 relative z-10 animate-fade-in">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-stone-200 dark:border-stone-800 pb-10">
          <div className="space-y-4">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight flex items-center gap-5">
              <div className="p-3 glass-crystal rounded-[1.5rem] shadow-ultra">
                <Icons.Users className="w-8 h-8 text-emerald-600" />
              </div>
              Quản lý <span className="text-emerald-600">tài khoản</span>
            </h1>
            <p className="text-stone-500 font-medium text-xs md:text-sm flex items-center gap-3">
              <span className="w-2 h-2 bg-emerald-600/50 rounded-full" />
              Danh sách và thông tin quản trị thành viên trong hệ thống
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="success"
              onClick={() => setShowCreateModal(true)}
              className="h-12 px-8 rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/10"
              leftIcon={<Icons.Add className="w-5 h-5" />}
            >
              Thêm người dùng mới
            </Button>
          </div>
        </div>

        {/* Statistics Tiles */}
        {renderStats()}

        {/* Filters and Table Section */}
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="glass-crystal p-6 rounded-[2rem] border-none flex flex-col lg:flex-row gap-5 items-center shadow-ultra">
            <div className="flex-1 w-full relative group">
              <Icons.Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 group-focus-within:text-emerald-600 transition-colors" />
              <Input
                type="text"
                placeholder="Tìm kiếm theo tên, email, số điện thoại..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-14 pl-12 pr-6 bg-transparent rounded-xl border-none text-sm font-medium focus:ring-2 focus:ring-emerald-600/20 transition-all outline-none placeholder:text-stone-400"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              <div className="w-full sm:w-52">
                <Select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="h-14 rounded-xl font-semibold text-sm glass-crystal border-none"
                  options={[
                    { value: 'all', label: 'Tất cả vai trò' },
                    ...roleOptions.map((o) => ({ value: o.value, label: o.label })),
                  ]}
                />
              </div>

              <div className="w-full sm:w-52">
                <Select
                  value={activeFilter}
                  onChange={(e) => setActiveFilter(e.target.value)}
                  className="h-14 rounded-xl font-semibold text-sm glass-crystal border-none"
                  options={[
                    { value: 'all', label: 'Tất cả trạng thái' },
                    { value: 'true', label: 'Hoạt động' },
                    { value: 'false', label: 'Vô hiệu hóa' },
                  ]}
                />
              </div>

              <Button
                variant="outline"
                className="h-14 w-14 p-0 rounded-xl border-none glass-crystal hover:bg-white/10"
                onClick={() => {
                  setSearchQuery('');
                  setRoleFilter('all');
                  setActiveFilter('all');
                }}
              >
                <Icons.Refresh className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Table Container */}
          <Card className="rounded-[2.5rem] overflow-hidden border-none shadow-ultra glass-crystal p-0">
            {users.length === 0 ? (
              <div className="py-24 text-center">
                <div className="w-20 h-20 bg-stone-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Icons.Users className="w-10 h-10 text-stone-300" />
                </div>
                <h3 className="text-xl font-black text-stone-900 dark:text-white mb-2">
                  Không tìm thấy ai cả!
                </h3>
                <p className="text-stone-400 font-medium">
                  Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm của bạn.
                </p>
                <Button
                  variant="outline"
                  className="mt-8 rounded-xl"
                  onClick={() => {
                    setSearchQuery('');
                    setRoleFilter('all');
                    setActiveFilter('all');
                  }}
                >
                  Xóa tất cả bộ lọc
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table
                  data={users}
                  keyExtractor={(user) => user.id}
                  className="border-none"
                  onRowClick={(user) => {
                    setSelectedUser(user);
                    setShowDrawer(true);
                  }}
                  rowClassName={(user) =>
                    cn(
                      'transition-all duration-200',
                      !user.is_active && 'opacity-60 saturate-50 bg-red-500/[0.01]'
                    )
                  }
                  columns={[
                    {
                      key: 'selection',
                      header: (
                        <input
                          type="checkbox"
                          checked={selectedUserIds.size === users.length && users.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUserIds(new Set(users.map((u) => u.id)));
                            } else {
                              setSelectedUserIds(new Set());
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4.5 h-4.5 rounded-lg border-stone-300 dark:border-stone-700 text-emerald-600 focus:ring-emerald-500 bg-transparent cursor-pointer"
                        />
                      ),
                      render: (user) => (
                        <input
                          type="checkbox"
                          checked={selectedUserIds.has(user.id)}
                          onChange={(e) => {
                            const next = new Set(selectedUserIds);
                            if (e.target.checked) {
                              next.add(user.id);
                            } else {
                              next.delete(user.id);
                            }
                            setSelectedUserIds(next);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4.5 h-4.5 rounded-lg border-stone-300 dark:border-stone-700 text-emerald-600 focus:ring-emerald-500 bg-transparent cursor-pointer"
                        />
                      ),
                    },
                    {
                      key: 'full_name',
                      header: 'NGƯỜI DÙNG',
                      render: (user) => (
                        <div className="flex items-center gap-4 py-2">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-stone-100 to-stone-50 dark:from-white/5 dark:to-white/2 flex items-center justify-center font-bold text-stone-400 border border-stone-100 dark:border-white/5 group-hover:scale-105 transition-transform">
                            {user.full_name?.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p
                                className={cn(
                                  'font-bold tracking-tight transition-all',
                                  !user.is_active
                                    ? 'text-stone-400 dark:text-stone-500 line-through'
                                    : 'text-stone-900 dark:text-white'
                                )}
                              >
                                {user.full_name}
                              </p>
                              {user.is_managed && (
                                <Badge
                                  variant="info"
                                  className="text-[9px] px-2 py-0.5 rounded font-bold"
                                >
                                  Quản lý bởi HT
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-stone-400 font-medium">{user.email}</p>
                          </div>
                        </div>
                      ),
                    },
                    {
                      key: 'role',
                      header: 'VAI TRÒ',
                      render: (user) => (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(user);
                          }}
                          className={cn(
                            'cursor-pointer active:scale-95 transition-all',
                            'px-3 py-1 rounded-full border-none shadow-sm font-bold text-xs ring-1 ring-stone-900/5 dark:ring-white/10'
                          )}
                          title="Click để chỉnh sửa nhanh hồ sơ"
                        >
                          <Badge
                            variant={getRoleBadgeVariant(user.role) as any}
                            className="px-0 py-0 border-none shadow-none font-bold text-xs bg-transparent text-inherit"
                          >
                            {getRoleLabel(user.role)}
                          </Badge>
                        </button>
                      ),
                    },
                    {
                      key: 'identity',
                      header: 'ĐỊNH DANH',
                      render: (user) => (
                        <div className="flex flex-col gap-1">
                          {(user.student_code || user.teacher_code) && (
                            <div className="flex items-center gap-1.5 text-[10px]">
                              <span className="text-stone-400 font-bold uppercase tracking-wide opacity-70">
                                UID:
                              </span>
                              <code className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold">
                                {user.student_code || user.teacher_code}
                              </code>
                            </div>
                          )}
                          {user.role === 'student' && user.student_id && (
                            <div className="flex items-center gap-1.5 text-[10px]">
                              <span className="text-stone-400 font-bold uppercase tracking-wide opacity-70">
                                CID:
                              </span>
                              <code className="bg-amber-500/10 text-amber-600 dark:text-amber-500 px-1.5 py-0.5 rounded font-mono font-bold">
                                {user.student_id}
                              </code>
                            </div>
                          )}
                          {!user.student_code && !user.teacher_code && !user.student_id && (
                            <span className="text-stone-400 font-mono text-xs">—</span>
                          )}
                        </div>
                      ),
                    },
                    {
                      key: 'status',
                      header: 'TRẠNG THÁI',
                      render: (user) => (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleActive(user);
                          }}
                          className={cn(
                            'cursor-pointer active:scale-95 transition-all px-3 py-1 rounded-full border-none shadow-sm font-bold text-xs ring-1 ring-stone-900/5 dark:ring-white/10',
                            user.is_active
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                              : 'bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20'
                          )}
                          title="Click để thay đổi trạng thái"
                        >
                          {user.is_active ? 'Hoạt động' : 'Đã khóa'}
                        </button>
                      ),
                    },
                    {
                      key: 'created_at',
                      header: 'NGÀY THAM GIA',
                      render: (user) => (
                        <div className="flex flex-col">
                          <span className="text-stone-900 dark:text-white font-bold tracking-tight">
                            {new Date(user.created_at).toLocaleDateString('vi-VN')}
                          </span>
                          <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wide">
                            {new Date(user.created_at).toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      ),
                    },
                    {
                      key: 'actions',
                      header: '',
                      render: (user) => (
                        <div
                          className="flex justify-end items-center gap-1.5 pr-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Quick Action Icons visible on row hover */}
                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity duration-200 mr-2">
                            <button
                              onClick={() => openEditModal(user)}
                              className="w-8 h-8 rounded-xl bg-stone-50 dark:bg-white/5 text-stone-600 dark:text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center justify-center border border-stone-200/50 dark:border-white/5 active:scale-90 transition-all"
                              title="Chỉnh sửa hồ sơ"
                            >
                              <Icons.Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openResetPasswordModal(user)}
                              className="w-8 h-8 rounded-xl bg-stone-50 dark:bg-white/5 text-stone-600 dark:text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 flex items-center justify-center border border-stone-200/50 dark:border-white/5 active:scale-90 transition-all"
                              title="Đặt lại mật khẩu"
                            >
                              <Icons.Lock className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleActive(user)}
                              className={cn(
                                'w-8 h-8 rounded-xl bg-stone-50 dark:bg-white/5 flex items-center justify-center border border-stone-200/50 dark:border-white/5 active:scale-90 transition-all',
                                user.is_active
                                  ? 'text-stone-600 dark:text-stone-400 hover:text-red-500'
                                  : 'text-red-500 hover:text-emerald-500'
                              )}
                              title={user.is_active ? 'Khóa' : 'Mở khóa'}
                            >
                              {user.is_active ? (
                                <Icons.Error className="w-4 h-4" />
                              ) : (
                                <Icons.Success className="w-4 h-4" />
                              )}
                            </button>
                          </div>

                          <DropdownMenu
                            trigger={
                              <button className="w-9 h-9 rounded-xl hover:bg-stone-100 dark:hover:bg-white/5 text-stone-400 flex items-center justify-center transition-all active:scale-95">
                                <Icons.More className="w-5 h-5" />
                              </button>
                            }
                          >
                            <DropdownItem
                              onClick={() => openEditModal(user)}
                              icon={<Icons.Edit className="w-4 h-4" />}
                              className="font-bold py-3"
                            >
                              Chỉnh sửa hồ sơ
                            </DropdownItem>
                            <DropdownItem
                              onClick={() => openResetPasswordModal(user)}
                              icon={<Icons.Lock className="w-4 h-4" />}
                              className="font-bold py-3"
                            >
                              Đặt lại mật khẩu
                            </DropdownItem>
                            <DropdownItem
                              onClick={() => handleToggleActive(user)}
                              variant={user.is_active ? 'danger' : 'default'}
                              icon={
                                user.is_active ? (
                                  <Icons.Error className="w-4 h-4" />
                                ) : (
                                  <Icons.Success className="w-4 h-4" />
                                )
                              }
                              className="font-bold py-3"
                            >
                              {user.is_active ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                            </DropdownItem>
                            <div className="h-px bg-stone-200 dark:bg-stone-800 my-1" />
                            <DropdownItem
                              onClick={() => {
                                setSelectedUser(user);
                                setShowDeleteModal(true);
                              }}
                              variant="danger"
                              icon={<Icons.Trash className="w-4 h-4" />}
                              className="font-bold py-3"
                            >
                              Xóa vĩnh viễn
                            </DropdownItem>
                          </DropdownMenu>
                        </div>
                      ),
                    },
                  ]}
                />
              </div>
            )}

            {/* Pagination Footer */}
            {totalPages > 1 && (
              <div className="p-8 border-t border-stone-100 dark:border-white/5 flex items-center justify-between bg-stone-50/30 dark:bg-transparent">
                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">
                  Trang {page} / {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={page === 1}
                    className="rounded-xl h-11 px-6 font-black uppercase tracking-widest text-[10px]"
                    onClick={() => setPage(page - 1)}
                  >
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    disabled={page === totalPages}
                    className="rounded-xl h-11 px-6 font-black uppercase tracking-widest text-[10px]"
                    onClick={() => setPage(page + 1)}
                  >
                    Tiếp
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedUserIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[1150] bg-stone-900 dark:bg-stone-950 text-white rounded-3xl px-8 py-4 flex flex-col sm:flex-row items-center gap-6 shadow-2xl shadow-black/40 border border-stone-800 dark:border-stone-850 animate-slide-in-bottom">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-sm font-bold tracking-tight">
              Đã chọn {selectedUserIds.size} tài khoản
            </span>
          </div>
          <div className="h-px w-full sm:h-5 sm:w-px bg-stone-800 dark:bg-stone-850" />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => handleBulkStatus(true)}
              className="h-10 px-4 text-xs font-black uppercase tracking-widest text-white border-stone-800 hover:bg-stone-900 rounded-xl"
            >
              Kích hoạt
            </Button>
            <Button
              variant="outline"
              onClick={() => handleBulkStatus(false)}
              className="h-10 px-4 text-xs font-black uppercase tracking-widest text-white border-stone-800 hover:bg-stone-900 rounded-xl"
            >
              Khóa
            </Button>
            <Button
              variant="danger"
              onClick={handleBulkDelete}
              className="h-10 px-4 text-xs font-black uppercase tracking-widest bg-red-600 hover:bg-red-700 text-white rounded-xl border-none shadow-md"
            >
              Xóa vĩnh viễn
            </Button>
            <Button
              variant="ghost"
              onClick={() => setSelectedUserIds(new Set())}
              className="h-10 px-4 text-xs font-black uppercase tracking-widest text-stone-400 hover:text-white rounded-xl"
            >
              Bỏ chọn
            </Button>
          </div>
        </div>
      )}

      {/* Detailed Sliding Drawer Panel */}
      <UserDrawer
        user={selectedUser}
        isOpen={showDrawer}
        onClose={() => {
          setShowDrawer(false);
          setSelectedUser(null);
        }}
        openEditModal={openEditModal}
        openResetPasswordModal={openResetPasswordModal}
        handleToggleActive={handleToggleActive}
        openDeleteModal={() => {
          setShowDrawer(false);
          setShowDeleteModal(true);
        }}
        getRoleBadgeVariant={getRoleBadgeVariant}
      />

      {/* Unified User Modals */}
      <UserFormModal
        isOpen={showCreateModal || showEditModal}
        onClose={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
          setSelectedUser(null);
        }}
        onSuccess={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
          setSelectedUser(null);
          fetchUsers();
        }}
        user={showEditModal ? selectedUser : undefined}
      />

      <ResetPasswordModal
        isOpen={showResetPasswordModal}
        onClose={() => {
          setShowResetPasswordModal(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
      />

      <DeleteUserModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedUser(null);
        }}
        onSuccess={() => {
          setShowDeleteModal(false);
          setSelectedUser(null);
          fetchUsers();
        }}
        user={selectedUser}
      />
    </div>
  );
}

// Side drawer sliding detail panel component
interface UserDrawerProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  openEditModal: (user: User) => void;
  openResetPasswordModal: (user: User) => void;
  handleToggleActive: (user: User) => Promise<void>;
  openDeleteModal: () => void;
  getRoleBadgeVariant: (role: string) => string;
}

function UserDrawer({
  user,
  isOpen,
  onClose,
  openEditModal,
  openResetPasswordModal,
  handleToggleActive,
  openDeleteModal,
  getRoleBadgeVariant,
}: UserDrawerProps) {
  const [activeUser, setActiveUser] = useState<User | null>(null);

  useEffect(() => {
    if (user) {
      setActiveUser(user);
    }
  }, [user]);

  if (!activeUser) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-[1200] flex justify-end transition-all duration-300',
        isOpen ? 'pointer-events-auto' : 'pointer-events-none'
      )}
    >
      {/* Backdrop with fade effect */}
      <div
        className={cn(
          'fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0'
        )}
        onClick={onClose}
      />
      {/* Panel with slide-in transition */}
      <div
        className={cn(
          'relative w-full max-w-lg bg-white dark:bg-[#1C1917] border-l border-stone-250 dark:border-stone-800 shadow-2xl p-8 sm:p-10 flex flex-col h-full transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Drawer Header */}
        <div className="flex items-start justify-between border-b border-stone-100 dark:border-white/5 pb-6 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-[20px] bg-gradient-to-tr from-emerald-500 to-emerald-600 text-white flex items-center justify-center font-serif text-3xl font-black shadow-lg shadow-emerald-500/20">
              {activeUser.full_name?.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-black text-stone-900 dark:text-white tracking-tight">
                {activeUser.full_name}
              </h2>
              <p className="text-sm text-stone-400 font-medium">{activeUser.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-950 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-white/10 rounded-full transition-all duration-200"
            aria-label="Đóng"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable details container */}
        <div className="flex-1 overflow-y-auto py-8 space-y-8 pr-2 custom-scrollbar">
          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-stone-50 dark:bg-white/[0.02] p-4 rounded-2xl border border-stone-100 dark:border-white/5">
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-1">
                Vai trò
              </span>
              <Badge
                variant={getRoleBadgeVariant(activeUser.role) as any}
                className="font-bold text-xs"
              >
                {getRoleLabel(activeUser.role)}
              </Badge>
            </div>
            <div className="bg-stone-50 dark:bg-white/[0.02] p-4 rounded-2xl border border-stone-100 dark:border-white/5">
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-1">
                Trạng thái
              </span>
              <Badge
                variant={activeUser.is_active ? 'success' : 'danger'}
                className="font-bold text-xs"
              >
                {activeUser.is_active ? 'Hoạt động' : 'Đã khóa'}
              </Badge>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest border-b border-stone-100 dark:border-white/5 pb-2">
              Thông tin liên hệ
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-500 font-medium">Số điện thoại:</span>
                <span className="text-sm text-stone-900 dark:text-white font-bold">
                  {activeUser.phone || '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-500 font-medium">Email cá nhân:</span>
                <span className="text-sm text-stone-900 dark:text-white font-bold">
                  {activeUser.personal_email || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Identity & Department */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest border-b border-stone-100 dark:border-white/5 pb-2">
              Định danh & Tổ chức
            </h3>
            <div className="space-y-3">
              {(activeUser.student_code || activeUser.teacher_code) && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stone-500 font-medium">Mã số định danh (UID):</span>
                  <code className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-mono font-bold text-sm">
                    {activeUser.student_code || activeUser.teacher_code}
                  </code>
                </div>
              )}
              {activeUser.role === 'student' && activeUser.student_id && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stone-500 font-medium">Mã học sinh (CID):</span>
                  <code className="bg-amber-500/10 text-amber-600 dark:text-amber-500 px-2 py-0.5 rounded font-mono font-bold text-sm">
                    {activeUser.student_id}
                  </code>
                </div>
              )}
              {activeUser.department && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stone-500 font-medium">
                    Phòng ban / Lớp quản lý:
                  </span>
                  <span className="text-sm text-stone-900 dark:text-white font-bold">
                    {activeUser.department}
                  </span>
                </div>
              )}
              {activeUser.grade_level && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stone-500 font-medium">Khối / Cấp lớp:</span>
                  <span className="text-sm text-stone-900 dark:text-white font-bold">
                    {activeUser.grade_level}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* History & Notes */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest border-b border-stone-100 dark:border-white/5 pb-2">
              Hệ thống & Ghi chú
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-500 font-medium">Ngày gia nhập:</span>
                <span className="text-sm text-stone-900 dark:text-white font-bold text-right">
                  {new Date(activeUser.created_at).toLocaleDateString('vi-VN')}{' '}
                  {new Date(activeUser.created_at).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-500 font-medium">Đăng nhập lần cuối:</span>
                <span className="text-sm text-stone-900 dark:text-white font-bold text-right">
                  {activeUser.last_login_at
                    ? `${new Date(activeUser.last_login_at).toLocaleDateString('vi-VN')} ${new Date(activeUser.last_login_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
                    : 'Chưa đăng nhập'}
                </span>
              </div>
              {activeUser.notes && (
                <div className="space-y-1">
                  <span className="text-sm text-stone-500 font-medium block">
                    Ghi chú hành chính:
                  </span>
                  <div className="bg-stone-50 dark:bg-white/[0.01] p-4 rounded-2xl border border-stone-100 dark:border-white/5 text-sm font-medium text-stone-600 dark:text-stone-400 whitespace-pre-wrap leading-relaxed">
                    {activeUser.notes}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t border-stone-100 dark:border-white/5 pt-6 flex flex-col gap-3 shrink-0">
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => {
                onClose();
                openEditModal(activeUser);
              }}
              className="rounded-xl h-12 text-xs font-black uppercase tracking-widest"
              leftIcon={<Icons.Edit className="w-4 h-4" />}
            >
              Sửa hồ sơ
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                onClose();
                openResetPasswordModal(activeUser);
              }}
              className="rounded-xl h-12 text-xs font-black uppercase tracking-widest border-stone-200 dark:border-stone-800"
              leftIcon={<Icons.Lock className="w-4 h-4" />}
            >
              Đổi mật khẩu
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={async () => {
                await handleToggleActive(activeUser);
                setActiveUser((prev) => (prev ? { ...prev, is_active: !prev.is_active } : null));
              }}
              className="rounded-xl h-12 text-xs font-black uppercase tracking-widest border-stone-200 dark:border-stone-800"
              leftIcon={
                activeUser.is_active ? (
                  <Icons.Error className="w-4 h-4" />
                ) : (
                  <Icons.Success className="w-4 h-4" />
                )
              }
            >
              {activeUser.is_active ? 'Khóa tài khoản' : 'Mở khóa'}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                onClose();
                openDeleteModal();
              }}
              className="rounded-xl h-12 text-xs font-black uppercase tracking-widest shadow-md"
              leftIcon={<Icons.Trash className="w-4 h-4" />}
            >
              Xóa vĩnh viễn
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
