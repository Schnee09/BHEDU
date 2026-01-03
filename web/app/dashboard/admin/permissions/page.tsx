// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api/client";
import { usePermissions, PermissionGuard } from "@/hooks/usePermissions";
import { PERMISSIONS, getPermissionsByCategory } from "@/lib/auth/permissions.config";
import type { PermissionCode } from "@/lib/auth/permissions.config";
import {
    Shield, Search, Check, X, Clock, Plus, Trash2,
    User, ChevronDown, ChevronUp, AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

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

function PermissionsContent() {
    const [users, setUsers] = useState<UserForPermissions[]>([]);
    const [selectedUser, setSelectedUser] = useState<UserForPermissions | null>(null);
    const [userPermData, setUserPermData] = useState<UserPermissionData | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

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
            }
        }
        loadUserPermissions();
    }, [selectedUser]);

    // Grant permission
    const handleGrantPermission = async (permissionCode: string) => {
        if (!selectedUser) return;
        setSaving(true);

        try {
            const res = await apiFetch(`/api/admin/permissions/users/${selectedUser.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ permission_code: permissionCode }),
            });

            if (res.ok) {
                // Refresh user permissions
                const refreshRes = await apiFetch(`/api/admin/permissions/users/${selectedUser.id}`);
                if (refreshRes.ok) {
                    const data = await refreshRes.json();
                    setUserPermData(data);
                }
            }
        } catch (error) {
            console.error("Failed to grant permission:", error);
        } finally {
            setSaving(false);
        }
    };

    // Revoke permission
    const handleRevokePermission = async (permissionCode: string) => {
        if (!selectedUser) return;
        setSaving(true);

        try {
            const res = await apiFetch(
                `/api/admin/permissions/users/${selectedUser.id}?permission_code=${permissionCode}`,
                { method: "DELETE" }
            );

            if (res.ok) {
                // Refresh user permissions
                const refreshRes = await apiFetch(`/api/admin/permissions/users/${selectedUser.id}`);
                if (refreshRes.ok) {
                    const data = await refreshRes.json();
                    setUserPermData(data);
                }
            }
        } catch (error) {
            console.error("Failed to revoke permission:", error);
        } finally {
            setSaving(false);
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
                                    <div>
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

                                {/* Permission Categories */}
                                {Object.entries(permissionsByCategory).map(([category, perms]) => (
                                    <PermissionCategory
                                        key={category}
                                        category={category}
                                        permissions={perms}
                                        rolePermissions={userPermData.rolePermissions}
                                        customPermissions={userPermData.customPermissions}
                                        userRole={userPermData.user.role}
                                        onGrant={handleGrantPermission}
                                        onRevoke={handleRevokePermission}
                                        saving={saving}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
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
    onGrant: (code: string) => void;
    onRevoke: (code: string) => void;
    saving: boolean;
}

function PermissionCategory({
    category,
    permissions,
    rolePermissions,
    customPermissions,
    userRole,
    onGrant,
    onRevoke,
    saving,
}: PermissionCategoryProps) {
    const [expanded, setExpanded] = useState(true);

    const categoryLabels: Record<string, string> = {
        system: "Hệ thống",
        users: "Người dùng",
        students: "Học sinh",
        classes: "Lớp học",
        grades: "Điểm số",
        attendance: "Điểm danh",
        finance: "Tài chính",
        reports: "Báo cáo",
    };

    return (
        <div className="border border-border rounded-lg">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
                <span className="font-medium capitalize">
                    {categoryLabels[category] || category}
                </span>
                {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {expanded && (
                <div className="p-4 pt-0 space-y-2">
                    {permissions.map((perm) => {
                        const hasFromRole = rolePermissions.includes(perm.code);
                        const customPerm = customPermissions.find((c) => c.permission_code === perm.code);
                        const hasCustom = !!customPerm && !customPerm.is_denied;
                        const isAdmin = userRole === "admin";

                        return (
                            <div
                                key={perm.code}
                                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50"
                            >
                                <div className="flex-1">
                                    <p className="font-medium text-sm">{perm.name}</p>
                                    <p className="text-xs text-muted-foreground">{perm.description}</p>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Status badges */}
                                    {isAdmin && (
                                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                                            Admin
                                        </span>
                                    )}
                                    {hasFromRole && !isAdmin && (
                                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                                            Từ vai trò
                                        </span>
                                    )}
                                    {hasCustom && (
                                        <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                                            Tùy chỉnh
                                        </span>
                                    )}

                                    {/* Actions */}
                                    {!isAdmin && (
                                        <>
                                            {hasCustom ? (
                                                <button
                                                    onClick={() => onRevoke(perm.code)}
                                                    disabled={saving}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50"
                                                    title="Thu hồi quyền"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            ) : !hasFromRole ? (
                                                <button
                                                    onClick={() => onGrant(perm.code)}
                                                    disabled={saving}
                                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50"
                                                    title="Cấp quyền"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <Check className="w-4 h-4 text-green-500" />
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
