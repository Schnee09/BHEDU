"use client";

import { Edit, Trash2, Key, Lock, Unlock, Mail, Phone, Users, Shield, GraduationCap, Building } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { getRoleLabel } from "@/lib/role-utils";

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
    student_code?: string;
    student_id?: string;
    teacher_code?: string;
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
            <div className="text-center py-24 px-4 bg-stone-50 dark:bg-white/5 rounded-[2.5rem] border border-dashed border-stone-200 dark:border-white/10">
                <div className="bg-stone-100 dark:bg-white/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Users className="w-10 h-10 text-stone-300" />
                </div>
                <h3 className="text-xl font-black text-stone-900 dark:text-white mb-2">Không tìm thấy ai cả!</h3>
                <p className="text-stone-400 font-medium">Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
            </div>
        );
    }

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'admin':
            case 'super_admin': return <Shield className="w-3.5 h-3.5" />;
            case 'owner': return <Building className="w-3.5 h-3.5" />;
            case 'teacher':
            case 'tutor': return <GraduationCap className="w-3.5 h-3.5" />;
            case 'student': return <Users className="w-3.5 h-3.5" />;
            default: return <Users className="w-3.5 h-3.5" />;
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin':
            case 'super_admin':
                return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';
            case 'teacher':
            case 'tutor':
                return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20';
            case 'student':
                return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
            default:
                return 'bg-stone-100 text-stone-600 dark:bg-white/5 dark:text-stone-400 border border-stone-200 dark:border-white/10';
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
        <div className="space-y-4 pb-20 md:hidden">
            {users.map((user, index) => {
                return (
                    <div
                        key={user.id}
                        className={cn(`
                            glass-crystal rounded-[2.5rem] p-6 shadow-ultra border transition-all animate-fade-in-up press-effect
                            ${!user.is_active ? 'opacity-70 grayscale-[0.3]' : 'border-stone-100 dark:border-white/5'}
                        `)}
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        {/* Status Bloom */}
                        <div className={cn(
                            "absolute -top-10 -right-10 w-24 h-24 blur-3xl opacity-20 rounded-full",
                            user.is_active ? "bg-green-500" : "bg-stone-500"
                        )} />

                        <div className="flex justify-between items-start gap-3 mb-4 relative z-10">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-bold text-stone-900 dark:text-stone-100 truncate text-lg tracking-tight">
                                        {user.full_name}
                                    </h3>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <span className={cn(
                                        "px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 shadow-sm",
                                        getRoleColor(user.role)
                                    )}>
                                        {getRoleIcon(user.role)}
                                        {getRoleLabel(user.role)}
                                    </span>
                                    {!user.is_active && (
                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-stone-100 text-stone-500 dark:bg-white/10 dark:text-stone-400 border border-stone-200 dark:border-white/5">
                                            Vô hiệu hóa
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 mb-6 relative z-10 bg-stone-50/50 dark:bg-white/5 p-4 rounded-2xl border border-stone-100/50 dark:border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-white dark:bg-stone-800 rounded-lg shadow-sm">
                                    <Mail className="w-3.5 h-3.5 text-stone-400" />
                                </div>
                                <span className="text-xs font-medium text-stone-600 dark:text-stone-400 truncate">{user.email}</span>
                            </div>
                            {user.phone && (
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 bg-white dark:bg-stone-800 rounded-lg shadow-sm">
                                        <Phone className="w-3.5 h-3.5 text-stone-400" />
                                    </div>
                                    <span className="text-xs font-bold text-stone-800 dark:text-stone-200">{user.phone}</span>
                                </div>
                            )}
                            {(user.student_code || user.teacher_code) && (
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 bg-white dark:bg-stone-800 rounded-lg shadow-sm">
                                        <Shield className="w-3.5 h-3.5 text-emerald-500" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-bold text-stone-400 tracking-wider leading-none mb-1 uppercase">Mã truy cập (UID)</span>
                                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{user.student_code || user.teacher_code}</span>
                                    </div>
                                </div>
                            )}
                            {user.role === 'student' && user.student_id && (
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 bg-white dark:bg-stone-800 rounded-lg shadow-sm">
                                        <Key className="w-3.5 h-3.5 text-amber-500" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-bold text-stone-400 tracking-wider leading-none mb-1 uppercase">Mã định danh (CID)</span>
                                        <span className="text-xs font-bold text-amber-600 dark:text-amber-500">{user.student_id}</span>
                                    </div>
                                </div>
                            )}
                            {user.department && (
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 bg-white dark:bg-stone-800 rounded-lg shadow-sm">
                                        <Building className="w-3.5 h-3.5 text-stone-400" />
                                    </div>
                                    <span className="text-xs font-medium text-stone-600 dark:text-stone-400 truncate">{user.department}</span>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-4 gap-3 pt-4 border-t border-stone-100 dark:border-white/5 relative z-10">
                            <button
                                onClick={() => onEdit(user)}
                                className="h-12 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center hover:bg-blue-500/20 transition-all press-effect shadow-sm"
                                title="Chỉnh sửa"
                            >
                                <Edit className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => onResetPassword(user)}
                                className="h-12 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center hover:bg-amber-500/20 transition-all press-effect shadow-sm"
                                title="Đặt lại mật khẩu"
                            >
                                <Key className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => onToggleActive(user)}
                                className={cn(
                                    "h-12 rounded-2xl flex items-center justify-center transition-all press-effect shadow-sm",
                                    user.is_active
                                        ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20'
                                        : 'bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20'
                                )}
                                title={user.is_active ? "Vô hiệu hóa" : "Kích hoạt"}
                            >
                                {user.is_active ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                            </button>
                            <button
                                onClick={() => onDelete(user)}
                                className="h-12 bg-red-500/10 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center hover:bg-red-500/20 transition-all press-effect shadow-sm"
                                title="Xóa vĩnh viễn"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

