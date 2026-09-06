'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  Users,
  BookOpen,
  CalendarCheck,
  MoreHorizontal,
  X,
  GraduationCap,
  ClipboardList,
  Settings,
  Bell,
  Search,
  User,
  LogOut,
  Sun,
  Moon,
  Laptop,
  CheckCircle2,
  BarChart3,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProfile } from '@/hooks/useProfile';
import { useCustomization } from '@/contexts/CustomizationContext';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionCode } from '@/lib/auth/core';
import { createClient } from '@/lib/supabase/client';
import { apiFetch } from '@/lib/api/client';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useProfile();
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [badgeCounts, setBadgeCounts] = useState<{
    notifications?: number;
    pendingParentLinks?: number;
    classes?: number;
  }>({});
  const { theme, setTheme } = useCustomization();
  const { can, isAdmin, isOwner } = usePermissions();

  const role = profile?.role as string;

  // Auto-hide bottom nav when user is typing in form inputs or focused on input fields
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        setIsHidden(true);
      }
    };

    const handleFocusOut = () => {
      // Small timeout to prevent flickering during focus transition between inputs
      setTimeout(() => {
        const active = document.activeElement as HTMLElement | null;
        if (
          !active ||
          (active.tagName !== 'INPUT' &&
            active.tagName !== 'TEXTAREA' &&
            active.tagName !== 'SELECT' &&
            !active.isContentEditable)
        ) {
          setIsHidden(false);
        }
      }, 100);
    };

    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);

    return () => {
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  // Fetch real-time badge counts
  useEffect(() => {
    if (!profile) return;
    const fetchBadgeCounts = async () => {
      try {
        const res = await apiFetch('/api/sidebar/badge-counts');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.counts) {
            setBadgeCounts(data.counts);
          }
        }
      } catch {
        // Silently ignore
      }
    };

    fetchBadgeCounts();
    const interval = setInterval(fetchBadgeCounts, 120_000);
    return () => clearInterval(interval);
  }, [profile]);

  const handleLogout = async () => {
    setShowMoreMenu(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Primary 4 Tabs based on user role
  const mainNavItems = useMemo(() => {
    const items = [{ name: 'Trang chủ', href: '/dashboard', icon: Home, badge: 0 }];

    if (role === 'parent') {
      items.push(
        {
          name: 'Hồ sơ con',
          href: '/dashboard/parent',
          icon: GraduationCap,
          badge: badgeCounts.pendingParentLinks || 0,
        },
        { name: 'Lịch học', href: '/dashboard/calendar', icon: CalendarCheck, badge: 0 },
        { name: 'Điểm số', href: '/dashboard/grades', icon: ClipboardList, badge: 0 }
      );
    } else if (role === 'student') {
      items.push(
        { name: 'Điểm số', href: '/dashboard/grades', icon: GraduationCap, badge: 0 },
        { name: 'Lịch học', href: '/dashboard/my-schedule', icon: CalendarCheck, badge: 0 },
        { name: 'Lớp học', href: '/dashboard/classes', icon: BookOpen, badge: 0 }
      );
    } else if (role === 'teacher' || role === 'tutor') {
      items.push(
        { name: 'Lịch dạy', href: '/dashboard/my-schedule', icon: CalendarCheck, badge: 0 },
        { name: 'Điểm danh', href: '/dashboard/attendance', icon: CheckCircle2, badge: 0 },
        {
          name: 'Lớp học',
          href: '/dashboard/classes',
          icon: BookOpen,
          badge: 0,
        }
      );
    } else {
      // Admin/Staff/Super_admin default
      items.push(
        {
          name: 'Học sinh',
          href: '/dashboard/students',
          icon: Users,
          badge: badgeCounts.pendingParentLinks || 0,
        },
        {
          name: 'Lớp học',
          href: '/dashboard/classes',
          icon: BookOpen,
          badge: 0,
        },
        { name: 'Điểm danh', href: '/dashboard/attendance', icon: CheckCircle2, badge: 0 }
      );
    }

    return items;
  }, [role, badgeCounts]);

  // Extended More Services Menu
  const moreMenuItems = useMemo(() => {
    const items = [
      {
        name: 'Trang giới thiệu',
        href: '/',
        icon: Globe,
        desc: 'Cổng thông tin & tin tức công khai',
        badge: 0,
      },
      {
        name: 'Hồ sơ cá nhân',
        href: '/dashboard/profile',
        icon: User,
        desc: 'Thông tin tài khoản & bảo mật',
        badge: 0,
      },
      {
        name: 'Thông báo',
        href: '/dashboard/notifications',
        icon: Bell,
        desc: 'Tin tức & cập nhật trung tâm',
        badge: badgeCounts.notifications || 0,
      },
      {
        name: 'Thời khóa biểu',
        href: '/dashboard/timetable',
        icon: CalendarCheck,
        desc: 'Xem lịch tuần & phòng học',
        badge: 0,
        permission: 'timetable.view' as PermissionCode,
      },
      {
        name: 'Báo cáo & Điểm',
        href: '/dashboard/grades',
        icon: BarChart3,
        desc: 'Bảng điểm & thống kê học lực',
        badge: 0,
        permission: 'grades.view' as PermissionCode,
      },
      {
        name: 'Tìm kiếm',
        href: '/dashboard/search',
        icon: Search,
        desc: 'Tra cứu học sinh, lớp học',
        badge: 0,
      },
      {
        name: 'Cài đặt hệ thống',
        href: '/dashboard/settings',
        icon: Settings,
        desc: 'Cấu hình & quản trị',
        badge: 0,
        permission: 'system.settings' as PermissionCode,
      },
    ];

    return items.filter((item) => !item.permission || can(item.permission));
  }, [can, badgeCounts]);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname?.startsWith(href);
  };

  // Don't render on desktop viewports
  if (!profile) return null;

  return (
    <div className="lg:hidden">
      {/* More Services Bottom Sheet Overlay */}
      {showMoreMenu && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md animate-fade-in"
          onClick={() => setShowMoreMenu(false)}
          aria-hidden="true"
        />
      )}

      {/* More Services Bottom Sheet */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-[110] transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] px-3 pb-8 max-h-[85vh] overflow-y-auto',
          showMoreMenu ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        <div className="bg-white dark:bg-[#14120E] rounded-t-[32px] rounded-b-[24px] shadow-2xl pb-safe overflow-hidden border border-stone-200 dark:border-stone-800 relative">
          {/* Top handle bar */}
          <div className="flex justify-center pt-3.5 pb-2">
            <div className="w-12 h-1.5 bg-stone-300 dark:bg-stone-700 rounded-full" />
          </div>

          <button
            onClick={() => setShowMoreMenu(false)}
            className="absolute top-4 right-4 p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-white press-effect"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>

          {/* User Brief Card */}
          <div className="px-5 pt-2 pb-4 flex items-center gap-3 border-b border-stone-100 dark:border-stone-800">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold text-base shadow-sm shrink-0">
              {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm truncate">
                {profile?.full_name || 'Người dùng'}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                {profile?.email}
              </p>
            </div>
          </div>

          {/* Service Links Grid */}
          <div className="p-4 grid grid-cols-2 gap-2.5">
            {moreMenuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setShowMoreMenu(false)}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-2xl transition-all press-effect border relative overflow-hidden',
                  isActive(item.href)
                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                    : 'bg-stone-50 dark:bg-stone-900/60 text-stone-700 dark:text-stone-300 border-stone-200/70 dark:border-stone-800 hover:border-amber-500/20'
                )}
              >
                <div className="p-2 rounded-xl bg-white dark:bg-stone-800 text-amber-600 dark:text-amber-400 shadow-2xs shrink-0">
                  <item.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <span className="block text-xs font-bold truncate">{item.name}</span>
                  <span className="block text-[10px] text-stone-400 dark:text-stone-500 truncate">
                    {item.desc}
                  </span>
                </div>
                {item.badge > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Theme Quick Selector */}
          <div className="px-4 py-3 mx-4 mb-3 bg-stone-50 dark:bg-stone-900/60 rounded-2xl border border-stone-200/70 dark:border-stone-800 flex items-center justify-between">
            <span className="text-xs font-bold text-stone-600 dark:text-stone-300">Giao diện</span>
            <div className="flex items-center gap-1 bg-stone-200/70 dark:bg-stone-800 p-1 rounded-xl">
              <button
                onClick={() => setTheme('light')}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all',
                  theme === 'light'
                    ? 'bg-white dark:bg-stone-700 text-amber-600 shadow-2xs'
                    : 'text-stone-500 dark:text-stone-400'
                )}
              >
                <Sun className="w-3 h-3" /> Sáng
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all',
                  theme === 'dark'
                    ? 'bg-white dark:bg-stone-700 text-amber-500 shadow-2xs'
                    : 'text-stone-500 dark:text-stone-400'
                )}
              >
                <Moon className="w-3 h-3" /> Tối
              </button>
              <button
                onClick={() => setTheme('system')}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all',
                  theme === 'system'
                    ? 'bg-white dark:bg-stone-700 text-amber-500 shadow-2xs'
                    : 'text-stone-500 dark:text-stone-400'
                )}
              >
                <Laptop className="w-3 h-3" /> Auto
              </button>
            </div>
          </div>

          {/* Logout Button */}
          <div className="px-4 pb-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-bold text-xs border border-rose-200 dark:border-rose-900/40 press-effect"
            >
              <LogOut className="w-4 h-4" />
              <span>Đăng xuất tài khoản</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Bottom Navigation Pill Bar */}
      <div
        className={cn(
          'fixed bottom-4 left-3 right-3 z-[90] transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]',
          isHidden ? 'translate-y-28 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
        )}
      >
        <nav className="h-[62px] w-full rounded-2xl bg-white/95 dark:bg-[#14120E]/95 backdrop-blur-xl shadow-xl shadow-stone-900/10 dark:shadow-black/40 border border-stone-200/90 dark:border-stone-800 flex items-center justify-around px-1">
          {mainNavItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex flex-col items-center justify-center flex-1 h-full py-1 transition-all press-effect',
                  active
                    ? 'text-amber-600 dark:text-amber-500 font-bold'
                    : 'text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
                )}
              >
                <div
                  className={cn(
                    'p-1 rounded-xl transition-all duration-300 relative',
                    active ? 'bg-amber-500/10 scale-105' : 'bg-transparent'
                  )}
                >
                  <item.icon
                    className={cn('w-5 h-5', active ? 'stroke-[2.25px]' : 'stroke-[1.75px]')}
                  />
                  {item.badge > 0 && (
                    <span className="absolute -top-1 -right-1.5 min-w-[15px] h-[15px] px-1 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-stone-900 leading-none">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold tracking-tight mt-0.5 leading-snug select-none text-center truncate max-w-[68px]">
                  {item.name}
                </span>

                {active && <div className="absolute bottom-1 w-1 h-1 rounded-full bg-amber-500" />}
              </Link>
            );
          })}

          {/* More / Services Button */}
          <button
            onClick={() => setShowMoreMenu(true)}
            className={cn(
              'relative flex flex-col items-center justify-center flex-1 h-full py-1 transition-all press-effect',
              showMoreMenu
                ? 'text-amber-600 dark:text-amber-500 font-bold'
                : 'text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
            )}
            aria-label="Xem thêm dịch vụ"
          >
            <div
              className={cn(
                'p-1 rounded-xl transition-all duration-300 relative',
                showMoreMenu ? 'bg-amber-500/10 scale-105' : 'bg-transparent'
              )}
            >
              <MoreHorizontal className="w-5 h-5 stroke-[2px]" />
              {(badgeCounts.notifications || 0) > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-stone-900" />
              )}
            </div>
            <span className="text-[10px] font-bold tracking-tight mt-0.5 leading-snug select-none">
              Thêm
            </span>
          </button>
        </nav>
      </div>
    </div>
  );
}
