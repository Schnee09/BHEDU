// @ts-nocheck
"use client";

import { Edit, Trash2, Key, Lock, Unlock, Mail, Phone, Users, Shield, GraduationCap, Building } from "lucide-react";
import { format } from "date-fns";

// Mimic User interface or import if possible. Since it's not exported in page.tsx, we redefine compatible one.
interface User {
    id: string;
    email: string;
    full_name: string;
    role: string;
    is_active: boolean;
    last_login_at: string | null;
    created_at: string;
    phone?: string;
    department?: string;
    student_id?: string;
    grade_level?: string;
    notes?: string;
}

interface MobileUserListProps {
    users: User[];
    onEdit: (user: User) => void;
    onResetPassword: (user: User) => void;
    onDelete: (user: User) => void;
    onToggleActive: (user: User) => void;
}

export default function MobileUserList({
    users,
    onEdit,
    onResetPassword,
    onDelete,
    onToggleActive
}: MobileUserListProps) {
    if (users.length === 0) {
        return (
            <div className="text-center py-10 px-4">
                <div className="bg-gray-100 dark:bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">Không tìm thấy người dùng nào</p>
            </div>
        );
    }

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'admin': return <Shield className="w-3.5 h-3.5" />;
            case 'teacher': return <GraduationCap className="w-3.5 h-3.5" />;
            case 'student': return <Users className="w-3.5 h-3.5" />;
            default: return <Users className="w-3.5 h-3.5" />;
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
            case 'teacher': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
            case 'student': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
            default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
        }
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'admin': return 'Quản trị viên';
            case 'teacher': return 'Giáo viên';
            case 'student': return 'Học sinh';
            default: return role;
        }
    };

    return (
        <div className="space-y-3 pb-20 md:hidden">
            {users.map((user) => {
                return (
                    <div
                        key={user.id}
                        className={`
              bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border transition-all
              ${!user.is_active ? 'opacity-70 bg-gray-50 dark:bg-gray-900' : 'border-gray-100 dark:border-gray-700'}
            `}
                    >
                        <div className="flex justify-between items-start gap-3 mb-3">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-gray-900 dark:text-white truncate text-base">
                                        {user.full_name}
                                    </h3>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${getRoleColor(user.role)}`}>
                                        {getRoleIcon(user.role)}
                                        {getRoleLabel(user.role)}
                                    </span>
                                    {!user.is_active && (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                                            Vô hiệu hóa
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-4">
                            <div className="flex items-center gap-2">
                                <Mail className="w-3.5 h-3.5 text-gray-400" />
                                <span className="truncate">{user.email}</span>
                            </div>
                            {user.phone && (
                                <div className="flex items-center gap-2">
                                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                                    <span className="font-medium">{user.phone}</span>
                                </div>
                            )}
                            {user.department && (
                                <div className="flex items-center gap-2">
                                    <Building className="w-3.5 h-3.5 text-gray-400" />
                                    <span className="truncate">{user.department}</span>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-4 gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                            <button
                                onClick={() => onEdit(user)}
                                className="py-2 bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                title="Chỉnh sửa"
                            >
                                <Edit className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => onResetPassword(user)}
                                className="py-2 bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400 rounded-lg flex items-center justify-center hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                                title="Đặt lại mật khẩu"
                            >
                                <Key className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => onToggleActive(user)}
                                className={`py-2 rounded-lg flex items-center justify-center transition-colors ${user.is_active
                                    ? 'bg-orange-50 dark:bg-orange-900/10 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30'
                                    : 'bg-green-50 dark:bg-green-900/10 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30'
                                    }`}
                                title={user.is_active ? "Vô hiệu hóa" : "Kích hoạt"}
                            >
                                {user.is_active ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={() => onDelete(user)}
                                className="py-2 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-lg flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                title="Xóa vĩnh viễn"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
