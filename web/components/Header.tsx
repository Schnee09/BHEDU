'use client';

import React, { useState, useEffect, useMemo, memo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import ThemeToggle from './ThemeToggle';
import {
  UserPlusIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  ArrowDownTrayIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
} from '@heroicons/react/24/outline';
import { routes } from '@/lib/routes';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';
import { useCustomization } from '@/contexts/CustomizationContext';
import { useNotifications } from '@/hooks/useNotifications';
import { SearchModal } from './header/SearchModal';
import { NotificationsPanel } from './header/NotificationsPanel';
import { QuickActions } from './header/QuickActions';
import { UserMenu } from './header/UserMenu';

interface HeaderProps {
  profile: {
    id?: string;
    full_name?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    role?: string;
  } | null;
  onMenuToggle?: () => void;
  isMenuOpen?: boolean;
}

export default memo(function Header({ profile, onMenuToggle, isMenuOpen }: HeaderProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { accentColor } = useCustomization();
  const { can, isAdmin, isOwner, isStaff, isTeacher, isStudent, isParent } = usePermissions();
  const { notifications, unreadCount, markAllAsRead, markAsRead, deleteNotification } =
    useNotifications(profile?.id);

  const [openPanel, setOpenPanel] = useState<
    'notifications' | 'quickActions' | 'userMenu' | 'search' | null
  >(null);
  const showNotifications = openPanel === 'notifications';
  const showQuickActions = openPanel === 'quickActions';
  const showUserMenu = openPanel === 'userMenu';
  const showSearch = openPanel === 'search';

  // Dynamic Portal Title & Greetings
  const portalTitle = useMemo(() => {
    if (isAdmin) return { main: 'Hệ thống', sub: 'QUẢN TRỊ' };
    if (isOwner) return { main: 'Cổng quản lý', sub: 'CHỦ TRUNG TÂM' };
    if (isStaff) return { main: 'Cổng nội bộ', sub: 'NHÂN SỰ' };
    if (isTeacher) return { main: 'Cổng công cụ', sub: 'GIÁO VIÊN' };
    if (isParent) return { main: 'Cổng kết nối', sub: 'PHỤ HUYNH' };
    return { main: 'Cổng học tập', sub: 'HỌC SINH' };
  }, [isAdmin, isOwner, isStaff, isTeacher, isParent]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenPanel(null);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpenPanel((prev) => (prev === 'search' ? null : 'search'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const initials = useMemo(() => {
    if (profile?.last_name && profile?.first_name) {
      // Vietnamese initials: Surname[0] + GivenName[0]
      return `${profile.last_name[0]}${profile.first_name[0]}`.toUpperCase();
    }

    if (profile?.full_name) {
      const parts = profile.full_name.trim().split(/\s+/);
      if (parts.length >= 2) {
        // Fallback for full_name: First word[0] + Last word[0]
        const first = parts[0]?.[0] ?? '';
        const last = parts[parts.length - 1]?.[0] ?? '';
        return `${first}${last}`.toUpperCase();
      }
      return profile.full_name.substring(0, 2).toUpperCase();
    }
    return 'U';
  }, [profile]);

  const quickActions = useMemo(
    () =>
      [
        { label: 'Điểm danh', icon: CheckIcon, href: routes.attendance.list(), show: true },
        { label: 'Điểm của tôi', icon: ChartBarIcon, href: routes.grades.list(), show: isStudent },
        {
          label: 'Thêm học sinh',
          icon: UserPlusIcon,
          href: `${routes.students.list()}?action=add`,
          show: can('students.create'),
        },
        {
          label: 'Nhập điểm',
          icon: ClipboardDocumentListIcon,
          href: routes.grades.entry(),
          show: can('grades.entry'),
        },
        {
          label: 'Xem phân tích',
          icon: ChartBarIcon,
          href: routes.grades.analytics(),
          show: can('reports.view'),
        },
        {
          label: 'Nhập học sinh',
          icon: ArrowDownTrayIcon,
          href: routes.students.import(),
          show: can('users.bulk_import'),
        },
        {
          label: 'Kết nối con em',
          icon: UserPlusIcon,
          href: routes.parent.linkStudent(),
          show: isParent,
        },
      ].filter((action) => action.show),
    [isStudent, can, isParent]
  );

  return (
    <header className="sticky top-0 h-16 z-[100] overflow-visible shrink-0">
      <div className="absolute inset-0 bg-white/80 dark:bg-stone-950/80 backdrop-blur-xl border-b border-stone-200/60 dark:border-white/8" />
      <div className="relative w-full h-full flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-6 relative z-10 flex-1 min-w-0">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2.5 rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/30 hover:bg-amber-600 transition-all active:scale-95 flex items-center justify-center border border-amber-400/50"
          >
            {isMenuOpen ? (
              <XMarkIcon className="w-6 h-6 stroke-[2.5px]" />
            ) : (
              <Bars3Icon className="w-6 h-6 stroke-[2.5px]" />
            )}
          </button>

          <div
            className="flex flex-col group cursor-pointer shrink-0"
            onClick={() => router.push('/dashboard')}
          >
            <h1 className="text-base md:text-xl font-black tracking-tighter leading-none flex items-center gap-2 whitespace-nowrap">
              <span className="text-stone-900 dark:text-stone-100 font-serif italic transition-colors group-hover:text-amber-600 drop-shadow-sm">
                {portalTitle.main}
              </span>
              <span className="hidden md:inline-flex text-amber-600 dark:text-amber-500 bg-amber-500/10 px-2 py-1 rounded-xl text-[10px] border border-amber-500/20 font-black tracking-widest uppercase shadow-sm">
                {portalTitle.sub}
              </span>
            </h1>
            <div className="hidden lg:flex items-center gap-1.5 mt-2 opacity-30 group-hover:opacity-100 transition-opacity">
              <div className="h-0.5 w-6 bg-amber-500 rounded-full"></div>
              <p className="text-[8px] font-black uppercase tracking-[0.4em] text-stone-500 dark:text-stone-400">
                UNI-V DATA CORE
              </p>
            </div>
          </div>
        </div>

        {/* Central Search Bar - Desktop */}
        <div className="hidden lg:flex flex-1 justify-center px-8">
          <div className="relative group w-full max-w-[520px]">
            <button
              onClick={() => setOpenPanel('search')}
              className="flex items-center gap-4 px-6 h-12 w-full rounded-2xl transition-all duration-300 cursor-pointer relative overflow-hidden
              bg-stone-50/50 dark:bg-white/5 border border-stone-200/50 dark:border-white/5
              hover:border-amber-500/40 hover:bg-white dark:hover:bg-white/10 hover:shadow-md hover:scale-[1.01]
              text-stone-500 dark:text-stone-400 group-hover:text-amber-600 shadow-sm backdrop-blur-md"
            >
              <MagnifyingGlassIcon className="w-4 h-4 text-stone-400 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-xs font-black uppercase tracking-widest opacity-80 group-hover:opacity-100 transition-opacity">
                Truy vấn hệ thống...
              </span>
              <div className="ml-auto flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-[10px] bg-white dark:bg-black/20 border border-stone-200 dark:border-white/10 px-2 py-0.5 rounded-lg shadow-sm font-black text-stone-500 dark:text-stone-300 flex items-center gap-0.5">
                  <kbd>CTRL</kbd>+<kbd>K</kbd>
                </span>
              </div>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 md:gap-4 flex-1 min-w-0">
          <button
            onClick={() => setOpenPanel('search')}
            className="hidden md:block lg:hidden p-3 rounded-full bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-300 active:scale-95 hover:scale-105 transition-all border border-transparent hover:border-amber-500/20"
          >
            <MagnifyingGlassIcon className="w-5 h-5" strokeWidth={2.5} />
          </button>

          <div className="hidden md:block">
            <QuickActions
              isOpen={showQuickActions}
              onToggle={() => setOpenPanel(openPanel === 'quickActions' ? null : 'quickActions')}
              onClose={() => setOpenPanel(null)}
              actions={quickActions}
            />
          </div>

          <div className="relative group">
            <button
              onClick={() => setOpenPanel(openPanel === 'notifications' ? null : 'notifications')}
              className={cn(
                'w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer relative border',
                showNotifications
                  ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20 scale-105'
                  : 'bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-300 border-transparent hover:border-amber-500/30 hover:bg-white dark:hover:bg-white/10 hover:shadow-sm hover:scale-105'
              )}
            >
              <BellIcon
                className={cn(
                  'w-5 h-5 group-hover:animate-swing',
                  unreadCount > 0 && 'animate-subtle-pulse'
                )}
              />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 border-2 border-white dark:border-[#1A1410] rounded-full w-4 h-4 bg-red-500 text-[9px] font-black text-white flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <NotificationsPanel
              isOpen={showNotifications}
              onClose={() => setOpenPanel(null)}
              notifications={notifications}
              unreadCount={unreadCount}
              markAllAsRead={markAllAsRead}
              markAsRead={markAsRead}
              deleteNotification={deleteNotification}
            />
          </div>

          <div className="hidden sm:block">
            <div className="w-11 h-11 rounded-full bg-stone-100 dark:bg-white/5 border border-transparent hover:border-amber-500/30 hover:bg-white dark:hover:bg-white/10 hover:shadow-sm flex items-center justify-center hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden">
              <ThemeToggle />
            </div>
          </div>

          <UserMenu
            isOpen={showUserMenu}
            onToggle={() => setOpenPanel(openPanel === 'userMenu' ? null : 'userMenu')}
            onClose={() => setOpenPanel(null)}
            onLogout={handleLogout}
            profile={profile}
            initials={initials}
          />
        </div>

        <SearchModal isOpen={showSearch} onClose={() => setOpenPanel(null)} />
      </div>
    </header>
  );
});
