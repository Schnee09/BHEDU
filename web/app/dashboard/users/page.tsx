'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiFetch } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import PageGuard from '@/components/PageGuard';
import { useToast } from '@/hooks/useToast';
import type { UserRole } from '@/lib/auth/core';

// Modular User Subcomponents
import { UserStatsHero, type UserStatsData } from '@/components/users/UserStatsHero';
import { UserRoleTabs } from '@/components/users/UserRoleTabs';
import { UserCommandBar } from '@/components/users/UserCommandBar';
import { UserTable, type UserItem } from '@/components/users/UserTable';
import { UserBulkActionBar } from '@/components/users/UserBulkActionBar';
import { UserDetailDrawer } from '@/components/users/UserDetailDrawer';
import { UserImportModal } from '@/components/users/UserImportModal';
import UserFormModal from '@/components/users/UserFormModal';
import ResetPasswordModal from '@/components/users/ResetPasswordModal';
import DeleteUserModal from '@/components/users/DeleteUserModal';

export default function UserManagementPage() {
  return (
    <PageGuard permissions="users.view">
      <UserManagementContent />
    </PageGuard>
  );
}

function UserManagementContent() {
  const toast = useToast();

  // Data states
  const [users, setUsers] = useState<UserItem[]>([]);
  const [stats, setStats] = useState<UserStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Filter & Pagination states
  const [roleTab, setRoleTab] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal & Drawer states
  const [drawerUser, setDrawerUser] = useState<UserItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [targetUser, setTargetUser] = useState<UserItem | null>(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // 1. Fetch Users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
      });

      if (roleTab !== 'all') params.append('role', roleTab);
      if (activeFilter === 'active') params.append('status', 'active');
      if (activeFilter === 'inactive') params.append('status', 'inactive');
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await apiFetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) throw new Error('Không thể tải danh sách người dùng');

      const data = await res.json();
      const userList = data.data?.data || data.data || [];
      const pagination = data.data?.pagination || data.pagination || {};

      setUsers(userList);
      setTotalPages(pagination.totalPages || Math.ceil((pagination.total || userList.length) / pageSize) || 1);
      setTotalCount(pagination.total || userList.length);

      // If stats returned inside API response
      if (data.statistics || data.data?.statistics) {
        setStats(data.statistics || data.data.statistics);
        setStatsLoading(false);
      }
    } catch (err: any) {
      logger.error('Error fetching users:', err);
      toast.error('Lỗi', err.message || 'Không thể tải danh sách người dùng.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, roleTab, activeFilter, searchQuery]);

  // 2. Fetch Stats separately if needed
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await apiFetch('/api/admin/users/stats');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setStats(data.data);
        }
      }
    } catch {
      // quiet fallback
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Initial & Dependency Triggers
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Clear selections when role or filter changes
  useEffect(() => {
    setSelectedIds(new Set());
    setPage(1);
  }, [roleTab, activeFilter, searchQuery]);

  // 3. Selection Handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === users.length && users.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(users.map((u) => u.id)));
    }
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // 4. Single User Actions
  const handleToggleActive = async (user: UserItem) => {
    const nextStatus = !user.is_active;
    try {
      const res = await apiFetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: nextStatus }),
      });

      if (!res.ok) throw new Error('Không thể thay đổi trạng thái');

      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: nextStatus } : u))
      );
      if (drawerUser?.id === user.id) {
        setDrawerUser((prev) => (prev ? { ...prev, is_active: nextStatus } : null));
      }

      toast.success(
        'Đã cập nhật',
        `Tài khoản "${user.full_name}" đã ${nextStatus ? 'kích hoạt' : 'vô hiệu hóa'}.`
      );
    } catch (err: any) {
      toast.error('Lỗi', err.message);
    }
  };

  const handleOpenEdit = (user: UserItem) => {
    setTargetUser(user);
    setShowEditModal(true);
  };

  const handleOpenResetPassword = (user: UserItem) => {
    setTargetUser(user);
    setShowResetPasswordModal(true);
  };

  const handleOpenDelete = (user: UserItem) => {
    setTargetUser(user);
    setShowDeleteModal(true);
  };

  // 5. Bulk Actions
  const handleBulkStatusChange = async (active: boolean) => {
    if (selectedIds.size === 0) return;
    setBulkProcessing(true);
    let success = 0;
    try {
      for (const id of Array.from(selectedIds)) {
        try {
          const res = await apiFetch(`/api/admin/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ is_active: active }),
          });
          if (res.ok) success++;
        } catch {
          // ignore individual error
        }
      }

      toast.success(
        'Thành công',
        `Đã ${active ? 'kích hoạt' : 'khóa'} ${success} tài khoản được chọn.`
      );
      setSelectedIds(new Set());
      fetchUsers();
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleExportCSV = () => {
    const exportData = selectedIds.size > 0
      ? users.filter((u) => selectedIds.has(u.id))
      : users;

    if (exportData.length === 0) {
      toast.info('Không có dữ liệu', 'Không có người dùng nào để xuất.');
      return;
    }

    const headers = ['ID', 'Ho_va_ten', 'Email', 'Vai_tro', 'So_dien_thoai', 'Trang_thai', 'Ma_dinh_danh'];
    const csvRows = exportData.map((u) => [
      u.id,
      `"${u.full_name || ''}"`,
      u.email,
      u.role,
      u.phone || '',
      u.is_active ? 'Hoat_dong' : 'Da_khoa',
      u.student_code || u.teacher_code || '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...csvRows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BH_EDU_Users_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success('Xuất file thành công', `Đã xuất ${exportData.length} người dùng.`);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.size} người dùng đã chọn?`)) return;

    setBulkProcessing(true);
    let success = 0;
    try {
      for (const id of Array.from(selectedIds)) {
        try {
          const res = await apiFetch(`/api/admin/users/${id}?permanent=true`, {
            method: 'DELETE',
          });
          if (res.ok) success++;
        } catch {
          // ignore
        }
      }

      toast.success('Đã xóa', `Đã xóa vĩnh viễn ${success} người dùng.`);
      setSelectedIds(new Set());
      fetchUsers();
    } finally {
      setBulkProcessing(false);
    }
  };

  return (
    <div className="space-y-5 pb-16 min-h-screen">
      {/* 1. High-Tech KPI Overview */}
      <UserStatsHero stats={stats} loading={statsLoading} />

      {/* 2. Segmented Role Tabs */}
      <UserRoleTabs
        activeTab={roleTab}
        onTabChange={(tab) => setRoleTab(tab)}
        stats={stats}
      />

      {/* 3. Command Bar (Search & Quick Actions) */}
      <UserCommandBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilter={activeFilter}
        onActiveFilterChange={setActiveFilter}
        onOpenCreateModal={() => setShowCreateModal(true)}
        onOpenImportModal={() => setShowImportModal(true)}
        onExport={handleExportCSV}
        onRefresh={fetchUsers}
        loading={loading}
      />

      {/* 4. High-Density Data Table */}
      <UserTable
        users={users}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onToggleSelectAll={handleToggleSelectAll}
        onUserClick={(user) => setDrawerUser(user)}
        onEdit={handleOpenEdit}
        onResetPassword={handleOpenResetPassword}
        onDelete={handleOpenDelete}
        onToggleActive={handleToggleActive}
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={pageSize}
        onPageChange={setPage}
        loading={loading}
      />

      {/* 5. Sticky Floating Bulk Action Bar */}
      <UserBulkActionBar
        selectedCount={selectedIds.size}
        onClearSelection={handleClearSelection}
        onBulkActivate={() => handleBulkStatusChange(true)}
        onBulkDeactivate={() => handleBulkStatusChange(false)}
        onBulkExport={handleExportCSV}
        onBulkDelete={handleBulkDelete}
        loading={bulkProcessing}
      />

      {/* 6. Slide-over User Detail Drawer */}
      <UserDetailDrawer
        isOpen={!!drawerUser}
        onClose={() => setDrawerUser(null)}
        user={drawerUser}
        onEdit={handleOpenEdit}
        onResetPassword={handleOpenResetPassword}
        onDelete={handleOpenDelete}
        onToggleActive={handleToggleActive}
      />

      {/* 7. Create & Edit User Modals */}
      {showCreateModal && (
        <UserFormModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchUsers();
            fetchStats();
          }}
        />
      )}

      {showEditModal && targetUser && (
        <UserFormModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setTargetUser(null);
          }}
          user={targetUser}
          onSuccess={() => {
            setShowEditModal(false);
            setTargetUser(null);
            fetchUsers();
            fetchStats();
          }}
        />
      )}

      {/* 8. Batch Import Modal */}
      <UserImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => {
          fetchUsers();
          fetchStats();
        }}
      />

      {/* 9. Reset Password Modal */}
      {showResetPasswordModal && targetUser && (
        <ResetPasswordModal
          isOpen={showResetPasswordModal}
          onClose={() => {
            setShowResetPasswordModal(false);
            setTargetUser(null);
          }}
          user={targetUser}
        />
      )}

      {/* 10. Delete User Modal */}
      {showDeleteModal && targetUser && (
        <DeleteUserModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setTargetUser(null);
          }}
          user={targetUser}
          onSuccess={() => {
            setShowDeleteModal(false);
            setTargetUser(null);
            if (drawerUser?.id === targetUser.id) {
              setDrawerUser(null);
            }
            fetchUsers();
            fetchStats();
          }}
        />
      )}
    </div>
  );
}
