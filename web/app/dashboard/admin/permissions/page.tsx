// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api/client";
import { usePermissions, PermissionGuard } from "@/hooks/usePermissions";
import { PERMISSIONS, getPermissionsByCategory } from "@/lib/auth/permissions.config";
import type { PermissionCode } from "@/lib/auth/permissions.config";
import {
    Shield, Search, Check, X, Clock,
    User, ChevronDown, ChevronUp, AlertCircle, Filter
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/useToast";

// Types
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

interface PendingAction {
    type: 'grant' | 'revoke';
    permissionCode: string;
    permissionName: string;
}

// Main Component
export default function PermissionsPage() {
    return (
        <PermissionGuard
            permissions="users.permissions"
            fallback={<UnauthorizedMessage />}
        >
            <PermissionsContent />
        </PermissionGuard>
    );
}

function UnauthorizedMessage() {
    return (
        <div className="min-h-[50vh] flex items-center justify-center">
            <div className="text-center">
                <Shield className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold">Không có quyền truy cập</h2>
                <p className="text-muted-foreground mt-2">
                    Bạn cần quyền quản trị để xem trang này
                </p>
            </div>
        </div>
    );
}

// Confirmation Modal Component
function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText,
    confirmVariant = 'primary',
    loading
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText: string;
    confirmVariant?: 'primary' | 'danger';
    loading?: boolean;
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <p className="text-muted-foreground mb-6">{message}</p>
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={cn(
                            "px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2",
                            confirmVariant === 'danger'
                                ? "bg-red-500 text-white hover:bg-red-600"
                                : "bg-primary text-white hover:bg-primary/90"
                        )}
                    >
                        {loading && (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        )}
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Toggle Switch Component
function ToggleSwitch({
    checked,
    onChange,
    disabled,
    size = 'md'
}: {
    checked: boolean;
    onChange: () => void;
    disabled?: boolean;
    size?: 'sm' | 'md';
}) {
    const sizes = {
        sm: { track: 'w-8 h-4', thumb: 'w-3 h-3', translate: 'translate-x-4' },
        md: { track: 'w-11 h-6', thumb: 'w-5 h-5', translate: 'translate-x-5' }
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
                "relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
                s.track,
                checked ? "bg-primary" : "bg-gray-200 dark:bg-gray-600"
            )}
        >
            <span
                className={cn(
                    "pointer-events-none inline-block rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out",
                    s.thumb,
                    checked ? s.translate : "translate-x-0"
                )}
            />
        </button>
    );
}

function PermissionsContent() {
    const [users, setUsers] = useState<UserForPermissions[]>([]);
    const [selectedUser, setSelectedUser] = useState<UserForPermissions | null>(null);
    const [userPermData, setUserPermData] = useState<UserPermissionData | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [permissionSearch, setPermissionSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

    const toast = useToast();
    const permissionsByCategory = getPermissionsByCategory();

    // Load users
    useEffect(() => {
        async function loadUsers() {
            try {
                const res = await apiFetch("/api/admin/users?limit=100");
                if (res.ok) {
                    const data = await res.json();
                    setUsers(data.users || []);
                }
            } catch (error) {
                console.error("Failed to load users:", error);
                toast.error("Error", "Không thể tải danh sách người dùng");
            } finally {
                setLoading(false);
            }
        }
        loadUsers();
    }, []);

    // Load selected user's permissions
    useEffect(() => {
        if (!selectedUser) {
            setUserPermData(null);
            return;
        }

        async function loadUserPermissions() {
            try {
                const res = await apiFetch(`/api/admin/permissions/users/${selectedUser.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setUserPermData(data);
                }
            } catch (error) {
                console.error("Failed to load user permissions:", error);
                toast.error("Error", "Không thể tải quyền người dùng");
            }
        }
        loadUserPermissions();
    }, [selectedUser]);

    // Handle toggle click - opens confirmation modal
    const handleToggleClick = (permissionCode: string, permissionName: string, currentlyHas: boolean) => {
        setPendingAction({
            type: currentlyHas ? 'revoke' : 'grant',
            permissionCode,
            permissionName
        });
    };

    // Confirm and execute action
    const handleConfirmAction = async () => {
        if (!selectedUser || !pendingAction) return;
        setSaving(true);

        try {
            let res: Response;
            if (pendingAction.type === 'grant') {
                res = await apiFetch(`/api/admin/permissions/users/${selectedUser.id}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ permission_code: pendingAction.permissionCode }),
                });
            } else {
                res = await apiFetch(
                    `/api/admin/permissions/users/${selectedUser.id}?permission_code=${pendingAction.permissionCode}`,
                    { method: "DELETE" }
                );
            }

            if (res.ok) {
                // Refresh user permissions
                const refreshRes = await apiFetch(`/api/admin/permissions/users/${selectedUser.id}`);
                if (refreshRes.ok) {
                    const data = await refreshRes.json();
                    setUserPermData(data);
                }

                toast.success(
                    "Success",
                    pendingAction.type === 'grant'
                        ? `Đã cấp quyền "${pendingAction.permissionName}"`
                        : `Đã thu hồi quyền "${pendingAction.permissionName}"`
                );
            } else {
                const errorData = await res.json();
                toast.error("Error", errorData.error || "Thao tác thất bại");
            }
        } catch (error) {
            console.error("Failed to update permission:", error);
            toast.error("Error", "Đã xảy ra lỗi khi cập nhật quyền");
        } finally {
            setSaving(false);
            setPendingAction(null);
        }
    };

    // Filter users
    const filteredUsers = users.filter(
        (u) =>
            u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                        <Shield className="w-8 h-8" />
                        Quản lý Quyền
                    </h1>
                    <p className="mt-2 text-muted-foreground">
                        Cấp và thu hồi quyền truy cập cho từng người dùng
                    </p>
                </div>

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
                                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 max-h-[600px] overflow-y-auto">
                            {loading ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    Đang tải...
                                </div>
                            ) : (
                                filteredUsers.map((user) => (
                                    <button
                                        key={user.id}
                                        onClick={() => setSelectedUser(user)}
                                        className={cn(
                                            "w-full text-left p-3 rounded-lg transition-colors",
                                            selectedUser?.id === user.id
                                                ? "bg-primary text-white"
                                                : "hover:bg-muted"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">
                                                    {user.full_name || "Chưa có tên"}
                                                </p>
                                                <p className={cn(
                                                    "text-sm truncate",
                                                    selectedUser?.id === user.id
                                                        ? "text-white/70"
                                                        : "text-muted-foreground"
                                                )}>
                                                    {user.role}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))
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
                            <div className="text-center py-16 text-muted-foreground">
                                Đang tải quyền...
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* User Info */}
                                <div className="flex items-center gap-4 pb-4 border-b border-border">
                                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                                        <User className="w-7 h-7 text-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-xl font-semibold">
                                            {userPermData.user.full_name}
                                        </h2>
                                        <p className="text-muted-foreground">
                                            {userPermData.user.email} • Vai trò: {userPermData.user.role}
                                        </p>
                                    </div>
                                </div>

                                {/* Admin Notice */}
                                {userPermData.user.role === "admin" && (
                                    <div className="flex items-center gap-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-yellow-700 dark:text-yellow-400">
                                        <AlertCircle className="w-5 h-5" />
                                        <span>Admin có tất cả quyền theo mặc định</span>
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
                                        className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background"
                                    />
                                </div>

                                {/* Permission Categories */}
                                {Object.entries(permissionsByCategory).map(([category, perms]) => {
                                    const filteredPerms = perms.filter(p =>
                                        permissionSearch === "" ||
                                        p.name.toLowerCase().includes(permissionSearch.toLowerCase()) ||
                                        p.description.toLowerCase().includes(permissionSearch.toLowerCase()) ||
                                        p.code.toLowerCase().includes(permissionSearch.toLowerCase())
                                    );

                                    if (filteredPerms.length === 0) return null;

                                    return (
                                        <PermissionCategory
                                            key={category}
                                            category={category}
                                            permissions={filteredPerms}
                                            rolePermissions={userPermData.rolePermissions}
                                            customPermissions={userPermData.customPermissions}
                                            userRole={userPermData.user.role}
                                            onToggle={handleToggleClick}
                                            saving={saving}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            <ConfirmModal
                isOpen={pendingAction !== null}
                onClose={() => setPendingAction(null)}
                onConfirm={handleConfirmAction}
                loading={saving}
                title={pendingAction?.type === 'grant' ? 'Xác nhận cấp quyền' : 'Xác nhận thu hồi quyền'}
                message={
                    pendingAction?.type === 'grant'
                        ? `Bạn có chắc muốn cấp quyền "${pendingAction?.permissionName}" cho người dùng này?`
                        : `Bạn có chắc muốn thu hồi quyền "${pendingAction?.permissionName}" từ người dùng này?`
                }
                confirmText={pendingAction?.type === 'grant' ? 'Cấp quyền' : 'Thu hồi'}
                confirmVariant={pendingAction?.type === 'revoke' ? 'danger' : 'primary'}
            />
        </div>
    );
}

// Permission Category Component
interface PermissionCategoryProps {
    category: string;
    permissions: typeof PERMISSIONS[PermissionCode][];
    rolePermissions: string[];
    customPermissions: CustomPermission[];
    userRole: string;
    onToggle: (code: string, name: string, currentlyHas: boolean) => void;
    saving: boolean;
}

function PermissionCategory({
    category,
    permissions,
    rolePermissions,
    customPermissions,
    userRole,
    onToggle,
    saving,
}: PermissionCategoryProps) {
    const [expanded, setExpanded] = useState(true);

    const categoryLabels: Record<string, string> = {
        system: "Hệ Thống",
        users: "Người Dùng",
        students: "Học Sinh",
        classes: "Lớp Học",
        grades: "Điểm Số",
        attendance: "Điểm Danh",
        finance: "Tài Chính",
        reports: "Báo Cáo",
    };

    return (
        <div className="border border-border rounded-lg overflow-hidden">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors bg-muted/20"
            >
                <span className="font-semibold">
                    {categoryLabels[category] || category}
                </span>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                        {permissions.length} quyền
                    </span>
                    {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
            </button>

            {expanded && (
                <div className="divide-y divide-border">
                    {permissions.map((perm) => {
                        const hasFromRole = rolePermissions.includes(perm.code);
                        const customPerm = customPermissions.find((c) => c.permission_code === perm.code);
                        const hasCustom = !!customPerm && !customPerm.is_denied;
                        const isAdmin = userRole === "admin";
                        const hasPermission = isAdmin || hasFromRole || hasCustom;
                        const canToggle = !isAdmin && !hasFromRole;

                        return (
                            <div
                                key={perm.code}
                                className="flex items-center justify-between py-3 px-4 hover:bg-muted/30"
                            >
                                <div className="flex-1 min-w-0 pr-4">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-sm">{perm.name}</p>
                                        {/* Status badges */}
                                        {isAdmin && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                                Admin
                                            </span>
                                        )}
                                        {hasFromRole && !isAdmin && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                                                Từ vai trò
                                            </span>
                                        )}
                                        {hasCustom && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                                                Tùy chỉnh
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">{perm.description}</p>
                                </div>

                                <div className="flex items-center gap-3">
                                    {canToggle ? (
                                        <ToggleSwitch
                                            checked={hasCustom}
                                            onChange={() => onToggle(perm.code, perm.name, hasCustom)}
                                            disabled={saving}
                                            size="sm"
                                        />
                                    ) : (
                                        <div className={cn(
                                            "w-5 h-5 rounded-full flex items-center justify-center",
                                            hasPermission ? "bg-green-100 dark:bg-green-900/30" : "bg-gray-100 dark:bg-gray-800"
                                        )}>
                                            {hasPermission ? (
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
