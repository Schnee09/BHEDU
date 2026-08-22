'use client';

import React, { useState } from 'react';
import {
  MoreVertical,
  KeyRound,
  Edit3,
  Trash2,
  Check,
  Copy,
  ChevronLeft,
  ChevronRight,
  Shield,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/lib/auth/core';

export interface UserItem {
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
  school_name?: string;
  occupation?: string;
  notes?: string;
  personal_email?: string;
  photo_url?: string | null;
}

interface UserTableProps {
  users: UserItem[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onUserClick: (user: UserItem) => void;
  onEdit: (user: UserItem) => void;
  onResetPassword: (user: UserItem) => void;
  onDelete: (user: UserItem) => void;
  onToggleActive: (user: UserItem) => void;
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
  loading?: boolean;
}

export function UserTable({
  users,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onUserClick,
  onEdit,
  onResetPassword,
  onDelete,
  onToggleActive,
  page,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  loading,
}: UserTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return {
          label: 'Quản trị Hệ thống',
          className: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
        };
      case 'owner':
        return {
          label: 'Chủ trung tâm',
          className: 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30',
        };
      case 'admin':
        return {
          label: 'Quản trị viên',
          className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
        };
      case 'teacher':
        return {
          label: 'Giáo viên',
          className:
            'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
        };
      case 'tutor':
        return {
          label: 'Gia sư',
          className: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border-cyan-500/30',
        };
      case 'parent':
        return {
          label: 'Phụ huynh',
          className: 'bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30',
        };
      case 'student':
        return {
          label: 'Học sinh',
          className: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
        };
      default:
        return {
          label: 'Người dùng',
          className: 'bg-stone-500/15 text-stone-700 dark:text-stone-400 border-stone-500/30',
        };
    }
  };

  const isAllSelected = users.length > 0 && selectedIds.size === users.length;
  const isSomeSelected = selectedIds.size > 0 && !isAllSelected;

  return (
    <div className="rounded-2xl bg-white dark:bg-[#14120E] border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden flex flex-col">
      {/* Table container */}
      <div className="overflow-x-auto min-h-[380px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-[#181612] text-[11px] font-black uppercase tracking-wider text-stone-500 dark:text-stone-400 select-none">
              <th className="py-3 px-4 w-12 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isSomeSelected;
                  }}
                  onChange={onToggleSelectAll}
                  className="w-4 h-4 rounded border-stone-300 dark:border-stone-700 text-amber-500 focus:ring-amber-400 cursor-pointer"
                />
              </th>
              <th className="py-3 px-4">Người dùng</th>
              <th className="py-3 px-4">Vai trò</th>
              <th className="py-3 px-4">Mã định danh / Đơn vị</th>
              <th className="py-3 px-4">Trạng thái</th>
              <th className="py-3 px-4">Đăng nhập gần nhất</th>
              <th className="py-3 px-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800/80 text-xs">
            {loading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="py-4 px-4 text-center">
                    <div className="w-4 h-4 bg-stone-200 dark:bg-stone-800 rounded mx-auto" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-stone-200 dark:bg-stone-800 shrink-0" />
                      <div className="space-y-1.5 flex-1">
                        <div className="h-3.5 bg-stone-200 dark:bg-stone-800 rounded w-32" />
                        <div className="h-2.5 bg-stone-200 dark:bg-stone-800 rounded w-48" />
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-6 bg-stone-200 dark:bg-stone-800 rounded-full w-24" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded w-28" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded w-20" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded w-24" />
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="w-7 h-7 bg-stone-200 dark:bg-stone-800 rounded-lg ml-auto" />
                  </td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center">
                  <div className="max-w-xs mx-auto space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3">
                      <Shield className="w-6 h-6" />
                    </div>
                    <p className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                      Không tìm thấy người dùng
                    </p>
                    <p className="text-stone-400 text-xs">
                      Không có kết quả nào khớp với bộ lọc hoặc từ khóa tìm kiếm.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const isSelected = selectedIds.has(user.id);
                const roleBadge = getRoleBadge(user.role);
                const code =
                  user.student_code ||
                  user.student_id ||
                  user.teacher_code ||
                  user.id.slice(0, 8).toUpperCase();

                const getUserUnit = (u: UserItem) => {
                  switch (u.role) {
                    case 'student':
                      return u.grade_level || 'Chưa xếp khối';
                    case 'teacher':
                      return u.department ? `Bộ môn ${u.department}` : 'Giáo viên';
                    case 'tutor':
                      return u.department ? `Gia sư môn ${u.department}` : 'Gia sư';
                    case 'parent':
                      return u.occupation || 'Phụ huynh học sinh';
                    case 'admin':
                      return u.department || 'Ban Quản trị';
                    case 'owner':
                      return 'Ban Giám đốc';
                    case 'super_admin':
                      return 'Quản trị Hệ thống';
                    default:
                      return u.department || 'BH-EDU';
                  }
                };
                const unit = getUserUnit(user);

                const formattedLastLogin = user.last_login_at
                  ? new Date(user.last_login_at).toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Chưa đăng nhập';

                return (
                  <tr
                    key={user.id}
                    onClick={() => onUserClick(user)}
                    className={cn(
                      'group transition-colors duration-150 cursor-pointer select-none',
                      isSelected
                        ? 'bg-amber-50/60 dark:bg-amber-950/20'
                        : 'hover:bg-stone-50 dark:hover:bg-[#1A1814]'
                    )}
                  >
                    {/* Checkbox */}
                    <td
                      className="py-3.5 px-4 text-center shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(user.id)}
                        className="w-4 h-4 rounded border-stone-300 dark:border-stone-700 text-amber-500 focus:ring-amber-400 cursor-pointer"
                      />
                    </td>

                    {/* User info */}
                    <td className="py-3.5 px-4 min-w-[200px]">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                          {user.photo_url ? (
                            <img
                              src={user.photo_url}
                              alt={user.full_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{user.full_name?.charAt(0) || 'U'}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-stone-900 dark:text-stone-100 truncate group-hover:text-amber-600 transition-colors">
                              {user.full_name || 'Chưa đặt tên'}
                            </span>
                            {user.is_managed && (
                              <span
                                className="px-1.5 py-0.5 rounded-md text-[9px] font-bold tracking-tight bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/50 shrink-0 whitespace-nowrap"
                                title="Tài khoản nội bộ do Quản trị viên khởi tạo và quản lý"
                              >
                                Tài khoản hệ thống
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-stone-400 dark:text-stone-500 truncate mt-0.5">
                            {user.email} {user.phone ? `• ${user.phone}` : ''}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4 shrink-0">
                      <span
                        className={cn(
                          'inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border shadow-xs',
                          roleBadge.className
                        )}
                      >
                        {roleBadge.label}
                      </span>
                    </td>

                    {/* Code & Unit */}
                    <td className="py-3.5 px-4 min-w-[150px]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-[11px] text-stone-800 dark:text-stone-200">
                          {code}
                        </span>
                        <button
                          onClick={(e) => handleCopy(code, user.id, e)}
                          title="Sao chép mã"
                          className="p-1 rounded-md text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors"
                        >
                          {copiedId === user.id ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      <p className="text-[10px] text-stone-400 dark:text-stone-500 truncate mt-0.5">
                        {unit}
                      </p>
                    </td>

                    {/* Active toggle */}
                    <td className="py-3.5 px-4 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onToggleActive(user)}
                        title={user.is_active ? 'Bấm để vô hiệu hóa' : 'Bấm để kích hoạt'}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer shadow-xs',
                          user.is_active
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                        )}
                      >
                        {user.is_active ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Hoạt động</span>
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            <span>Đã khóa</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Last login */}
                    <td className="py-3.5 px-4 shrink-0 text-stone-500 dark:text-stone-400 text-[11px] font-medium whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-stone-400 shrink-0" />
                        <span>{formattedLastLogin}</span>
                      </div>
                    </td>

                    {/* Actions dropdown */}
                    <td
                      className="py-3.5 px-4 text-right shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="relative inline-block text-left">
                        <button
                          onClick={() =>
                            setOpenDropdownId(openDropdownId === user.id ? null : user.id)
                          }
                          className="p-1.5 rounded-xl hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {openDropdownId === user.id && (
                          <>
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setOpenDropdownId(null)}
                            />
                            <div className="absolute right-0 mt-1 w-44 rounded-2xl bg-white dark:bg-[#1C1A16] border border-stone-200 dark:border-stone-800 shadow-xl py-1 z-50 animate-scale-in origin-top-right text-xs font-bold text-stone-700 dark:text-stone-300">
                              <button
                                onClick={() => {
                                  setOpenDropdownId(null);
                                  onUserClick(user);
                                }}
                                className="w-full px-3.5 py-2 flex items-center gap-2 hover:bg-stone-100 dark:hover:bg-[#25221D] transition-colors text-left"
                              >
                                <Eye className="w-3.5 h-3.5 text-stone-400" />
                                <span>Xem chi tiết</span>
                              </button>

                              <button
                                onClick={() => {
                                  setOpenDropdownId(null);
                                  onEdit(user);
                                }}
                                className="w-full px-3.5 py-2 flex items-center gap-2 hover:bg-stone-100 dark:hover:bg-[#25221D] transition-colors text-left"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-amber-500" />
                                <span>Chỉnh sửa</span>
                              </button>

                              <button
                                onClick={() => {
                                  setOpenDropdownId(null);
                                  onResetPassword(user);
                                }}
                                className="w-full px-3.5 py-2 flex items-center gap-2 hover:bg-stone-100 dark:hover:bg-[#25221D] transition-colors text-left"
                              >
                                <KeyRound className="w-3.5 h-3.5 text-blue-500" />
                                <span>Đổi mật khẩu</span>
                              </button>

                              <div className="my-1 border-t border-stone-100 dark:border-stone-800" />

                              <button
                                onClick={() => {
                                  setOpenDropdownId(null);
                                  onDelete(user);
                                }}
                                className="w-full px-3.5 py-2 flex items-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 transition-colors text-left"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Xóa người dùng</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-[#181612] text-xs font-bold text-stone-500 dark:text-stone-400">
          <div>
            Hiển thị <span className="text-stone-900 dark:text-stone-100">{users.length}</span> /{' '}
            <span className="text-stone-900 dark:text-stone-100">{totalCount}</span> người dùng
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1 || loading}
              className="p-1.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 text-xs font-bold text-stone-800 dark:text-stone-200">
              Trang {page} / {totalPages}
            </span>

            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages || loading}
              className="p-1.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
