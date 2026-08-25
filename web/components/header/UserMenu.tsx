'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  User,
  Settings,
  Shield,
  LogOut,
  KeyRound,
  Activity,
  Moon,
  Sun,
  Laptop,
  X,
  Globe,
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useCustomization } from '@/contexts/CustomizationContext';
import { cn } from '@/lib/utils';

interface UserProfile {
  id?: string;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  role?: string;
  avatar_url?: string | null;
  photo_url?: string | null;
}

interface UserMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onLogout: () => void;
  profile: UserProfile | null;
  initials: string;
}

export function UserMenu({
  isOpen,
  onToggle,
  onClose,
  onLogout,
  profile,
  initials,
}: UserMenuProps) {
  const { can, isAdmin, isOwner } = usePermissions();
  const { theme, setTheme } = useCustomization();
  const [imgError, setImgError] = useState(false);

  const avatarSrc = profile?.photo_url || profile?.avatar_url || null;

  // Reset img error if avatarSrc changes
  useEffect(() => {
    setImgError(false);
  }, [avatarSrc]);

  const roleLabel =
    profile?.role === 'super_admin'
      ? 'Quản trị Hệ thống'
      : profile?.role === 'owner'
        ? 'Chủ trung tâm'
        : profile?.role === 'admin'
          ? 'Quản trị viên'
          : profile?.role === 'teacher'
            ? 'Giáo viên'
            : profile?.role === 'tutor'
              ? 'Gia sư'
              : profile?.role === 'parent'
                ? 'Phụ huynh'
                : profile?.role === 'student'
                  ? 'Học sinh'
                  : 'Người dùng';

  return (
    <div className="relative font-['Be_Vietnam_Pro']">
      {/* Trigger Button - Optimized for Mobile & Desktop */}
      <button
        onClick={onToggle}
        className="flex items-center gap-2.5 p-1 md:pr-3.5 rounded-2xl transition-all duration-200 cursor-pointer group
        bg-stone-100 dark:bg-[#1C1A16] border border-stone-200/80 dark:border-stone-800 hover:border-amber-500/50 hover:bg-stone-50 dark:hover:bg-[#25221D] hover:shadow-xs active:scale-95"
        aria-label="Tài khoản cá nhân"
      >
        <div className="relative p-0.5">
          {/* Metric Ring */}
          <svg
            className="absolute inset-0 w-full h-full -rotate-90 transform"
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-stone-200 dark:text-stone-800"
            />
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="url(#avatar-gradient)"
              strokeWidth="6"
              strokeDasharray="289"
              strokeDashoffset={0}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="avatar-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>
            </defs>
          </svg>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs md:text-sm relative z-10 shadow-xs overflow-hidden bg-gradient-to-br from-amber-500 to-amber-600">
            {avatarSrc && !imgError ? (
              <img
                src={avatarSrc}
                alt={profile?.full_name || 'User avatar'}
                onError={() => setImgError(true)}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#1C1A16] bg-emerald-500 z-20" />
        </div>
        <div className="text-left hidden md:block min-w-0">
          <p className="text-xs font-bold text-stone-900 dark:text-white leading-none mb-1 group-hover:text-amber-600 transition-colors truncate max-w-[120px]">
            {profile?.first_name || profile?.full_name?.split(/\s+/).pop() || 'Tài khoản'}
          </p>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <p className="text-[9px] text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider truncate max-w-[100px]">
              {roleLabel}
            </p>
          </div>
        </div>
      </button>

      {/* Dropdown / Bottom Sheet Modal */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-xs md:bg-transparent md:backdrop-blur-none"
            onClick={onClose}
          />

          {/* Menu Container: Dropdown on desktop, Slide-up sheet on mobile */}
          <div
            className="fixed md:absolute bottom-0 md:bottom-auto md:top-full left-0 md:left-auto right-0 mt-0 md:mt-3 w-full md:w-80 z-[110] overflow-hidden rounded-t-[32px] md:rounded-3xl animate-scale-in md:origin-top-right
            bg-white dark:bg-[#14120E] border-t md:border-2 border-stone-200 dark:border-stone-800 shadow-2xl space-y-1 pb-safe md:pb-0 max-h-[85vh] overflow-y-auto"
          >
            {/* Mobile close bar */}
            <div className="flex md:hidden justify-center pt-3 pb-1">
              <div className="w-12 h-1 bg-stone-300 dark:bg-stone-700 rounded-full" />
            </div>

            {/* Header info */}
            <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-[#1A1814] relative">
              <button
                onClick={onClose}
                className="md:hidden absolute top-4 right-4 p-1.5 rounded-xl bg-stone-200/60 dark:bg-stone-800 text-stone-500"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-xs overflow-hidden bg-gradient-to-br from-amber-500 to-amber-600 shrink-0">
                  {avatarSrc && !imgError ? (
                    <img
                      src={avatarSrc}
                      alt={profile?.full_name || 'User avatar'}
                      onError={() => setImgError(true)}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-black text-sm text-stone-950 dark:text-white tracking-tight truncate">
                    {profile?.full_name || 'Người dùng BH-EDU'}
                  </p>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
                    {profile?.email}
                  </p>
                  <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    {roleLabel}
                  </div>
                </div>
              </div>
            </div>

            {/* Account section */}
            <div className="p-2 space-y-0.5 bg-white dark:bg-[#14120E]">
              <p className="px-3 text-[10px] font-black uppercase tracking-widest text-stone-400">
                Chuyển trang & Tài khoản
              </p>
              <Link
                href="/"
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-stone-100 dark:hover:bg-[#1F1C17] transition-all text-xs font-bold text-stone-800 dark:text-stone-200 group press-effect"
              >
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  <Globe className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col">
                  <span>Trang giới thiệu (Landing Page)</span>
                  <span className="text-[9.5px] text-stone-400 font-normal">
                    Cổng thông tin & tin tức công khai
                  </span>
                </div>
              </Link>

              <Link
                href="/dashboard/profile"
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-stone-100 dark:hover:bg-[#1F1C17] transition-all text-xs font-bold text-stone-800 dark:text-stone-200 group press-effect"
              >
                <div className="p-2 rounded-xl bg-stone-100 dark:bg-[#221F19] group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  <User className="w-3.5 h-3.5" />
                </div>
                <span>Hồ sơ cá nhân</span>
              </Link>

              <Link
                href="/dashboard/profile?tab=security"
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-stone-100 dark:hover:bg-[#1F1C17] transition-all text-xs font-bold text-stone-800 dark:text-stone-200 group press-effect"
              >
                <div className="p-2 rounded-xl bg-stone-100 dark:bg-[#221F19] group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  <KeyRound className="w-3.5 h-3.5" />
                </div>
                <span>Bảo mật & Đổi mật khẩu</span>
              </Link>
            </div>

            {/* System Settings section */}
            {(isAdmin || isOwner || can('system.settings')) && (
              <div className="p-2 border-t border-stone-200 dark:border-stone-800 space-y-0.5 bg-white dark:bg-[#14120E]">
                <p className="px-3 text-[10px] font-black uppercase tracking-widest text-stone-400">
                  Quản trị & Cấu hình
                </p>
                <Link
                  href="/dashboard/settings"
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-stone-100 dark:hover:bg-[#1F1C17] transition-all text-xs font-bold text-stone-800 dark:text-stone-200 group press-effect"
                >
                  <div className="p-2 rounded-xl bg-stone-100 dark:bg-[#221F19] group-hover:bg-amber-500 group-hover:text-white transition-colors">
                    <Settings className="w-3.5 h-3.5" />
                  </div>
                  <span>Cài đặt trung tâm</span>
                </Link>

                {can('permissions.manage') && (
                  <Link
                    href="/dashboard/admin/permissions"
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-stone-100 dark:hover:bg-[#1F1C17] transition-all text-xs font-bold text-stone-800 dark:text-stone-200 group press-effect"
                  >
                    <div className="p-2 rounded-xl bg-stone-100 dark:bg-[#221F19] group-hover:bg-amber-500 group-hover:text-white transition-colors">
                      <Shield className="w-3.5 h-3.5" />
                    </div>
                    <span>Phân quyền & Vai trò</span>
                  </Link>
                )}

                {can('system.settings') && (
                  <Link
                    href="/dashboard/admin/health"
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-stone-100 dark:hover:bg-[#1F1C17] transition-all text-xs font-bold text-stone-800 dark:text-stone-200 group press-effect"
                  >
                    <div className="p-2 rounded-xl bg-stone-100 dark:bg-[#221F19] group-hover:bg-amber-500 group-hover:text-white transition-colors">
                      <Activity className="w-3.5 h-3.5" />
                    </div>
                    <span>Giám sát hệ thống</span>
                  </Link>
                )}
              </div>
            )}

            {/* Quick theme selector */}
            <div className="p-3 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-[#1A1814]">
              <div className="flex items-center justify-between px-2 mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">
                  Giao diện
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 bg-stone-200/70 dark:bg-stone-900 p-1 rounded-2xl">
                <button
                  onClick={() => setTheme('light')}
                  className={cn(
                    'py-1.5 px-2 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all',
                    theme === 'light'
                      ? 'bg-white dark:bg-stone-800 text-amber-600 dark:text-amber-400 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white'
                  )}
                >
                  <Sun className="w-3 h-3" /> Sáng
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={cn(
                    'py-1.5 px-2 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all',
                    theme === 'dark'
                      ? 'bg-white dark:bg-stone-800 text-amber-600 dark:text-amber-400 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white'
                  )}
                >
                  <Moon className="w-3 h-3" /> Tối
                </button>
                <button
                  onClick={() => setTheme('system')}
                  className={cn(
                    'py-1.5 px-2 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all',
                    theme === 'system'
                      ? 'bg-white dark:bg-stone-800 text-amber-600 dark:text-amber-400 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white'
                  )}
                >
                  <Laptop className="w-3 h-3" /> Auto
                </button>
              </div>
            </div>

            {/* Logout button */}
            <div className="p-2 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-[#14120E]">
              <button
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-rose-500/10 transition-all text-xs font-bold text-rose-600 dark:text-rose-400 group press-effect"
              >
                <div className="p-2 rounded-xl bg-rose-500/10 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                  <LogOut className="w-3.5 h-3.5" />
                </div>
                <span>Đăng xuất tài khoản</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
