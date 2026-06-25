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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';

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

const ROLE_OPTIONS = [
  { value: 'super_admin', label: 'Super Admin', color: 'bg-black text-white dark:bg-white/10' },
  {
    value: 'owner',
    label: 'Chủ trung tâm',
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  },
  {
    value: 'admin',
    label: 'Admin',
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

// Roles that super_admin can configure via DB overrides
const CONFIGURABLE_ROLES = ['owner', 'admin', 'teacher', 'tutor', 'parent', 'student'];

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
  confirmText: string;
  confirmVariant?: 'primary' | 'danger' | 'warning';
  loading?: boolean;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full mx-4 z-[1100]">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2',
              confirmVariant === 'danger'
                ? 'bg-red-500 text-white hover:bg-red-600'
                : confirmVariant === 'warning'
                  ? 'bg-amber-500 text-white hover:bg-amber-600'
                  : 'bg-primary text-white hover:bg-primary/90'
            )}
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {confirmText}
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
  const [activeTab, setActiveTab] = useState<Tab>('roles');
  const { role: currentUserRole } = usePermissions();
  const isSuperAdmin = currentUserRole === 'super_admin';

  const tabs = [
    { id: 'roles' as Tab, label: 'Cấu hình Vai trò', icon: Settings, superAdminOnly: true },
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
            Quản lý Quyền
          </h1>
          <p className="mt-2 text-muted-foreground">
            Cấu hình quyền theo vai trò và từng người dùng (RBAC 3 lớp)
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted/50 rounded-xl mb-6 w-fit">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isDisabled = tab.superAdminOnly && !isSuperAdmin;
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
                    SA
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'roles' && isSuperAdmin && <RolePermissionsTab />}
        {activeTab === 'users' && <UserPermissionsTab />}
        {activeTab === 'audit' && <AuditLogTab />}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// TAB 1: ROLE PERMISSIONS (Super Admin only)
// ──────────────────────────────────────────────

function RolePermissionsTab() {
  const [selectedRole, setSelectedRole] = useState('owner');
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [roleData, setRoleData] = useState<RolePermissionData | null>(null);
  const [loadingPerms, setLoadingPerms] = useState(true);
  const [loadingRole, setLoadingRole] = useState(false);
  const [saving, setSaving] = useState(false);
  const [permSearch, setPermSearch] = useState('');
  const [pending, setPending] = useState<PendingRolePermAction | null>(null);
  const toast = useToast();

  useEffect(() => {
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
    loadRoleData(selectedRole);
  }, [selectedRole, loadRoleData]);

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
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Role Selector */}
      <div className="lg:col-span-1 bg-surface rounded-xl border border-border p-4">
        <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">
          Vai trò
        </h3>
        <div className="space-y-1">
          {CONFIGURABLE_ROLES.map((role) => {
            const opt = ROLE_OPTIONS.find((o) => o.value === role);
            return (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  selectedRole === role ? 'bg-primary text-white' : 'hover:bg-muted text-foreground'
                )}
              >
                {opt?.label || role}
              </button>
            );
          })}
        </div>

        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
          <p className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            Chỉ Super Admin mới có thể thay đổi cấu hình vai trò. Thay đổi áp dụng cho tất cả người
            dùng có vai trò này.
          </p>
        </div>
      </div>

      {/* Permission Editor */}
      <div className="lg:col-span-3 bg-surface rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">
              {ROLE_OPTIONS.find((o) => o.value === selectedRole)?.label || selectedRole}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Cấu hình quyền mặc định cho vai trò này
            </p>
          </div>
          <button
            onClick={() => loadRoleData(selectedRole)}
            disabled={loadingRole}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <RefreshCw className={cn('w-4 h-4', loadingRole && 'animate-spin')} />
          </button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mb-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">Mặc định (code)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="text-muted-foreground">Đã cấp thêm (DB)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="text-muted-foreground">Đã từ chối (DB)</span>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm kiếm quyền..."
            value={permSearch}
            onChange={(e) => setPermSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-sm"
          />
        </div>

        {loadingRole ? (
          <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {Object.entries(permsByCategory).map(([cat, perms]) => (
              <RolePermCategory
                key={cat}
                category={cat}
                permissions={perms}
                roleData={roleData}
                onAction={(type, code, name) =>
                  setPending({
                    type,
                    role: selectedRole,
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
            ? `Cấp thêm quyền "${pending?.permissionName}" cho tất cả người dùng có vai trò này?`
            : pending?.type === 'deny'
              ? `Từ chối quyền "${pending?.permissionName}" cho tất cả người dùng có vai trò này? (Ghi đè cả quyền mặc định)`
              : `Đặt lại quyền "${pending?.permissionName}" về mặc định code (xóa cấu hình DB)?`
        }
        confirmText={
          pending?.type === 'grant' ? 'Cấp quyền' : pending?.type === 'deny' ? 'Từ chối' : 'Đặt lại'
        }
        confirmVariant={
          pending?.type === 'deny' ? 'danger' : pending?.type === 'reset' ? 'warning' : 'primary'
        }
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

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors bg-muted/20"
      >
        <span className="font-medium text-sm">{CATEGORY_LABELS[category] || category}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{permissions.length}</span>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {expanded && (
        <div className="divide-y divide-border">
          {permissions.map((perm) => {
            const isBase = roleData?.basePermissions.includes(perm.code);
            const override = roleData?.overrides.find((o) => o.permission_code === perm.code);
            const isGrantedExtra = override && !override.is_denied;
            const isDenied = override?.is_denied;
            const isEffectivelyGranted = (isBase || isGrantedExtra) && !isDenied;

            return (
              <div
                key={perm.code}
                className="flex items-center justify-between py-2.5 px-4 hover:bg-muted/20"
              >
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{perm.name}</p>
                    {isBase && !isDenied && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                        Mặc định
                      </span>
                    )}
                    {isGrantedExtra && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                        Cấp thêm
                      </span>
                    )}
                    {isDenied && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                        Từ chối
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{perm.code}</p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Status icon */}
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

                  {/* Action buttons */}
                  {!isBase && !isGrantedExtra && !isDenied && (
                    <button
                      onClick={() => onAction('grant', perm.code, perm.name)}
                      disabled={saving}
                      title="Cấp thêm quyền này"
                      className="p-1 rounded hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 transition-colors disabled:opacity-50"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {!isDenied && (
                    <button
                      onClick={() => onAction('deny', perm.code, perm.name)}
                      disabled={saving}
                      title="Từ chối quyền này"
                      className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 transition-colors disabled:opacity-50"
                    >
                      <Lock className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {override && (
                    <button
                      onClick={() => onAction('reset', perm.code, perm.name)}
                      disabled={saving}
                      title="Đặt lại về mặc định"
                      className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
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
    apiFetch('/api/admin/permissions')
      .then((r) => r.json())
      .then((d) => setAllPermissions(d.definitions || d.permissions || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    async function loadUsers() {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);
      try {
        const params = new URLSearchParams({ limit: '50', page: page.toString() });
        if (debouncedSearch) params.append('search', debouncedSearch);
        const res = await apiFetch(`/api/admin/users?${params}`);
        if (res.ok) {
          const data = await res.json();
          const newUsers = data.data || data.users || [];
          setUsers((prev) => (page === 1 ? newUsers : [...prev, ...newUsers]));
          setHasMore(newUsers.length === 50);
        }
      } catch {
        toast.error('Lỗi', 'Không thể tải danh sách người dùng');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    }
    loadUsers();
  }, [debouncedSearch, page]);

  useEffect(() => {
    if (!selectedUser) {
      setUserPermData(null);
      return;
    }
    apiFetch(`/api/admin/permissions/users/${selectedUser.id}`)
      .then((r) => r.json())
      .then(setUserPermData)
      .catch(() => toast.error('Lỗi', 'Không thể tải quyền người dùng'));
  }, [selectedUser]);

  const handleToggleClick = (code: string, name: string, currentlyHas: boolean) => {
    setPendingAction({
      type: currentlyHas ? 'revoke' : 'grant',
      permissionCode: code,
      permissionName: name,
    });
  };

  const handleConfirmAction = async () => {
    if (!selectedUser || !pendingAction) return;
    setSaving(true);
    try {
      let res: Response;
      if (pendingAction.type === 'grant') {
        res = await apiFetch(`/api/admin/permissions/users/${selectedUser.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ permission_code: pendingAction.permissionCode }),
        });
      } else {
        res = await apiFetch(
          `/api/admin/permissions/users/${selectedUser.id}?permission_code=${pendingAction.permissionCode}`,
          { method: 'DELETE' }
        );
      }
      if (res.ok) {
        const refreshRes = await apiFetch(`/api/admin/permissions/users/${selectedUser.id}`);
        if (refreshRes.ok) setUserPermData(await refreshRes.json());
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

  const handleRoleChange = (newRole: string) => {
    if (!userPermData || !selectedUser || newRole === userPermData.user.role) return;
    setPendingRoleChange({
      userId: selectedUser.id,
      userName: userPermData.user.full_name || userPermData.user.email,
      currentRole: userPermData.user.role,
      newRole,
    });
  };

  const handleConfirmRoleChange = async () => {
    if (!pendingRoleChange) return;
    setSavingRole(true);
    try {
      const res = await apiFetch(`/api/admin/users/${pendingRoleChange.userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: pendingRoleChange.newRole }),
      });
      if (res.ok) {
        const updatedUser = { ...selectedUser!, role: pendingRoleChange.newRole };
        setSelectedUser(updatedUser);
        setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
        const refreshRes = await apiFetch(
          `/api/admin/permissions/users/${pendingRoleChange.userId}`
        );
        if (refreshRes.ok) setUserPermData(await refreshRes.json());
        toast.success('Thành công', `Đã thay đổi vai trò của ${pendingRoleChange.userName}`);
      } else {
        const d = await res.json();
        toast.error('Lỗi', d.error || 'Không thể thay đổi vai trò');
      }
    } catch {
      toast.error('Lỗi', 'Đã xảy ra lỗi');
    } finally {
      setSavingRole(false);
      setPendingRoleChange(null);
    }
  };

  const permsByCategory = allPermissions
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* User List */}
      <div className="lg:col-span-1 bg-surface rounded-xl border border-border p-4">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm người dùng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-sm"
            />
          </div>
        </div>

        <div className="space-y-1 max-h-[600px] overflow-y-auto pr-1">
          {loading && page === 1 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Đang tải...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground italic text-sm">
              Không tìm thấy người dùng
            </div>
          ) : (
            <>
              {users.map((user) => {
                const roleOpt = ROLE_OPTIONS.find((o) => o.value === user.role);
                return (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className={cn(
                      'w-full text-left p-3 rounded-lg transition-colors',
                      selectedUser?.id === user.id ? 'bg-primary text-white' : 'hover:bg-muted'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {user.full_name || 'Chưa có tên'}
                        </p>
                        <p
                          className={cn(
                            'text-xs truncate',
                            selectedUser?.id === user.id ? 'text-white/70' : 'text-muted-foreground'
                          )}
                        >
                          {roleOpt?.label || user.role}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
              {hasMore && (
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={loadingMore}
                  className="w-full py-2 text-sm text-primary hover:bg-primary/5 rounded-lg border border-dashed border-primary/30 transition-colors disabled:opacity-50"
                >
                  {loadingMore ? 'Đang tải thêm...' : 'Tải thêm'}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Permission Editor */}
      <div className="lg:col-span-2 bg-surface rounded-xl border border-border p-6">
        {!selectedUser ? (
          <div className="text-center py-16 text-muted-foreground">
            <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Chọn một người dùng để quản lý quyền</p>
          </div>
        ) : !userPermData ? (
          <div className="text-center py-16 text-muted-foreground">Đang tải quyền...</div>
        ) : (
          <div className="space-y-5">
            {/* User Header */}
            <div className="flex items-start gap-4 pb-4 border-b border-border">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold">{userPermData.user.full_name}</h2>
                <p className="text-muted-foreground text-sm">{userPermData.user.email}</p>
              </div>
              {isCurrentAdmin && (
                <div className="flex items-center gap-2 shrink-0">
                  <UserCog className="w-4 h-4 text-muted-foreground" />
                  <select
                    value={userPermData.user.role}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    disabled={savingRole}
                    className="px-3 py-1.5 border border-border rounded-lg bg-background text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50"
                  >
                    {ROLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Admin notice */}
            {['super_admin'].includes(userPermData.user.role) && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-yellow-700 dark:text-yellow-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Super Admin có tất cả quyền theo mặc định</span>
              </div>
            )}

            {/* Permission Search */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Tìm kiếm quyền..."
                value={permissionSearch}
                onChange={(e) => setPermissionSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-sm"
              />
            </div>

            {/* Permissions */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {Object.entries(permsByCategory).map(([cat, perms]) => (
                <UserPermCategory
                  key={cat}
                  category={cat}
                  permissions={perms}
                  rolePermissions={userPermData.rolePermissions}
                  customPermissions={userPermData.customPermissions}
                  userRole={userPermData.user.role}
                  onToggle={handleToggleClick}
                  saving={saving}
                />
              ))}
            </div>
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
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors bg-muted/20"
      >
        <span className="font-medium text-sm">{CATEGORY_LABELS[category] || category}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{permissions.length}</span>
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
                className="flex items-center justify-between py-2.5 px-4 hover:bg-muted/20"
              >
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{perm.name}</p>
                    {isGlobalAdmin && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-black text-white dark:bg-white/10">
                        SA
                      </span>
                    )}
                    {hasFromRole && !isGlobalAdmin && !isDenied && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                        Vai trò
                      </span>
                    )}
                    {hasCustom && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                        Tùy chỉnh
                      </span>
                    )}
                    {isDenied && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                        Từ chối
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{perm.description}</p>
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
    <div className="bg-surface rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Nhật ký thay đổi quyền</h2>
          <p className="text-sm text-muted-foreground">{total} bản ghi</p>
        </div>
        <button onClick={loadLogs} className="p-2 rounded-lg hover:bg-muted transition-colors">
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
          className="px-3 py-1.5 border border-border rounded-lg bg-background text-sm"
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
          className="px-3 py-1.5 border border-border rounded-lg bg-background text-sm"
        >
          <option value="">Tất cả hành động</option>
          <option value="grant">Cấp quyền</option>
          <option value="revoke">Thu hồi</option>
          <option value="deny">Từ chối</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <History className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>Không có nhật ký</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/20 transition-colors"
              >
                <div className="shrink-0 mt-0.5">
                  <span
                    className={cn(
                      'text-xs px-2 py-0.5 rounded-full font-medium',
                      actionColors[log.action] || 'bg-gray-100 text-gray-700'
                    )}
                  >
                    {log.action}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium">{log.permission_code}</p>
                    <span
                      className={cn(
                        'text-xs px-1.5 py-0.5 rounded',
                        log.scope === 'role'
                          ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      )}
                    >
                      {log.scope === 'role' ? 'Vai trò' : 'Người dùng'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {log.user?.full_name || 'N/A'} • Bởi: {log.performer?.full_name || 'N/A'}
                  </p>
                  {log.reason && (
                    <p className="text-xs text-muted-foreground italic mt-0.5">"{log.reason}"</p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground shrink-0">
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
              className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted disabled:opacity-50 transition-colors"
            >
              Trước
            </button>
            <span className="text-sm text-muted-foreground">Trang {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={logs.length < 30 || loading}
              className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted disabled:opacity-50 transition-colors"
            >
              Tiếp
            </button>
          </div>
        </>
      )}
    </div>
  );
}
