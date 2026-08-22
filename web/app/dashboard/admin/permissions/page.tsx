'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { apiFetch } from '@/lib/api/client';
import { usePermissions, PermissionGuard } from '@/hooks/usePermissions';
import {
  Shield,
  Search,
  Check,
  X,
  User,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Filter,
  UserCog,
  Settings,
  History,
  Lock,
  Unlock,
  RefreshCw,
  Plus,
  Edit3,
  Trash2,
  Sparkles,
  Users,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import { CreateRoleModal } from '@/components/admin/permissions/CreateRoleModal';

// ──────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────

interface Permission {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
}

interface UserForPermissions {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

interface CustomPermission {
  id: string;
  permission_code: string;
  is_denied: boolean;
  expires_at: string | null;
  notes: string | null;
  granted_at: string;
}

interface UserPermissionData {
  user: UserForPermissions;
  rolePermissions: string[];
  customPermissions: CustomPermission[];
}

interface RoleOverride {
  id: string;
  role: string;
  permission_code: string;
  is_denied: boolean;
  notes: string | null;
  created_at: string;
}

interface RolePermissionData {
  role: string;
  overrides: RoleOverride[];
  basePermissions: string[];
}

export interface RoleInfo {
  code: string;
  name: string;
  description: string;
  color: string;
  is_system: boolean;
  user_count: number;
  permission_count: number;
}

interface AuditLog {
  id: string;
  action: string;
  permission_code: string;
  scope: 'user' | 'role';
  created_at: string;
  reason: string | null;
  user: { id: string; full_name: string; role: string } | null;
  performer: { id: string; full_name: string } | null;
}

interface PendingAction {
  type: 'grant' | 'revoke' | 'deny';
  permissionCode: string;
  permissionName: string;
}

interface PendingRoleChange {
  userId: string;
  userName: string;
  currentRole: string;
  newRole: string;
}

interface PendingRolePermAction {
  type: 'grant' | 'deny' | 'reset';
  role: string;
  permissionCode: string;
  permissionName: string;
}

// ──────────────────────────────────────────────
// CONSTANTS
// ──────────────────────────────────────────────

const DEFAULT_ROLE_OPTIONS = [
  { value: 'super_admin', label: 'Quản trị Hệ thống', color: 'bg-black text-white dark:bg-white/10' },
  {
    value: 'owner',
    label: 'Chủ trung tâm',
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  },
  {
    value: 'admin',
    label: 'Quản trị viên',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
  {
    value: 'teacher',
    label: 'Giáo viên',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  {
    value: 'tutor',
    label: 'Gia sư',
    color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  },
  {
    value: 'parent',
    label: 'Phụ huynh',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  {
    value: 'student',
    label: 'Học sinh',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  system: 'Hệ Thống',
  users: 'Người Dùng',
  students: 'Học Sinh',
  classes: 'Lớp Học',
  grades: 'Điểm Số',
  attendance: 'Điểm Danh',
  finance: 'Tài Chính',
  reports: 'Báo Cáo',
  roles: 'Vai Trò',
  permissions: 'Quyền Hạn',
  timetable: 'Thời Khóa Biểu',
  announcements: 'Thông Báo',
  curriculum: 'Chương Trình Học',
  enrollments: 'Đăng Ký Học',
  subjects: 'Môn Học',
  tutoring: 'Kèm Riêng',
  parent: 'Phụ Huynh',
};

type Tab = 'roles' | 'users' | 'audit';

// ──────────────────────────────────────────────
// SHARED COMPONENTS
// ──────────────────────────────────────────────

function UnauthorizedMessage() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="text-center">
        <Shield className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Không có quyền truy cập</h2>
        <p className="text-muted-foreground mt-2">
          Bạn cần quyền quản trị cao cấp để xem trang này
        </p>
      </div>
    </div>
  );
}

function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  confirmVariant = 'primary',
  loading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  confirmVariant?: 'primary' | 'danger' | 'warning';
  loading?: boolean;
}) {
  if (!isOpen) return null;

  const btnVariants = {
    primary: 'bg-primary text-white hover:bg-primary/90',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    warning: 'bg-amber-600 text-white hover:bg-amber-700',
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface rounded-xl border border-border p-6 shadow-xl max-w-md w-full mx-4 z-10">
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2',
              btnVariants[confirmVariant]
            )}
          >
            {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
            {confirmText || 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function ToggleSwitch({
  checked,
  onChange,
  disabled,
  size = 'md',
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}) {
  const sizes = {
    sm: { track: 'w-8 h-4', thumb: 'w-3 h-3', translate: 'translate-x-4' },
    md: { track: 'w-11 h-6', thumb: 'w-5 h-5', translate: 'translate-x-5' },
  };
  const s = sizes[size];
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className={cn(
        'relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
        s.track,
        checked ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-600'
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out',
          s.thumb,
          checked ? s.translate : 'translate-x-0'
        )}
      />
    </button>
  );
}

// ──────────────────────────────────────────────
// MAIN PAGE
// ──────────────────────────────────────────────

export default function PermissionsPage() {
  return (
    <PermissionGuard permissions="permissions.manage" fallback={<UnauthorizedMessage />}>
      <PermissionsContent />
    </PermissionGuard>
  );
}

function PermissionsContent() {
  const { role: currentUserRole } = usePermissions();
  const canManageRoles = currentUserRole === 'super_admin' || currentUserRole === 'owner';
  const [activeTab, setActiveTab] = useState<Tab>(canManageRoles ? 'roles' : 'users');

  useEffect(() => {
    if (!canManageRoles && activeTab === 'roles') {
      setActiveTab('users');
    }
  }, [canManageRoles, activeTab]);

  const tabs = [
    { id: 'roles' as Tab, label: 'Cấu hình Vai trò & Quyền', icon: Settings, superAdminOnly: true },
    { id: 'users' as Tab, label: 'Cấu hình Người dùng', icon: UserCog, superAdminOnly: false },
    { id: 'audit' as Tab, label: 'Nhật ký thay đổi', icon: History, superAdminOnly: false },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Shield className="w-8 h-8" />
            Quản lý Quyền & Vai Trò
          </h1>
          <p className="mt-2 text-muted-foreground">
            Cấu hình quyền theo vai trò (hệ thống & tùy biến) và từng người dùng (RBAC 3 lớp)
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted/50 rounded-xl mb-6 w-fit">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isDisabled = tab.superAdminOnly && !canManageRoles;
            return (
              <button
                key={tab.id}
                onClick={() => !isDisabled && setActiveTab(tab.id)}
                disabled={isDisabled}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  activeTab === tab.id
                    ? 'bg-white dark:bg-gray-800 shadow text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                  isDisabled && 'opacity-40 cursor-not-allowed'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.superAdminOnly && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-black text-white dark:bg-white/10">
                    SA/Owner
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'roles' && canManageRoles && <RolePermissionsTab />}
        {activeTab === 'users' && <UserPermissionsTab />}
        {activeTab === 'audit' && <AuditLogTab />}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// TAB 1: ROLE PERMISSIONS & CUSTOM ROLES (Super Admin only)
// ──────────────────────────────────────────────

function RolePermissionsTab() {
  const [roles, setRoles] = useState<RoleInfo[]>([]);
  const [selectedRoleCode, setSelectedRoleCode] = useState('owner');
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [roleData, setRoleData] = useState<RolePermissionData | null>(null);
  const [loadingPerms, setLoadingPerms] = useState(true);
  const [loadingRole, setLoadingRole] = useState(false);
  const [loadingRolesList, setLoadingRolesList] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permSearch, setPermSearch] = useState('');
  const [pending, setPending] = useState<PendingRolePermAction | null>(null);

  // Custom Role Modal state
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleInfo | null>(null);
  const [deletingRole, setDeletingRole] = useState<RoleInfo | null>(null);
  const [deleting, setDeleting] = useState(false);

  const toast = useToast();

  const fetchRolesList = async () => {
    setLoadingRolesList(true);
    try {
      const res = await apiFetch('/api/admin/roles');
      if (res.ok) {
        const data = await res.json();
        setRoles(data.roles || []);
      }
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    } finally {
      setLoadingRolesList(false);
    }
  };

  useEffect(() => {
    fetchRolesList();
    apiFetch('/api/admin/permissions')
      .then((r) => r.json())
      .then((d) => setAllPermissions(d.definitions || []))
      .catch(console.error)
      .finally(() => setLoadingPerms(false));
  }, []);

  const loadRoleData = useCallback(async (role: string) => {
    setLoadingRole(true);
    try {
      const res = await apiFetch(`/api/admin/permissions/roles/${role}`);
      if (res.ok) {
        setRoleData(await res.json());
      } else {
        toast.error('Lỗi', 'Không thể tải cấu hình vai trò');
      }
    } catch {
      toast.error('Lỗi', 'Đã xảy ra lỗi');
    } finally {
      setLoadingRole(false);
    }
  }, []);

  useEffect(() => {
    loadRoleData(selectedRoleCode);
  }, [selectedRoleCode, loadRoleData]);

  const handleConfirmAction = async () => {
    if (!pending) return;
    setSaving(true);
    try {
      let res: Response;
      if (pending.type === 'reset') {
        res = await apiFetch(
          `/api/admin/permissions/roles/${pending.role}?permission_code=${pending.permissionCode}`,
          { method: 'DELETE' }
        );
      } else {
        res = await apiFetch(`/api/admin/permissions/roles/${pending.role}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            permission_code: pending.permissionCode,
            is_denied: pending.type === 'deny',
          }),
        });
      }

      if (res.ok) {
        await loadRoleData(pending.role);
        fetchRolesList();
        const actionLabel =
          pending.type === 'grant' ? 'cấp' : pending.type === 'deny' ? 'từ chối' : 'đặt lại';
        toast.success(
          'Thành công',
          `Đã ${actionLabel} quyền "${pending.permissionName}" cho vai trò`
        );
      } else {
        const d = await res.json();
        toast.error('Lỗi', d.error || 'Thao tác thất bại');
      }
    } catch {
      toast.error('Lỗi', 'Đã xảy ra lỗi');
    } finally {
      setSaving(false);
      setPending(null);
    }
  };

  const handleDeleteRole = async () => {
    if (!deletingRole) return;
    setDeleting(true);
    try {
      const res = await apiFetch(`/api/admin/roles/${deletingRole.code}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (res.ok) {
        toast.success('Thành công', `Đã xóa vai trò "${deletingRole.name}"`);
        setDeletingRole(null);
        setSelectedRoleCode('owner');
        fetchRolesList();
      } else {
        toast.error('Không thể xóa', data.error || 'Thao tác thất bại');
      }
    } catch {
      toast.error('Lỗi', 'Đã xảy ra lỗi khi xóa vai trò');
    } finally {
      setDeleting(false);
    }
  };

  const currentRoleInfo = roles.find((r) => r.code === selectedRoleCode);

  const permsByCategory = allPermissions
    .filter(
      (p) =>
        permSearch === '' ||
        p.name.toLowerCase().includes(permSearch.toLowerCase()) ||
        p.code.toLowerCase().includes(permSearch.toLowerCase())
    )
    .reduce<Record<string, Permission[]>>((acc, p) => {
      const cat = p.category || 'other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(p);
      return acc;
    }, {});

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Role Selector & Custom Role List */}
      <div className="lg:col-span-4 bg-white dark:bg-[#14120E] rounded-3xl border border-stone-200 dark:border-stone-800 p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between gap-2 pb-1">
          <h3 className="font-bold text-xs uppercase tracking-wider text-stone-500 dark:text-stone-400 shrink-0">
            Danh sách Vai trò ({roles.length})
          </h3>
          <button
            onClick={() => {
              setEditingRole(null);
              setShowRoleModal(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-stone-950 text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Thêm vai trò
          </button>
        </div>

        {/* Roles list */}
        <div className="space-y-2 max-h-[580px] overflow-y-auto custom-scrollbar pr-1">
          {roles.map((r) => {
            const isSelected = selectedRoleCode === r.code;

            return (
              <button
                key={r.code}
                onClick={() => setSelectedRoleCode(r.code)}
                className={cn(
                  'w-full text-left p-3.5 rounded-2xl transition-all border flex flex-col gap-1.5 cursor-pointer',
                  isSelected
                    ? 'bg-amber-50/80 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30 text-stone-950 dark:text-white font-bold shadow-xs'
                    : 'border-stone-200/60 dark:border-stone-800/60 hover:bg-stone-50 dark:hover:bg-[#1C1A16] text-stone-600 dark:text-stone-400'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black truncate">{r.name}</span>
                  <span
                    className={cn(
                      'text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0',
                      r.color
                    )}
                  >
                    {r.is_system ? 'Hệ thống' : 'Tùy biến'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-stone-400 dark:text-stone-500">
                  <span className="font-mono">{r.code}</span>
                  <span>•</span>
                  <span>{r.user_count} tài khoản</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-3.5 bg-amber-50/80 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-900/40">
          <p className="text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2 leading-relaxed">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
            Thay đổi quyền hạn vai trò sẽ tự động cập nhật ngay lập tức cho toàn bộ tài khoản thuộc vai trò đó.
          </p>
        </div>
      </div>

      {/* Permission Editor */}
      <div className="lg:col-span-8 bg-white dark:bg-[#14120E] rounded-3xl border border-stone-200 dark:border-stone-800 p-6 space-y-6 shadow-sm">
        {/* Role Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-200 dark:border-stone-800">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-foreground">
                {currentRoleInfo?.name || selectedRoleCode}
              </h2>
              <span
                className={cn(
                  'text-xs font-bold px-2.5 py-0.5 rounded-full uppercase',
                  currentRoleInfo?.color
                )}
              >
                {currentRoleInfo?.code}
              </span>
              {!currentRoleInfo?.is_system && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-black uppercase">
                  Vai trò Tùy biến
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentRoleInfo?.description || 'Cấu hình quyền hạn phân cấp cho vai trò này.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!currentRoleInfo?.is_system && (
              <>
                <button
                  onClick={() => {
                    setEditingRole(currentRoleInfo || null);
                    setShowRoleModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-muted hover:bg-stone-200 dark:hover:bg-stone-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-500" /> Sửa vai trò
                </button>
                <button
                  onClick={() => setDeletingRole(currentRoleInfo || null)}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Xóa
                </button>
              </>
            )}

            <button
              onClick={() => loadRoleData(selectedRoleCode)}
              disabled={loadingRole}
              className="p-2 rounded-xl hover:bg-muted transition-colors border border-border cursor-pointer"
              title="Tải lại"
            >
              <RefreshCw className={cn('w-4 h-4', loadingRole && 'animate-spin')} />
            </button>
          </div>
        </div>

        {/* Super admin God mode banner */}
        {selectedRoleCode === 'super_admin' && (
          <div className="p-4 rounded-2xl bg-stone-900 dark:bg-stone-950 border border-stone-800 text-stone-200 flex items-center gap-3">
            <Shield className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-white">Toàn quyền Hệ thống (God Mode):</span>{' '}
              Quản trị Hệ thống sở hữu tất cả các quyền hạn và không thể bị từ chối quyền.
            </div>
          </div>
        )}

        {/* Search & Legend */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm kiếm quyền theo tên hoặc mã..."
              value={permSearch}
              onChange={(e) => setPermSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> Mặc định
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" /> Cấp thêm
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" /> Từ chối
            </span>
          </div>
        </div>

        {/* Permissions List */}
        {loadingPerms || loadingRole ? (
          <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
            <span className="text-xs">Đang tải ma trận quyền hạn...</span>
          </div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
            {Object.entries(permsByCategory).map(([cat, perms]) => (
              <RolePermCategory
                key={cat}
                category={cat}
                permissions={perms}
                roleData={roleData}
                onAction={(type, code, name) =>
                  setPending({
                    type,
                    role: selectedRoleCode,
                    permissionCode: code,
                    permissionName: name,
                  })
                }
                saving={saving}
              />
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal for Permissions Action */}
      <ConfirmModal
        isOpen={pending !== null}
        onClose={() => setPending(null)}
        onConfirm={handleConfirmAction}
        loading={saving}
        title={
          pending?.type === 'grant'
            ? 'Cấp thêm quyền cho vai trò'
            : pending?.type === 'deny'
              ? 'Từ chối quyền cho vai trò'
              : 'Đặt lại về mặc định'
        }
        message={
          pending?.type === 'grant'
            ? `Cấp thêm quyền "${pending?.permissionName}" cho tất cả người dùng có vai trò "${currentRoleInfo?.name}"?`
            : pending?.type === 'deny'
              ? `Từ chối quyền "${pending?.permissionName}" cho tất cả người dùng có vai trò "${currentRoleInfo?.name}"?`
              : `Đặt lại quyền "${pending?.permissionName}" về mặc định?`
        }
        confirmText={
          pending?.type === 'grant' ? 'Cấp quyền' : pending?.type === 'deny' ? 'Từ chối' : 'Đặt lại'
        }
        confirmVariant={
          pending?.type === 'deny' ? 'danger' : pending?.type === 'reset' ? 'warning' : 'primary'
        }
      />

      {/* Confirmation Modal for Role Deletion */}
      <ConfirmModal
        isOpen={deletingRole !== null}
        onClose={() => setDeletingRole(null)}
        onConfirm={handleDeleteRole}
        loading={deleting}
        title={`Xác nhận xóa vai trò "${deletingRole?.name}"`}
        message={`Bạn có chắc chắn muốn xóa vai trò "${deletingRole?.name}" (${deletingRole?.code})? Toàn bộ cấu hình quyền của vai trò này sẽ bị xóa bỏ.`}
        confirmText="Xóa vai trò"
        confirmVariant="danger"
      />

      {/* Create / Edit Custom Role Modal */}
      <CreateRoleModal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        onSuccess={() => {
          fetchRolesList();
          loadRoleData(selectedRoleCode);
        }}
        editingRole={editingRole}
        allPermissions={allPermissions}
      />
    </div>
  );
}

function RolePermCategory({
  category,
  permissions,
  roleData,
  onAction,
  saving,
}: {
  category: string;
  permissions: Permission[];
  roleData: RolePermissionData | null;
  onAction: (type: 'grant' | 'deny' | 'reset', code: string, name: string) => void;
  saving: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const isSuperAdminRole =
    roleData?.role === 'super_admin' || (roleData?.basePermissions || []).includes('*');

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-background">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3.5 hover:bg-muted/50 transition-colors bg-muted/20 cursor-pointer"
      >
        <span className="font-bold text-xs uppercase tracking-wider text-foreground">
          {CATEGORY_LABELS[category] || category}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">{permissions.length} quyền</span>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {expanded && (
        <div className="divide-y divide-border">
          {permissions.map((perm) => {
            const isBase =
              isSuperAdminRole || (roleData?.basePermissions || []).includes(perm.code);
            const override = (roleData?.overrides || []).find(
              (o) => o.permission_code === perm.code
            );
            const isGrantedExtra = override && !override.is_denied;
            const isDenied = !isSuperAdminRole && override && override.is_denied;
            const isEffectivelyGranted = isSuperAdminRole || (isBase && !isDenied) || isGrantedExtra;

            return (
              <div
                key={perm.code}
                className="flex items-center justify-between py-2.5 px-4 hover:bg-muted/20 text-xs"
              >
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-foreground">{perm.name}</p>
                    <span className="font-mono text-[10px] text-muted-foreground opacity-70">
                      {perm.code}
                    </span>
                    {isBase && !isDenied && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold">
                        {isSuperAdminRole ? 'Toàn quyền' : 'Mặc định'}
                      </span>
                    )}
                    {isGrantedExtra && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold">
                        Cấp thêm (DB)
                      </span>
                    )}
                    {isDenied && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-bold">
                        Từ chối (DB)
                      </span>
                    )}
                  </div>
                  {perm.description && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">{perm.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div
                    className={cn(
                      'w-5 h-5 rounded-full flex items-center justify-center',
                      isDenied
                        ? 'bg-red-100 dark:bg-red-900/30'
                        : isEffectivelyGranted
                          ? 'bg-green-100 dark:bg-green-900/30'
                          : 'bg-gray-100 dark:bg-gray-800'
                    )}
                  >
                    {isDenied ? (
                      <X className="w-3 h-3 text-red-600 dark:text-red-400" />
                    ) : isEffectivelyGranted ? (
                      <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                    ) : (
                      <X className="w-3 h-3 text-gray-400" />
                    )}
                  </div>

                  {/* Action buttons (Disabled for super_admin) */}
                  {!isSuperAdminRole && (
                    <>
                      {!isBase && !isGrantedExtra && !isDenied && (
                        <button
                          onClick={() => onAction('grant', perm.code, perm.name)}
                          disabled={saving}
                          title="Cấp thêm quyền này"
                          className="p-1 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {!isDenied && (
                        <button
                          onClick={() => onAction('deny', perm.code, perm.name)}
                          disabled={saving}
                          title="Từ chối quyền này"
                          className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          <Lock className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {override && (
                        <button
                          onClick={() => onAction('reset', perm.code, perm.name)}
                          disabled={saving}
                          title="Đặt lại về mặc định"
                          className="p-1 rounded-lg hover:bg-muted text-muted-foreground transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// TAB 2: USER PERMISSIONS
// ──────────────────────────────────────────────

function UserPermissionsTab() {
  const [users, setUsers] = useState<UserForPermissions[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserForPermissions | null>(null);
  const [userPermData, setUserPermData] = useState<UserPermissionData | null>(null);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [availableRoles, setAvailableRoles] = useState<RoleInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [permissionSearch, setPermissionSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [pendingRoleChange, setPendingRoleChange] = useState<PendingRoleChange | null>(null);
  const [savingRole, setSavingRole] = useState(false);
  const toast = useToast();
  const { isAdmin: isCurrentAdmin } = usePermissions();

  useEffect(() => {
    apiFetch('/api/admin/roles')
      .then((r) => r.json())
      .then((d) => setAvailableRoles(d.roles || []))
      .catch(console.error);

    apiFetch('/api/admin/permissions')
      .then((r) => r.json())
      .then((d) => setAllPermissions(d.definitions || d.permissions || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadUsers = useCallback(
    async (pageToLoad: number, append = false) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      try {
        const params = new URLSearchParams({ page: pageToLoad.toString(), limit: '20' });
        if (debouncedSearch) params.append('search', debouncedSearch);
        const res = await apiFetch(`/api/admin/permissions/users?${params}`);
        if (res.ok) {
          const data = await res.json();
          const newUsers = data.users || [];
          setUsers((prev) => (append ? [...prev, ...newUsers] : newUsers));
          setHasMore(data.pagination ? pageToLoad < data.pagination.totalPages : false);
          if (!append && newUsers.length > 0 && !selectedUser) {
            setSelectedUser(newUsers[0]);
          }
        }
      } catch {
        toast.error('Lỗi', 'Không thể tải danh sách người dùng');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [debouncedSearch]
  );

  useEffect(() => {
    loadUsers(page, page > 1);
  }, [page, debouncedSearch, loadUsers]);

  const loadUserPerms = useCallback(async (userId: string) => {
    try {
      const res = await apiFetch(`/api/admin/permissions/users/${userId}`);
      if (res.ok) {
        setUserPermData(await res.json());
      }
    } catch {
      toast.error('Lỗi', 'Không thể tải quyền người dùng');
    }
  }, []);

  useEffect(() => {
    if (selectedUser) {
      loadUserPerms(selectedUser.id);
    }
  }, [selectedUser, loadUserPerms]);

  const handleTogglePermission = (
    permissionCode: string,
    permissionName: string,
    currentlyHas: boolean
  ) => {
    setPendingAction({
      type: currentlyHas ? 'revoke' : 'grant',
      permissionCode,
      permissionName,
    });
  };

  const handleConfirmAction = async () => {
    if (!selectedUser || !pendingAction) return;
    setSaving(true);
    try {
      let res: Response;
      if (pendingAction.type === 'revoke') {
        res = await apiFetch(
          `/api/admin/permissions/users/${selectedUser.id}?permission_code=${pendingAction.permissionCode}`,
          { method: 'DELETE' }
        );
      } else {
        res = await apiFetch(`/api/admin/permissions/users/${selectedUser.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            permission_code: pendingAction.permissionCode,
            is_denied: false,
          }),
        });
      }

      if (res.ok) {
        await loadUserPerms(selectedUser.id);
        toast.success(
          'Thành công',
          pendingAction.type === 'grant'
            ? `Đã cấp quyền "${pendingAction.permissionName}"`
            : `Đã thu hồi quyền "${pendingAction.permissionName}"`
        );
      } else {
        const d = await res.json();
        toast.error('Lỗi', d.error || 'Thao tác thất bại');
      }
    } catch {
      toast.error('Lỗi', 'Đã xảy ra lỗi');
    } finally {
      setSaving(false);
      setPendingAction(null);
    }
  };

  const handleRoleSelect = (newRole: string) => {
    if (!selectedUser || selectedUser.role === newRole) return;
    setPendingRoleChange({
      userId: selectedUser.id,
      userName: selectedUser.full_name || selectedUser.email,
      currentRole: selectedUser.role,
      newRole,
    });
  };

  const handleConfirmRoleChange = async () => {
    if (!pendingRoleChange) return;
    setSavingRole(true);
    try {
      const res = await apiFetch(`/api/admin/users/${pendingRoleChange.userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: pendingRoleChange.newRole }),
      });

      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === pendingRoleChange.userId ? { ...u, role: pendingRoleChange.newRole } : u
          )
        );
        if (selectedUser?.id === pendingRoleChange.userId) {
          setSelectedUser((prev) => (prev ? { ...prev, role: pendingRoleChange.newRole } : null));
        }
        toast.success('Thành công', `Đã đổi vai trò sang ${pendingRoleChange.newRole.toUpperCase()}`);
      } else {
        const d = await res.json();
        toast.error('Lỗi', d.error || 'Không thể đổi vai trò');
      }
    } catch {
      toast.error('Lỗi', 'Đã xảy ra lỗi');
    } finally {
      setSavingRole(false);
      setPendingRoleChange(null);
    }
  };

  const userPermsByCategory = allPermissions
    .filter(
      (p) =>
        permissionSearch === '' ||
        p.name.toLowerCase().includes(permissionSearch.toLowerCase()) ||
        p.code.toLowerCase().includes(permissionSearch.toLowerCase())
    )
    .reduce<Record<string, Permission[]>>((acc, p) => {
      const cat = p.category || 'other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(p);
      return acc;
    }, {});

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* User Search & List */}
      <div className="lg:col-span-1 bg-surface rounded-2xl border border-border p-4">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm người dùng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
        ) : (
          <div className="space-y-1 max-h-[600px] overflow-y-auto custom-scrollbar">
            {users.map((user) => {
              const roleOpt = availableRoles.find((r) => r.code === user.role);

              return (
                <button
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={cn(
                    'w-full text-left p-2.5 rounded-xl text-sm transition-colors',
                    selectedUser?.id === user.id ? 'bg-primary text-white' : 'hover:bg-muted'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-bold truncate">{user.full_name || 'Chưa đặt tên'}</p>
                    <span
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase',
                        selectedUser?.id === user.id
                          ? 'bg-white/20 text-white'
                          : roleOpt?.color || 'bg-gray-100 text-gray-700'
                      )}
                    >
                      {roleOpt?.name || user.role}
                    </span>
                  </div>
                  <p
                    className={cn(
                      'text-xs truncate mt-0.5',
                      selectedUser?.id === user.id ? 'text-white/80' : 'text-muted-foreground'
                    )}
                  >
                    {user.email}
                  </p>
                </button>
              );
            })}

            {hasMore && (
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={loadingMore}
                className="w-full py-2 text-xs text-primary hover:underline font-bold"
              >
                {loadingMore ? 'Đang tải thêm...' : 'Tải thêm'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* User Permission Matrix */}
      <div className="lg:col-span-3 bg-surface rounded-2xl border border-border p-6 space-y-6">
        {selectedUser ? (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
              <div>
                <h2 className="text-xl font-bold">{selectedUser.full_name || selectedUser.email}</h2>
                <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
              </div>

              {/* Role Dropdown */}
              {isCurrentAdmin && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground">Vai trò:</span>
                  <select
                    value={selectedUser.role}
                    onChange={(e) => handleRoleSelect(e.target.value)}
                    disabled={savingRole}
                    className="px-3 py-1.5 text-xs font-bold border border-border rounded-xl bg-background"
                  >
                    {availableRoles.map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.name} ({r.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Lọc quyền hạn..."
                value={permissionSearch}
                onChange={(e) => setPermissionSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1 custom-scrollbar">
              {Object.entries(userPermsByCategory).map(([cat, perms]) => (
                <UserPermCategory
                  key={cat}
                  category={cat}
                  permissions={perms}
                  rolePermissions={userPermData?.rolePermissions || []}
                  customPermissions={userPermData?.customPermissions || []}
                  userRole={selectedUser.role}
                  onToggle={handleTogglePermission}
                  saving={saving}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Chọn người dùng từ danh sách bên trái để cấu hình quyền</p>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={pendingAction !== null}
        onClose={() => setPendingAction(null)}
        onConfirm={handleConfirmAction}
        loading={saving}
        title={pendingAction?.type === 'grant' ? 'Xác nhận cấp quyền' : 'Xác nhận thu hồi quyền'}
        message={
          pendingAction?.type === 'grant'
            ? `Cấp quyền "${pendingAction?.permissionName}" cho người dùng này?`
            : `Thu hồi quyền "${pendingAction?.permissionName}" từ người dùng này?`
        }
        confirmText={pendingAction?.type === 'grant' ? 'Cấp quyền' : 'Thu hồi'}
        confirmVariant={pendingAction?.type === 'revoke' ? 'danger' : 'primary'}
      />

      <ConfirmModal
        isOpen={pendingRoleChange !== null}
        onClose={() => setPendingRoleChange(null)}
        onConfirm={handleConfirmRoleChange}
        loading={savingRole}
        title="Xác nhận thay đổi vai trò"
        message={
          pendingRoleChange
            ? `Thay đổi vai trò của "${pendingRoleChange.userName}" từ ${pendingRoleChange.currentRole.toUpperCase()} sang ${pendingRoleChange.newRole.toUpperCase()}?`
            : ''
        }
        confirmText="Thay đổi vai trò"
      />
    </div>
  );
}

function UserPermCategory({
  category,
  permissions,
  rolePermissions,
  customPermissions,
  userRole,
  onToggle,
  saving,
}: {
  category: string;
  permissions: Permission[];
  rolePermissions: string[];
  customPermissions: CustomPermission[];
  userRole: string;
  onToggle: (code: string, name: string, currentlyHas: boolean) => void;
  saving: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className="border border-border rounded-xl overflow-hidden bg-background">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3.5 hover:bg-muted/50 transition-colors bg-muted/20"
      >
        <span className="font-bold text-xs uppercase tracking-wider text-foreground">
          {CATEGORY_LABELS[category] || category}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">{permissions.length} quyền</span>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {expanded && (
        <div className="divide-y divide-border">
          {permissions.map((perm) => {
            const hasFromRole = rolePermissions.includes(perm.code);
            const customPerm = customPermissions.find((c) => c.permission_code === perm.code);
            const hasCustom = !!customPerm && !customPerm.is_denied;
            const isDenied = customPerm?.is_denied;
            const isGlobalAdmin = userRole === 'super_admin';
            const hasPermission = isGlobalAdmin || (hasFromRole && !isDenied) || hasCustom;
            const canToggle = !isGlobalAdmin && !hasFromRole;

            return (
              <div
                key={perm.code}
                className="flex items-center justify-between py-2.5 px-4 hover:bg-muted/20 text-xs"
              >
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-foreground">{perm.name}</p>
                    {isGlobalAdmin && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-black text-white dark:bg-white/10">
                        SA
                      </span>
                    )}
                    {hasFromRole && !isGlobalAdmin && !isDenied && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                        Vai trò
                      </span>
                    )}
                    {hasCustom && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                        Tùy chỉnh
                      </span>
                    )}
                    {isDenied && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                        Từ chối
                      </span>
                    )}
                  </div>
                  {perm.description && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">{perm.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {canToggle ? (
                    <ToggleSwitch
                      checked={hasCustom}
                      onChange={() => onToggle(perm.code, perm.name, hasCustom)}
                      disabled={saving}
                      size="sm"
                    />
                  ) : (
                    <div
                      className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center',
                        isDenied
                          ? 'bg-red-100 dark:bg-red-900/30'
                          : hasPermission
                            ? 'bg-green-100 dark:bg-green-900/30'
                            : 'bg-gray-100 dark:bg-gray-800'
                      )}
                    >
                      {isDenied ? (
                        <X className="w-3 h-3 text-red-600 dark:text-red-400" />
                      ) : hasPermission ? (
                        <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                      ) : (
                        <X className="w-3 h-3 text-gray-400" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// TAB 3: AUDIT LOG
// ──────────────────────────────────────────────

function AuditLogTab() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [scopeFilter, setScopeFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const toast = useToast();

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '30' });
      if (scopeFilter) params.append('scope', scopeFilter);
      if (actionFilter) params.append('action', actionFilter);
      const res = await apiFetch(`/api/admin/permissions/audit?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotal(data.total || 0);
      }
    } catch {
      toast.error('Lỗi', 'Không thể tải nhật ký');
    } finally {
      setLoading(false);
    }
  }, [page, scopeFilter, actionFilter]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const actionColors: Record<string, string> = {
    grant: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    revoke: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    deny: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  };

  return (
    <div className="bg-surface rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">Nhật ký thay đổi quyền</h2>
          <p className="text-xs text-muted-foreground">{total} bản ghi được lưu vết</p>
        </div>
        <button onClick={loadLogs} className="p-2 rounded-xl hover:bg-muted transition-colors border border-border">
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <select
          value={scopeFilter}
          onChange={(e) => {
            setScopeFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-1.5 border border-border rounded-xl bg-background text-xs font-bold"
        >
          <option value="">Tất cả phạm vi</option>
          <option value="user">Người dùng</option>
          <option value="role">Vai trò</option>
        </select>
        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-1.5 border border-border rounded-xl bg-background text-xs font-bold"
        >
          <option value="">Tất cả hành động</option>
          <option value="grant">Cấp quyền</option>
          <option value="revoke">Thu hồi</option>
          <option value="deny">Từ chối</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-xs">Đang tải...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <History className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-xs">Không có nhật ký</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-3 rounded-xl border border-border hover:bg-muted/20 transition-colors text-xs"
              >
                <div className="shrink-0 mt-0.5">
                  <span
                    className={cn(
                      'text-[10px] px-2 py-0.5 rounded-full font-bold uppercase',
                      actionColors[log.action] || 'bg-gray-100 text-gray-700'
                    )}
                  >
                    {log.action}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold">{log.permission_code}</p>
                    <span
                      className={cn(
                        'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                        log.scope === 'role'
                          ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      )}
                    >
                      {log.scope === 'role' ? 'Vai trò' : 'Người dùng'}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {log.user?.full_name || 'N/A'} • Bởi: {log.performer?.full_name || 'N/A'}
                  </p>
                  {log.reason && (
                    <p className="text-[11px] text-muted-foreground italic mt-0.5">"{log.reason}"</p>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground shrink-0 font-mono">
                  {new Date(log.created_at).toLocaleString('vi-VN')}
                </p>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="px-3 py-1.5 text-xs font-bold border border-border rounded-xl hover:bg-muted disabled:opacity-50 transition-colors"
            >
              Trước
            </button>
            <span className="text-xs text-muted-foreground font-mono">Trang {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={logs.length < 30 || loading}
              className="px-3 py-1.5 text-xs font-bold border border-border rounded-xl hover:bg-muted disabled:opacity-50 transition-colors"
            >
              Tiếp
            </button>
          </div>
        </>
      )}
    </div>
  );
}
