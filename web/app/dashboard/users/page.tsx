"use client"

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import {
  Button,
  Input,
  Modal,
  Card,
  Table,
  Badge,
  Alert
} from '@/components/ui';
import { DropdownMenu, DropdownItem } from '@/components/ui/dropdown-menu';
import { StatCard } from '@/components/ui/Card';
import { SkeletonTable, SkeletonStatCard } from '@/components/ui/skeleton';
import { Select } from '@/components/ui/form';
import { Icons } from '@/components/ui/Icons';
import PageGuard from '@/components/PageGuard';
import type { UserRole } from '@/lib/auth/core';
import MobileUserList from "@/components/users/MobileUserList";
import UserFormModal from "@/components/users/UserFormModal";
import ResetPasswordModal from "@/components/users/ResetPasswordModal";
import DeleteUserModal from "@/components/users/DeleteUserModal";
import { useToast } from '@/hooks/useToast';
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
  department?: string;
  student_id?: string;
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
  { value: 'staff', label: 'Nhân viên' },
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
  const toast = useToast();
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
        throw new Error(data.error || 'Không thềEtải danh sách người dùng');
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
        toast.success('Thành công', `Người dùng đã được ${user.is_active ? 'vô hiệu hóa' : 'kích hoạt'} thành công!`);
        fetchUsers();

        logger.audit('User status changed', {}, {
          userId: user.id,
          newStatus: !user.is_active
        });
      } else {
        throw new Error(data.error || 'Failed to toggle user status');
      }
    } catch (err: any) {
      toast.error('Lỗi', err.message || 'Không thềEthay đổi trạng thái');
    } finally {
      setLoading(false);
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
        return 'danger';
      case 'owner':
        return 'warning';
      case 'teacher':
      case 'tutor':
        return 'info';
      case 'student':
        return 'success';
      case 'parent':
        return 'indigo';
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
          icon={<Icons.Users className="w-6 h-6" />}
          color="blue"
          className="glass-card hover:translate-y-[-4px] transition-transform"
        />
        <StatCard
          label="Đang hoạt động"
          value={stats.active_users}
          icon={<Icons.Success className="w-6 h-6" />}
          color="green"
          className="glass-card hover:translate-y-[-4px] transition-transform"
        />
        <StatCard
          label="Giáo viên"
          value={stats.teacher_count}
          icon={<Icons.Teachers className="w-6 h-6" />}
          color="orange"
          className="glass-card hover:translate-y-[-4px] transition-transform"
        />
        <StatCard
          label="Học sinh"
          value={stats.student_count}
          icon={<Icons.Students className="w-6 h-6" />}
          color="purple"
          className="glass-card hover:translate-y-[-4px] transition-transform"
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
    <div className="bg-[#f8f9fa] dark:bg-stone-950 min-h-screen">
      <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8 animate-fade-in relative">
        {/* Background Blobs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 blur-[100px] rounded-full pointer-events-none -z-10" />

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-stone-900 dark:text-white tracking-tight flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 rounded-[24px]">
                <Icons.Users className="w-10 h-10 text-amber-600" />
              </div>
              Quản lý tài khoản
            </h1>
            <p className="text-stone-500 font-bold ml-1 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-bubble" />
              HềEthống quản trềEngười dùng thông minh V2 Pro Max
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="gold"
              onClick={() => setShowCreateModal(true)}
              className="h-14 px-8 rounded-[24px] shadow-xl shadow-amber-500/20"
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
          <div className="glass-premium p-6 rounded-[40px] border border-stone-200/50 dark:border-white/5 flex flex-col lg:flex-row gap-4 items-center shadow-xl shadow-stone-200/50 dark:shadow-none">
            <div className="flex-1 w-full relative">
              <Input
                type="text"
                placeholder="Tìm tên, email, sềEđiện thoại..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-14 rounded-2xl bg-white/50 border-stone-100 hover:border-amber-500/30 transition-all font-bold group"
                leftIcon={<Icons.Search className="w-5 h-5 text-stone-300 group-focus-within:text-amber-500 transition-colors" />}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              <div className="w-full sm:w-48">
                <Select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest"
                  options={[
                    {
                      value: 'all', label: 'TẤT CẢ VAI TRÒ'
                    },
                    ...roleOptions.map(o => ({ value: o.value, label: o.label.toUpperCase() }))
                  ]}
                />
              </div>

              <div className="w-full sm:w-48">
                <Select
                  value={activeFilter}
                  onChange={(e) => setActiveFilter(e.target.value)}
                  className="h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest"
                  options={[
                    { value: 'all', label: 'TRẠNG THÁI: TẤT CẢ' },
                    { value: 'true', label: 'HOẠT ĐỘNG' },
                    { value: 'false', label: 'VÔ HIỆU HÓA' },
                  ]}
                />
              </div>

              <Button
                variant="outline"
                className="h-14 w-14 p-0 rounded-2xl shrink-0 border-stone-200"
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
          <Card className="rounded-[40px] overflow-hidden border-stone-100 dark:border-white/5 shadow-2xl shadow-stone-200/30 dark:shadow-none glass-premium p-0">
            {users.length === 0 ? (
              <div className="py-24 text-center">
                <div className="w-20 h-20 bg-stone-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Icons.Users className="w-10 h-10 text-stone-300" />
                </div>
                <h3 className="text-xl font-black text-stone-900 dark:text-white mb-2">Không tìm thấy ai cả!</h3>
                <p className="text-stone-400 font-medium">Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
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
                  columns={[
                    {
                      key: 'full_name',
                      header: 'NGƯỜI DÙNG',
                      render: (user) => (
                        <div className="flex items-center gap-4 py-2">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-stone-100 to-stone-50 dark:from-white/5 dark:to-white/2 flex items-center justify-center font-black text-stone-400 border border-stone-100 dark:border-white/5 group-hover:scale-105 transition-transform">
                            {user.full_name?.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-black text-stone-900 dark:text-white tracking-tight">{user.full_name}</p>
                              {user.is_managed && (
                                <Badge variant="info" className="text-[8px] px-1.5 py-0 rounded-md font-black uppercase">Managed</Badge>
                              )}
                            </div>
                            <p className="text-xs text-stone-400 font-bold">{user.email}</p>
                          </div>
                        </div>
                      )
                    },
                    {
                      key: 'role',
                      header: 'VAI TRÒ',
                      render: (user) => (
                        <Badge variant={getRoleBadgeVariant(user.role) as any} className="px-4 py-1.5 rounded-full border-none shadow-sm font-black uppercase tracking-widest text-[10px]">
                          {getRoleLabel(user.role)}
                        </Badge>
                      )
                    },
                    {
                      key: 'status',
                      header: 'TRẠNG THÁI',
                      render: (user) => (
                        <Badge
                          variant={user.is_active ? "success" : "danger"}
                          className="px-4 py-1.5 rounded-full border-none shadow-sm font-black uppercase tracking-widest text-[10px]"
                        >
                          {user.is_active ? 'Đang hoạt động' : 'Đã khóa'}
                        </Badge>
                      )
                    },
                    {
                      key: 'created_at',
                      header: 'NGÀY THAM GIA',
                      render: (user) => (
                        <div className="flex flex-col">
                          <span className="text-stone-900 dark:text-white font-bold tracking-tight">
                            {new Date(user.created_at).toLocaleDateString('vi-VN')}
                          </span>
                          <span className="text-[10px] text-stone-400 font-black uppercase tracking-widest">
                            {new Date(user.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )
                    },
                    {
                      key: 'actions',
                      header: '',
                      render: (user) => (
                        <div className="flex justify-end pr-2">
                          <DropdownMenu
                            trigger={
                              <button className="w-10 h-10 rounded-2xl hover:bg-stone-100 dark:hover:bg-white/5 text-stone-400 flex items-center justify-center transition-all">
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
                              variant={user.is_active ? "danger" : "default"}
                              icon={user.is_active ? <Icons.Error className="w-4 h-4" /> : <Icons.Success className="w-4 h-4" />}
                              className="font-bold py-3"
                            >
                              {user.is_active ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                            </DropdownItem>
                            <div className="h-px bg-stone-100 dark:bg-white/5 my-1" />
                            <DropdownItem
                              onClick={() => {
                                setSelectedUser(user);
                                setShowDeleteModal(true);
                              }}
                              variant="danger"
                              icon={<Icons.Trash className="w-4 h-4" />}
                              className="font-bold py-3"
                            >
                              Xóa vĩnh viềE
                            </DropdownItem>
                          </DropdownMenu>
                        </div>
                      )
                    }
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
