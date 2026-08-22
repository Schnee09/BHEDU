'use client';

import React, { useRef, useState, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { getRoleBadgeClass, getRoleLabel } from '@/lib/role-utils';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/useToast';
import { Camera, Trash2, Lock, Building2, Calendar, Mail, Hash, Copy, Check, AlertCircle } from 'lucide-react';

interface ProfileSidebarProps {
  profile: any;
  onPasswordChangeClick: () => void;
  refreshProfile: () => Promise<void>;
}

const ROLE_AVATAR_GRADIENT: Record<string, string> = {
  super_admin: 'from-slate-700 to-slate-900',
  admin:       'from-violet-600 to-indigo-700',
  teacher:     'from-blue-500 to-cyan-600',
  student:     'from-emerald-500 to-teal-600',
  parent:      'from-amber-500 to-orange-500',
  tutor:       'from-rose-500 to-pink-600',
};

// Profile completeness: which fields count and their labels
const COMPLETENESS_FIELDS = [
  { key: 'full_name',       label: 'Họ và tên' },
  { key: 'photo_url',      label: 'Ảnh đại diện' },
  { key: 'phone',          label: 'Số điện thoại' },
  { key: 'date_of_birth',  label: 'Ngày sinh' },
  { key: 'address',        label: 'Địa chỉ' },
  { key: 'personal_email', label: 'Email cá nhân' },
];

function useCopyField() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = useCallback((key: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1800);
    });
  }, []);
  return { copied, copy };
}

export default function ProfileSidebar({ profile, onPasswordChangeClick, refreshProfile }: ProfileSidebarProps) {
  const toast = useToast();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { copied, copy } = useCopyField();

  React.useEffect(() => {
    setImgError(false);
    setPreviewUrl(null);
  }, [profile?.photo_url]);

  // 3-D tilt
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sxSpring = useSpring(mx, { stiffness: 200, damping: 25 });
  const sySpring = useSpring(my, { stiffness: 200, damping: 25 });
  const rotateX = useTransform(sySpring, [-0.5, 0.5], ['8deg', '-8deg']);
  const rotateY = useTransform(sxSpring, [-0.5, 0.5], ['-8deg', '8deg']);
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const handleMouseLeave = () => { mx.set(0); my.set(0); };

  // Avatar upload via Server Endpoint with instant optimistic preview
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Định dạng không hợp lệ', 'Vui lòng chọn file hình ảnh (PNG, JPG, WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File quá lớn', 'Vui lòng chọn ảnh dưới 5MB.');
      return;
    }

    // Instant local preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setImgError(false);
    setUploading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi tải ảnh lên máy chủ');
      }

      await refreshProfile();
      toast.success('Thành công', 'Đã cập nhật ảnh đại diện vào hệ thống.');
    } catch (err: any) {
      setPreviewUrl(null);
      toast.error('Lỗi tải ảnh', err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    if (!profile?.photo_url && !previewUrl) return;
    setRemoving(true);
    setPreviewUrl(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch('/api/profile/avatar', {
        method: 'DELETE',
        headers,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi gỡ ảnh đại diện');
      }

      await refreshProfile();
      toast.success('Đã xoá ảnh', 'Ảnh đại diện đã được gỡ bỏ khỏi hệ thống.');
    } catch (err: any) {
      toast.error('Lỗi', err.message);
    } finally {
      setRemoving(false);
    }
  };

  // Completeness
  const filledFields = COMPLETENESS_FIELDS.filter(f => {
    const v = profile?.[f.key];
    return v && String(v).trim().length > 0;
  });
  const completeness = Math.round((filledFields.length / COMPLETENESS_FIELDS.length) * 100);
  const missingFields = COMPLETENESS_FIELDS.filter(f => {
    const v = profile?.[f.key];
    return !v || String(v).trim().length === 0;
  });

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).slice(-2).join('').toUpperCase()
    : '?';
  const avatarGradient = ROLE_AVATAR_GRADIENT[profile?.role] ?? 'from-stone-500 to-stone-700';
  const joinDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : null;

  // ── Role-aware identifier & unit ─────────────────────────────────
  const roleRows = (() => {
    const role = profile?.role as string | undefined;
    const teacherDept =
      profile?.teacher_profiles?.[0]?.department ||
      profile?.teacher_profiles?.department ||
      profile?.department || null;

    switch (role) {
      case 'student':
        return {
          identifier: {
            label: 'Mã học sinh',
            value: profile?.student_code || profile?.student_id || null,
            copyKey: 'student_code',
            copyValue: profile?.student_code || profile?.student_id || null,
          },
          unit: {
            label: 'Khối / Lớp',
            value: profile?.grade_level || null,
          },
        };
      case 'teacher':
      case 'tutor':
        return {
          identifier: {
            label: 'Mã giáo viên',
            value: profile?.teacher_code || null,
            copyKey: 'teacher_code',
            copyValue: profile?.teacher_code || null,
          },
          unit: {
            label: 'Tổ / Bộ môn',
            value: teacherDept || null,
          },
        };
      case 'parent':
        return {
          identifier: {
            label: 'Mã phụ huynh',
            value: profile?.id?.slice(0, 8).toUpperCase() || null,
            copyKey: 'parent_id',
            copyValue: profile?.id || null,
          },
          unit: {
            label: 'Vai trò',
            value: 'Phụ huynh học sinh',
          },
        };
      case 'admin':
        return {
          identifier: {
            label: 'Mã quản trị',
            value: profile?.id?.slice(0, 8).toUpperCase() || null,
            copyKey: 'admin_id',
            copyValue: profile?.id || null,
          },
          unit: { label: 'Đơn vị', value: 'BH-EDU Việt Nam' },
        };
      case 'super_admin':
        return {
          identifier: {
            label: 'Mã hệ thống',
            value: profile?.id?.slice(0, 8).toUpperCase() || null,
            copyKey: 'sysadmin_id',
            copyValue: profile?.id || null,
          },
          unit: { label: 'Đơn vị', value: 'BH-EDU Việt Nam' },
        };
      default:
        return {
          identifier: {
            label: 'Mã định danh',
            value: profile?.id?.slice(0, 8).toUpperCase() || null,
            copyKey: 'id',
            copyValue: profile?.id || null,
          },
          unit: { label: 'Đơn vị', value: 'BH-EDU Việt Nam' },
        };
    }
  })();

  const infoRows: { icon: any; label: string; value: string | null; copyKey?: string; copyValue?: string | null }[] = [
    {
      icon: Hash,
      label: roleRows.identifier.label,
      value: roleRows.identifier.value,
      copyKey: roleRows.identifier.copyKey,
      copyValue: roleRows.identifier.copyValue,
    },
    {
      icon: Building2,
      label: roleRows.unit.label,
      value: roleRows.unit.value,
      copyKey: undefined,
      copyValue: null,
    },
    {
      icon: Calendar,
      label: 'Gia nhập',
      value: joinDate,
      copyKey: undefined,
      copyValue: null,
    },
    {
      icon: Mail,
      label: 'Email',
      value: profile?.email || null,
      copyValue: profile?.email || null,
      copyKey: 'email',
    },
  ];

  const completenessColor =
    completeness === 100 ? 'bg-emerald-500'
    : completeness >= 60  ? 'bg-amber-400'
    : 'bg-red-400';

  return (
    <aside className="w-full lg:w-[270px] xl:w-[300px] flex-shrink-0 flex flex-col border-r border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 min-h-screen">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      {/* ── Avatar ── */}
      <div className="flex flex-col items-center gap-4 px-7 pt-10 pb-7 border-b border-stone-200 dark:border-stone-800">
        <motion.div
          style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className="relative cursor-pointer group"
        >
          <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-md ring-2 ring-white dark:ring-stone-800 ring-offset-1 ring-offset-stone-50 dark:ring-offset-stone-950">
            {(previewUrl || profile?.photo_url) && !imgError ? (
              <img
                src={previewUrl || profile?.photo_url}
                alt={profile?.full_name || 'Ảnh đại diện'}
                onError={() => setImgError(true)}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className={cn('w-full h-full bg-gradient-to-br flex items-center justify-center', avatarGradient)}>
                <span className="text-2xl font-bold text-white tracking-tight select-none">{initials}</span>
              </div>
            )}
          </div>
          <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            {uploading
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Camera className="w-4 h-4 text-white" />}
          </div>
        </motion.div>

        <div className="text-center space-y-2">
          <h2 className="text-[15px] font-bold text-stone-900 dark:text-stone-100 leading-tight tracking-tight">
            {profile?.full_name || 'Chưa đặt tên'}
          </h2>
          <span className={cn(
            'inline-flex items-center px-2.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-[0.1em]',
            getRoleBadgeClass(profile?.role)
          )}>
            {getRoleLabel(profile?.role)}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-200/80 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-[11px] font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5 text-amber-500" />
            {uploading ? 'Đang tải...' : 'Đổi ảnh'}
          </button>

          {(profile?.photo_url || previewUrl) && (
            <button
              onClick={handleRemovePhoto}
              disabled={removing || uploading}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 text-[11px] font-bold transition-all active:scale-95 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              {removing ? 'Đang gỡ...' : 'Gỡ ảnh'}
            </button>
          )}
        </div>
      </div>

      {/* ── Profile completeness ── */}
      <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
            Độ hoàn thiện hồ sơ
          </span>
          <span className={cn(
            'text-[10px] font-bold tabular-nums',
            completeness === 100 ? 'text-emerald-500' : completeness >= 60 ? 'text-amber-500' : 'text-red-400'
          )}>
            {completeness}%
          </span>
        </div>

        {/* Bar */}
        <div className="h-1.5 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
          <motion.div
            className={cn('h-full rounded-full', completenessColor)}
            initial={{ width: 0 }}
            animate={{ width: `${completeness}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>

        {/* Missing fields hint */}
        {missingFields.length > 0 && (
          <div className="mt-2.5 flex items-start gap-1.5">
            <AlertCircle className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-stone-400 dark:text-stone-500 leading-snug">
              Còn thiếu:{' '}
              <span className="text-stone-600 dark:text-stone-400 font-medium">
                {missingFields.map(f => f.label).join(', ')}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* ── Info rows with copy ── */}
      <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 space-y-0">
        {infoRows.map((row) => (
          <div key={row.label} className="flex items-start gap-3 py-2.5 group/row">
            <row.icon className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500 mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-0.5">
                {row.label}
              </p>
              {row.value ? (
                <p className="text-xs font-medium text-stone-700 dark:text-stone-300 break-all leading-snug">
                  {row.value}
                </p>
              ) : (
                <p className="text-xs text-stone-300 dark:text-stone-600 italic">Chưa có thông tin</p>
              )}
            </div>

            {/* Copy button — only for copyable fields that have a value */}
            {row.copyKey && row.copyValue && (
              <button
                onClick={() => copy(row.copyKey!, row.copyValue!)}
                className="opacity-0 group-hover/row:opacity-100 transition-opacity flex-shrink-0 mt-0.5 p-1 rounded hover:bg-stone-200 dark:hover:bg-stone-800"
                title={`Sao chép ${row.label.toLowerCase()}`}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {copied === row.copyKey ? (
                    <motion.span key="check" initial={{ scale: 0.7 }} animate={{ scale: 1 }} exit={{ scale: 0.7 }}>
                      <Check className="w-3 h-3 text-emerald-500" />
                    </motion.span>
                  ) : (
                    <motion.span key="copy" initial={{ scale: 0.7 }} animate={{ scale: 1 }} exit={{ scale: 0.7 }}>
                      <Copy className="w-3 h-3 text-stone-400" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* ── Actions ── */}
      <div className="px-6 py-5">
        <button
          onClick={onPasswordChangeClick}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-[11px] font-semibold text-stone-600 dark:text-stone-400 hover:border-stone-400 dark:hover:border-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-all"
        >
          <Lock className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
          Thay đổi mật khẩu
        </button>
      </div>
    </aside>
  );
}
