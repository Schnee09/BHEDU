'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  BookOpen,
  Users,
  Activity,
  KeyRound,
  Edit3,
  Trash2,
  Copy,
  Check,
  Building2,
  Clock,
  GraduationCap,
  Award,
  Coins,
  Briefcase,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserItem } from './UserTable';
import { createClient } from '@/lib/supabase/client';

interface UserDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserItem | null;
  onEdit: (user: UserItem) => void;
  onResetPassword: (user: UserItem) => void;
  onDelete: (user: UserItem) => void;
  onToggleActive: (user: UserItem) => void;
}

type DrawerTab = 'profile' | 'classes' | 'activity';

export function UserDetailDrawer({
  isOpen,
  onClose,
  user,
  onEdit,
  onResetPassword,
  onDelete,
  onToggleActive,
}: UserDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<DrawerTab>('profile');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [relatedData, setRelatedData] = useState<{ classes?: any[]; links?: any[] }>({});
  const [relatedLoading, setRelatedLoading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (!isOpen || !user) return;
    setActiveTab('profile');

    // Fetch related audit logs
    const fetchLogs = async () => {
      setLogsLoading(true);
      try {
        const { data } = await supabase
          .from('audit_logs')
          .select('id, action, resource_type, created_at, details')
          .eq('actor_id', user.id)
          .order('created_at', { ascending: false })
          .limit(8);
        setAuditLogs(data || []);
      } catch (e) {
        // quiet error
      } finally {
        setLogsLoading(false);
      }
    };

    // Fetch classes / enrollments / links
    const fetchRelated = async () => {
      setRelatedLoading(true);
      try {
        if (user.role === 'student') {
          // Fetch student enrollments
          const { data: enrollments } = await supabase
            .from('class_enrollments')
            .select('id, status, classes(id, name, room, grade_level)')
            .eq('student_id', user.id)
            .limit(5);

          // Fetch parent links
          const { data: parents } = await supabase
            .from('student_parent_links')
            .select('id, parent_id, relationship_type, profiles!parent_id(full_name, phone, email)')
            .eq('student_id', user.id)
            .limit(3);

          setRelatedData({ classes: enrollments || [], links: parents || [] });
        } else if (user.role === 'teacher' || user.role === 'tutor') {
          // Fetch teaching classes
          const { data: classes } = await supabase
            .from('classes')
            .select('id, name, room, grade_level, status')
            .eq('teacher_id', user.id)
            .limit(5);

          setRelatedData({ classes: classes || [] });
        } else if (user.role === 'parent') {
          // Fetch linked children
          const { data: children } = await supabase
            .from('student_parent_links')
            .select('id, student_id, relationship_type, profiles!student_id(full_name, student_code, phone)')
            .eq('parent_id', user.id)
            .limit(5);

          setRelatedData({ links: children || [] });
        }
      } catch (err) {
        // quiet
      } finally {
        setRelatedLoading(false);
      }
    };

    fetchLogs();
    fetchRelated();
  }, [isOpen, user?.id]);

  if (!isOpen || !user) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const code =
    user.student_code ||
    user.student_id ||
    user.teacher_code ||
    user.id.slice(0, 8).toUpperCase();

  const formattedCreated = new Date(user.created_at).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const formattedLastLogin = user.last_login_at
    ? new Date(user.last_login_at).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Chưa từng đăng nhập';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-50 transition-opacity duration-150"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white dark:bg-[#14120E] border-l-2 border-stone-200 dark:border-stone-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-250">
        {/* Header */}
        <div className="p-6 border-b border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-[#181612] shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white font-black text-xl flex items-center justify-center shadow-md overflow-hidden shrink-0">
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
              <div className="min-w-0">
                <h3 className="text-base font-black text-stone-900 dark:text-white truncate">
                  {user.full_name || 'Chưa đặt tên'}
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 truncate mt-0.5">
                  {user.email}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                    {user.role}
                  </span>
                  <button
                    onClick={() => onToggleActive(user)}
                    className={cn(
                      'px-2 py-0.5 rounded-md text-[9px] font-bold border transition-colors cursor-pointer',
                      user.is_active
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30'
                    )}
                  >
                    {user.is_active ? '● Hoạt động' : '○ Đã khóa'}
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-6 border-b border-stone-200 dark:border-stone-800 -mb-6">
            {[
              { id: 'profile', label: 'Hồ sơ', icon: User },
              { id: 'classes', label: 'Lớp & Liên kết', icon: BookOpen },
              { id: 'activity', label: 'Nhật ký (Logs)', icon: Activity },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as DrawerTab)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all -mb-px',
                    active
                      ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                      : 'border-transparent text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {activeTab === 'profile' && (
            <div className="space-y-4">
              {/* Identifiers card */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-[#181612] border border-stone-200 dark:border-stone-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                    Mã định danh
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-xs text-stone-900 dark:text-stone-100">
                      {code}
                    </span>
                    <button
                      onClick={() => handleCopy(code, 'code')}
                      className="p-1 rounded text-stone-400 hover:text-amber-500"
                    >
                      {copiedKey === 'code' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                    Mã UUID hệ thống
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] text-stone-600 dark:text-stone-400 truncate max-w-[180px]">
                      {user.id}
                    </span>
                    <button
                      onClick={() => handleCopy(user.id, 'uuid')}
                      className="p-1 rounded text-stone-400 hover:text-amber-500"
                    >
                      {copiedKey === 'uuid' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Contact and details */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-2 border-b border-stone-100 dark:border-stone-800">
                  <span className="flex items-center gap-2 text-stone-500 dark:text-stone-400">
                    <Mail className="w-3.5 h-3.5 text-amber-500" /> Email hệ thống
                  </span>
                  <span className="font-bold text-stone-900 dark:text-stone-100">
                    {user.email}
                  </span>
                </div>

                {user.personal_email && (
                  <div className="flex items-center justify-between py-2 border-b border-stone-100 dark:border-stone-800">
                    <span className="flex items-center gap-2 text-stone-500 dark:text-stone-400">
                      <Mail className="w-3.5 h-3.5 text-amber-500" /> Email cá nhân
                    </span>
                    <span className="font-bold text-stone-900 dark:text-stone-100">
                      {user.personal_email}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between py-2 border-b border-stone-100 dark:border-stone-800">
                  <span className="flex items-center gap-2 text-stone-500 dark:text-stone-400">
                    <Phone className="w-3.5 h-3.5 text-emerald-500" /> Số điện thoại
                  </span>
                  <span className="font-bold text-stone-900 dark:text-stone-100">
                    {user.phone || 'Chưa cập nhật'}
                  </span>
                </div>

                {/* Role Specific Attributes */}
                {user.role === 'student' && user.grade_level && (
                  <div className="flex items-center justify-between py-2 border-b border-stone-100 dark:border-stone-800">
                    <span className="flex items-center gap-2 text-stone-500 dark:text-stone-400">
                      <GraduationCap className="w-3.5 h-3.5 text-blue-500" /> Khối lớp học tập
                    </span>
                    <span className="font-bold text-stone-900 dark:text-stone-100">
                      {user.grade_level}
                    </span>
                  </div>
                )}

                {user.role === 'student' && (user as any).school_name && (
                  <div className="flex items-center justify-between py-2 border-b border-stone-100 dark:border-stone-800">
                    <span className="flex items-center gap-2 text-stone-500 dark:text-stone-400">
                      <Building2 className="w-3.5 h-3.5 text-stone-500" /> Trường đang học
                    </span>
                    <span className="font-bold text-stone-900 dark:text-stone-100">
                      {(user as any).school_name}
                    </span>
                  </div>
                )}

                {(user.role === 'teacher' || user.role === 'tutor') && user.department && (
                  <div className="flex items-center justify-between py-2 border-b border-stone-100 dark:border-stone-800">
                    <span className="flex items-center gap-2 text-stone-500 dark:text-stone-400">
                      <BookOpen className="w-3.5 h-3.5 text-amber-500" /> Môn học phụ trách
                    </span>
                    <span className="font-bold text-stone-900 dark:text-stone-100">
                      {user.department}
                    </span>
                  </div>
                )}

                {(user.role === 'teacher' || user.role === 'tutor') && (user as any).specialization && (
                  <div className="flex items-center justify-between py-2 border-b border-stone-100 dark:border-stone-800">
                    <span className="flex items-center gap-2 text-stone-500 dark:text-stone-400">
                      <Award className="w-3.5 h-3.5 text-amber-500" /> Chuyên môn / Học vị
                    </span>
                    <span className="font-bold text-stone-900 dark:text-stone-100">
                      {(user as any).specialization}
                    </span>
                  </div>
                )}

                {(user.role === 'teacher' || user.role === 'tutor') && (user as any).hourly_rate ? (
                  <div className="flex items-center justify-between py-2 border-b border-stone-100 dark:border-stone-800">
                    <span className="flex items-center gap-2 text-stone-500 dark:text-stone-400">
                      <Coins className="w-3.5 h-3.5 text-amber-500" /> Mức chi trả theo ca
                    </span>
                    <span className="font-bold text-stone-900 dark:text-stone-100">
                      {Number((user as any).hourly_rate).toLocaleString('vi-VN')} đ/buổi
                    </span>
                  </div>
                ) : null}

                {user.role === 'parent' && (user as any).occupation && (
                  <div className="flex items-center justify-between py-2 border-b border-stone-100 dark:border-stone-800">
                    <span className="flex items-center gap-2 text-stone-500 dark:text-stone-400">
                      <Briefcase className="w-3.5 h-3.5 text-emerald-500" /> Nghề nghiệp
                    </span>
                    <span className="font-bold text-stone-900 dark:text-stone-100">
                      {(user as any).occupation}
                    </span>
                  </div>
                )}

                {(user.role === 'admin' || user.role === 'owner' || user.role === 'super_admin') && user.department && (
                  <div className="flex items-center justify-between py-2 border-b border-stone-100 dark:border-stone-800">
                    <span className="flex items-center gap-2 text-stone-500 dark:text-stone-400">
                      <Building2 className="w-3.5 h-3.5 text-stone-500" /> Phòng ban phụ trách
                    </span>
                    <span className="font-bold text-stone-900 dark:text-stone-100">
                      {user.department}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between py-2 border-b border-stone-100 dark:border-stone-800">
                  <span className="flex items-center gap-2 text-stone-500 dark:text-stone-400">
                    <Calendar className="w-3.5 h-3.5 text-teal-500" /> Ngày tham gia
                  </span>
                  <span className="font-bold text-stone-900 dark:text-stone-100">
                    {formattedCreated}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-stone-100 dark:border-stone-800">
                  <span className="flex items-center gap-2 text-stone-500 dark:text-stone-400">
                    <Clock className="w-3.5 h-3.5 text-orange-500" /> Đăng nhập gần nhất
                  </span>
                  <span className="font-bold text-stone-900 dark:text-stone-100">
                    {formattedLastLogin}
                  </span>
                </div>
              </div>

              {user.notes && (
                <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs">
                  <span className="font-bold text-amber-800 dark:text-amber-400 block mb-1">
                    Ghi chú quản trị:
                  </span>
                  <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                    {user.notes}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'classes' && (
            <div className="space-y-4 text-xs">
              <h4 className="font-bold text-stone-900 dark:text-stone-100">
                Danh sách lớp học liên quan
              </h4>
              {relatedLoading ? (
                <div className="space-y-2">
                  <div className="h-12 bg-stone-100 dark:bg-stone-800 rounded-xl animate-pulse" />
                  <div className="h-12 bg-stone-100 dark:bg-stone-800 rounded-xl animate-pulse" />
                </div>
              ) : relatedData.classes && relatedData.classes.length > 0 ? (
                <div className="space-y-2">
                  {relatedData.classes.map((cls: any, i: number) => {
                    const c = cls.classes || cls;
                    return (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-stone-50 dark:bg-[#181612] border border-stone-200 dark:border-stone-800 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-stone-900 dark:text-white">
                            {c.name || 'Lớp học'}
                          </p>
                          <p className="text-[10px] text-stone-400 mt-0.5">
                            Phòng: {c.room || 'Chưa xếp'} • Khối: {c.grade_level || 'N/A'}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          {cls.status || 'Đang học'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-stone-400 italic py-4">Chưa có lớp học nào được gán.</p>
              )}

              {/* Linked family members */}
              {relatedData.links && relatedData.links.length > 0 && (
                <div className="pt-3 border-t border-stone-200 dark:border-stone-800 space-y-2">
                  <h4 className="font-bold text-stone-900 dark:text-stone-100">
                    Thành viên gia đình liên kết
                  </h4>
                  {relatedData.links.map((link: any, i: number) => {
                    const profile = link.profiles;
                    return (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-stone-50 dark:bg-[#181612] border border-stone-200 dark:border-stone-800 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-stone-900 dark:text-white">
                            {profile?.full_name || 'Thành viên'}
                          </p>
                          <p className="text-[10px] text-stone-400 mt-0.5">
                            {link.relationship_type || 'Liên kết'} • {profile?.phone || profile?.email || ''}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-3">
              <h4 className="font-bold text-stone-900 dark:text-stone-100 text-xs">
                Nhật ký hoạt động gần đây
              </h4>
              {logsLoading ? (
                <div className="space-y-2">
                  <div className="h-10 bg-stone-100 dark:bg-stone-800 rounded-xl animate-pulse" />
                  <div className="h-10 bg-stone-100 dark:bg-stone-800 rounded-xl animate-pulse" />
                </div>
              ) : auditLogs.length > 0 ? (
                <div className="space-y-2 text-xs">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl bg-stone-50 dark:bg-[#181612] border border-stone-200 dark:border-stone-800"
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-stone-900 dark:text-stone-100">
                          {log.action}
                        </span>
                        <span className="text-[10px] text-stone-400">
                          {new Date(log.created_at).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-400 mt-0.5">
                        Tài nguyên: {log.resource_type}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-stone-400 italic text-xs py-4">Chưa có nhật ký hoạt động nào.</p>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-[#181612] flex items-center justify-between gap-2 shrink-0">
          <button
            onClick={() => onDelete(user)}
            className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa tài khoản</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onResetPassword(user)}
              className="px-3.5 py-2 rounded-xl bg-stone-200/80 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-blue-500" />
              <span>Đổi mật khẩu</span>
            </button>

            <button
              onClick={() => onEdit(user)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Chỉnh sửa</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
