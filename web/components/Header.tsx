'use client';

import React, { useState, useEffect, useMemo, memo } from 'react';
import Image from 'next/image';
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
  AcademicCapIcon,
  BanknotesIcon,
  MegaphoneIcon,
  BookOpenIcon,
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
    avatar_url?: string | null;
    photo_url?: string | null;
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
    if (isAdmin) return { main: 'Cổng Quản trị', sub: 'HỆ THỐNG' };
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
        // Học vụ & Đào tạo
        {
          label: 'Thêm học sinh mới',
          sub: 'Tạo hồ sơ và mã học sinh',
          category: 'Học vụ & Đào tạo',
          icon: UserPlusIcon,
          href: `${routes.students.list()}?action=add`,
          show: can('students.create'),
        },
        {
          label: 'Tạo lớp học mới',
          sub: 'Thêm lớp và phân công giáo viên',
          category: 'Học vụ & Đào tạo',
          icon: AcademicCapIcon,
          href: `${routes.classes.list()}`,
          show: can('classes.create'),
        },
        {
          label: 'Điểm danh hôm nay',
          sub: 'Ghi nhận chuyên cần lớp học',
          category: 'Học vụ & Đào tạo',
          icon: CheckIcon,
          href: routes.attendance.list(),
          show: can('attendance.mark') || isTeacher || isAdmin || isOwner,
        },
        {
          label: 'Nhập điểm học tập',
          sub: 'Vào điểm thi và kiểm tra',
          category: 'Học vụ & Đào tạo',
          icon: ClipboardDocumentListIcon,
          href: routes.grades.entry(),
          show: can('grades.entry'),
        },
        {
          label: 'Nhập học sinh từ Excel',
          sub: 'Tải danh sách hàng loạt',
          category: 'Học vụ & Đào tạo',
          icon: ArrowDownTrayIcon,
          href: routes.students.import(),
          show: can('users.bulk_import'),
        },

        // Tài chính & Học phí
        {
          label: 'Lập hóa đơn học phí',
          sub: 'Tạo phiếu thu học phí mới',
          category: 'Tài chính & Học phí',
          icon: BanknotesIcon,
          href: '/dashboard/finance',
          show: can('finance.manage') || isAdmin || isOwner,
        },

        // Dạy kèm & Tương tác
        {
          label: 'Đăng thông báo trung tâm',
          sub: 'Gửi tin tức đến toàn trường',
          category: 'Tương tác & Lịch dạy',
          icon: MegaphoneIcon,
          href: '/dashboard/admin/announcements',
          show: can('announcements.manage') || isAdmin || isOwner,
        },
        {
          label: 'Lịch dạy kèm Gia sư',
          sub: 'Đặt lịch và theo dõi kèm 1-1',
          category: 'Tương tác & Lịch dạy',
          icon: BookOpenIcon,
          href: '/dashboard/tutoring/schedule',
          show: can('tutoring.sessions.view') || isTeacher,
        },

        // Dành cho Học sinh / Phụ huynh
        {
          label: 'Bảng điểm của tôi',
          sub: 'Xem điểm và đánh giá học lực',
          category: 'Cá nhân',
          icon: ChartBarIcon,
          href: routes.grades.list(),
          show: isStudent,
        },
        {
          label: 'Kết nối hồ sơ con em',
          sub: 'Liên kết mã học sinh con',
          category: 'Cá nhân',
          icon: UserPlusIcon,
          href: routes.parent.linkStudent(),
          show: isParent,
        },
      ].filter((action) => action.show),
    [isStudent, can, isParent, isTeacher, isAdmin, isOwner]
  );

  return (
    <header className="sticky top-0 h-16 z-[100] overflow-visible shrink-0 bg-white dark:bg-[#12110E] border-b border-stone-200 dark:border-stone-800 shadow-xs transition-colors duration-200">
      <div className="relative w-full h-full flex items-center justify-between px-3 sm:px-4 md:px-6 gap-2">
        {/* Left Section: Mobile Menu + Brand / Portal Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <button
            onClick={onMenuToggle}
            aria-label="Mở menu"
            className="lg:hidden p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-all active:scale-95 flex items-center justify-center border border-stone-200/80 dark:border-stone-700 shrink-0"
          >
            {isMenuOpen ? (
              <XMarkIcon className="w-5 h-5 stroke-[2.5px]" />
            ) : (
              <Bars3Icon className="w-5 h-5 stroke-[2.5px]" />
            )}
          </button>

          <div
            className="flex items-center gap-2 sm:gap-3 group cursor-pointer min-w-0"
            onClick={() => router.push('/dashboard')}
          >
            <div className="relative w-8 h-8 rounded-lg bg-stone-100 dark:bg-[#1C1A16] border border-stone-200 dark:border-stone-800 p-0.5 flex items-center justify-center shrink-0 lg:hidden overflow-hidden shadow-xs group-hover:scale-105 transition-transform">
              <Image
                src="/logo.png"
                alt="BH-EDU Logo"
                fill
                sizes="32px"
                className="object-contain p-0.5 drop-shadow-xs"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <h1 className="text-sm sm:text-base md:text-xl font-bold tracking-tight leading-none flex items-center gap-1.5">
                <span className="text-stone-900 dark:text-stone-100 font-serif italic whitespace-nowrap transition-colors group-hover:text-amber-600">
                  {portalTitle.main}
                </span>
                <span className="hidden md:inline-flex text-amber-600 dark:text-amber-500 bg-amber-500/10 px-2 py-1 rounded-xl text-[10px] border border-amber-500/20 font-black tracking-wider uppercase shadow-xs shrink-0">
                  {portalTitle.sub}
                </span>
              </h1>
              <div className="hidden lg:flex items-center gap-1.5 mt-1 opacity-40 group-hover:opacity-100 transition-opacity">
                <div className="h-0.5 w-4 bg-amber-500 rounded-full"></div>
                <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">
                  BH-EDU CORE SYSTEM
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Central Search Bar - Desktop Only */}
        <div className="hidden lg:flex flex-1 justify-center px-8">
          <div className="relative group w-full max-w-[520px]">
            <button
              onClick={() => setOpenPanel('search')}
              className="flex items-center gap-4 px-6 h-11 w-full rounded-2xl transition-all duration-200 cursor-pointer relative
              bg-stone-100/90 dark:bg-[#1C1A16] border border-stone-200 dark:border-stone-800
              hover:border-amber-500/50 hover:bg-white dark:hover:bg-[#25221D] hover:shadow-xs
              text-stone-600 dark:text-stone-300 group-hover:text-amber-600 shadow-xs"
            >
              <MagnifyingGlassIcon className="w-4 h-4 text-stone-400 group-hover:scale-110 transition-transform duration-200" />
              <span className="text-xs font-black uppercase tracking-widest opacity-80 group-hover:opacity-100 transition-opacity">
                Truy vấn hệ thống...
              </span>
              <div className="ml-auto flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity duration-200">
                <span className="text-[10px] bg-white dark:bg-[#12110E] border border-stone-200 dark:border-stone-800 px-2 py-0.5 rounded-lg shadow-xs font-black text-stone-500 dark:text-stone-300 flex items-center gap-0.5">
                  <kbd>CTRL</kbd>+<kbd>K</kbd>
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Right Section: Actions + Bell + Theme + User Menu */}
        <div className="flex items-center justify-end gap-2 sm:gap-3 md:gap-4 shrink-0">
          <button
            onClick={() => setOpenPanel('search')}
            aria-label="Tìm kiếm"
            className="hidden md:block lg:hidden p-2.5 rounded-xl bg-stone-100 dark:bg-[#1C1A16] text-stone-600 dark:text-stone-300 active:scale-95 hover:scale-105 transition-all border border-stone-200/80 dark:border-stone-800 hover:border-amber-500/30"
          >
            <MagnifyingGlassIcon className="w-4 h-4" strokeWidth={2.5} />
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
              aria-label="Thông báo"
              className={cn(
                'w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer relative border shrink-0',
                showNotifications
                  ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20 scale-105'
                  : 'bg-stone-100 dark:bg-[#1C1A16] text-stone-600 dark:text-stone-300 border-stone-200/80 dark:border-stone-800 hover:border-amber-500/30 hover:bg-stone-50 dark:hover:bg-[#25221D] hover:shadow-xs'
              )}
            >
              <BellIcon
                className={cn(
                  'w-4 h-4 sm:w-5 sm:h-5 group-hover:animate-swing',
                  unreadCount > 0 && 'animate-subtle-pulse'
                )}
              />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 border-2 border-white dark:border-[#12110E] rounded-full w-3.5 h-3.5 bg-red-500 text-[8px] font-black text-white flex items-center justify-center">
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
            <ThemeToggle />
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
