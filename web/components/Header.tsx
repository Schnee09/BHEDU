"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import { CheckIcon, UserPlusIcon, ClipboardDocumentListIcon, ChartBarIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { routes } from "@/lib/routes";

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  read?: boolean;
  created_at: string;
}

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

export default function Header({ profile, onMenuToggle, isMenuOpen }: HeaderProps) {
  const router = useRouter();
  const supabase = createClient();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close all dropdowns
      if (e.key === "Escape") {
        setShowSearch(false);
        setShowNotifications(false);
        setShowQuickActions(false);
        setShowUserMenu(false);
      }

      // Ctrl/Cmd + K to open search
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setShowSearch(prev => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch notifications from database
  const fetchNotifications = useCallback(async () => {
    // Use profile.id since notifications.user_id references profiles(id)
    if (!profile?.id) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      // Fetch notifications from database using profile ID
      const { data, error } = await supabase
        .from('notifications')
        .select('id, title, message, is_read, created_at')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) {
        // Table might not exist yet - use welcome fallback
        const fallbackNotifications: Notification[] = [{
          id: 'welcome',
          user_id: profile.id,
          title: 'Chào mừng!',
          message: 'Chào mừng đến với Hệ thống Quản lý BH-EDU',
          type: 'info',
          is_read: false,
          created_at: new Date().toISOString()
        }];
        setNotifications(fallbackNotifications);
        setUnreadCount(1);
        return;
      }

      interface NotificationRecord {
        id: string;
        title?: string;
        message?: string;
        is_read?: boolean;
        created_at: string;
      }

      const mappedNotifications: Notification[] = (data || []).map((n: NotificationRecord) => ({
        id: n.id,
        user_id: profile.id,
        title: n.title || 'Thông báo',
        message: n.message || '',
        type: 'info' as const,
        is_read: n.is_read ?? false,
        created_at: n.created_at
      }));

      setNotifications(mappedNotifications);
      setUnreadCount(mappedNotifications.filter(n => !n.is_read).length);
    } catch (_error) {
      // Auth error or other top-level error - fail silently
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [supabase, profile?.id]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/dashboard/search?q=${encodeURIComponent(searchQuery)}`);
      setShowSearch(false);
      setSearchQuery("");
    }
  };

  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    if (profile?.full_name) {
      const parts = profile.full_name.split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return profile.full_name.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const quickActions = [
    { label: 'Điểm danh', icon: CheckIcon, href: routes.attendance.list(), show: true },
    { label: 'Điểm của tôi', icon: ChartBarIcon, href: '/dashboard/scores', show: profile?.role === 'student' },
    { label: 'Thêm học sinh', icon: UserPlusIcon, href: `${routes.students.list()}?action=add`, show: profile?.role === 'admin' || profile?.role === 'staff' },
    { label: 'Tạo bài tập', icon: ClipboardDocumentListIcon, href: '/dashboard/assignments?action=add', show: profile?.role === 'teacher' || profile?.role === 'admin' || profile?.role === 'staff' },
    { label: 'Xem báo cáo', icon: ChartBarIcon, href: '/dashboard/reports', show: profile?.role === 'admin' || profile?.role === 'staff' },
    { label: 'Nhập học sinh', icon: ArrowDownTrayIcon, href: routes.students.import(), show: profile?.role === 'admin' || profile?.role === 'staff' },
  ].filter((action) => action.show);

  return (
    <header className="relative h-16 md:h-20 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40
     glass-premium backdrop-blur-3xl shadow-sm dark:shadow-none transition-all duration-500 border-b border-white/20 dark:border-white/5">
      {/* Top Golden Shine - Micro-detail for prestige */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
      
      {/* Left Section: Nav Trigger (Mobile) */}
      <div className="flex items-center gap-4 relative z-10">
        {/* Hamburger Menu - Refined for premium feel */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-3 rounded-2xl text-stone-600 dark:text-stone-400 hover:bg-amber-500/10 dark:hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-500 transition-all active:scale-95 shadow-sm bg-white/50 dark:bg-white/5"
        >
          {isMenuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" /></svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M4 6h16M4 12h16M4 18h16" /></svg>
          )}
        </button>

        {/* Title & Role - Modernized Typography */}
        <div className="flex flex-col">
          <h1 className="font-black text-xl md:text-2xl leading-tight tracking-tighter flex items-center gap-2">
            <span className="text-stone-900 dark:text-stone-100 hidden sm:inline opacity-30">Cổng</span>
            <span className="bg-gradient-to-br from-amber-400 via-amber-600 to-amber-800 bg-clip-text text-transparent filter drop-shadow-[0_2px_4px_rgba(245,166,35,0.2)]">
              {profile?.role === 'admin' ? 'Quản Trị' :
                profile?.role === 'teacher' ? 'Giáo Viên' :
                  'Học Sinh'}
            </span>
          </h1>
          <div className="flex items-center gap-2 mt-1">
             <div className="w-2 h-[2px] bg-amber-500 rounded-full" />
             <p className="text-[9px] md:text-[10px] text-stone-500 dark:text-stone-400 font-black uppercase tracking-[0.4em] opacity-40 italic">BH-EDU PREMIUM</p>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2.5 md:gap-4">
        {/* Search - Desktop or Trigger */}
        <div className="hidden md:block">
           <button
             onClick={() => setShowSearch(!showSearch)}
             className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all cursor-pointer
              bg-stone-500/5 hover:bg-stone-500/10 border border-stone-200/50 dark:border-white/10
              text-stone-500 hover:text-stone-900 dark:hover:text-stone-100"
             title="Search (Ctrl+K)"
           >
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
             </svg>
             <span className="text-sm">Tìm kiếm...</span>
           </button>
        </div>

        {/* Mobile Search Icon */}
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="md:hidden p-2.5 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-white/5 active:scale-90 transition-all"
        >
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
           </svg>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 rounded-xl transition-all cursor-pointer relative
             bg-amber-500/10 text-amber-600 dark:text-amber-500 active:scale-90"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 border-2 border-white dark:border-[#1A1410] rounded-full w-2.5 h-2.5" />
            )}
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 mt-3 w-80 z-50 overflow-hidden rounded-2xl animate-scale-in origin-top-right
               bg-white dark:bg-[#241E18] border border-stone-200 dark:border-white/10 shadow-2xl">
                <div className="px-4 py-3 border-b border-stone-100 dark:border-white/5 bg-stone-50 dark:bg-white/5 flex items-center justify-between">
                  <p className="font-bold text-stone-900 dark:text-stone-100 uppercase tracking-widest text-[10px]">Thông báo ({unreadCount})</p>
                  <button onClick={markAllAsRead} className="text-[10px] font-bold text-amber-600 hover:text-amber-700 uppercase tracking-wider transition-all cursor-pointer">Đánh dấu tất cả</button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-12 text-center text-stone-400">
                      <p className="text-sm">Không có thông báo mới</p>
                    </div>
                  ) : (
                    notifications.map((notif, idx) => (
                      <div
                        key={notif.id}
                        className={`px-4 py-3 border-b border-stone-50 dark:border-white/5 transition-all
                         ${!notif.is_read ? 'bg-amber-500/5 dark:bg-amber-500/10' : 'hover:bg-stone-50 dark:hover:bg-white/5'}`}
                      >
                        <p className="font-bold text-sm text-stone-900 dark:text-stone-100">{notif.title}</p>
                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 line-clamp-2">{notif.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Theme Toggle - Desktop */}
        <div className="hidden sm:block">
          <ThemeToggle />
        </div>

        {/* User Profile - Desktop only (Mobile uses left Initials) */}
        <div className="hidden md:block relative">
           <button
             onClick={() => setShowUserMenu(!showUserMenu)}
             className="flex items-center gap-2 p-1.5 rounded-xl transition-all cursor-pointer
              bg-stone-500/5 hover:bg-stone-500/10 border border-stone-200/50 dark:border-white/10"
           >
             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-xs">
               {getInitials()}
             </div>
             <div className="text-left pr-1">
               <p className="text-sm font-bold text-stone-900 dark:text-stone-100 leading-tight">
                 {profile?.full_name || profile?.first_name || "User"}
               </p>
             </div>
           </button>
        </div>
      </div>

      {/* User Menu Dropdown (Standard for both Mobile & Desktop trigger) */}
      {showUserMenu && (
        <>
          <div className="fixed inset-0" onClick={() => setShowUserMenu(false)} />
          <div className="absolute top-16 md:top-20 left-4 md:left-auto md:right-6 w-64 py-2 z-50 overflow-hidden rounded-2xl animate-scale-in origin-top
            bg-white dark:bg-[#241E18] border border-stone-200 dark:border-white/10 shadow-2xl">
            <div className="px-4 py-3 border-b border-stone-100 dark:border-white/5 bg-stone-50 dark:bg-white/5">
              <p className="font-bold text-stone-900 dark:text-stone-100">{profile?.full_name || "Hồ sơ"}</p>
              <p className="text-xs text-stone-400 truncate mt-0.5">{profile?.email}</p>
              <div className="mt-2 inline-flex px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-500 text-[10px] font-black uppercase tracking-widest rounded-md border border-amber-500/20">
                {profile?.role || "Thành viên"}
              </div>
            </div>
            
            <Link
              href="/dashboard/profile"
              onClick={() => setShowUserMenu(false)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 dark:hover:bg-white/5 transition text-sm font-bold text-stone-700 dark:text-stone-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              Hồ sơ của tôi
            </Link>
            
            <Link
              href="/dashboard/settings"
              onClick={() => setShowUserMenu(false)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 dark:hover:bg-white/5 transition text-sm font-bold text-stone-700 dark:text-stone-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
              Cài đặt
            </Link>

            <div className="border-t border-stone-100 dark:border-white/5 my-1" />
            
            <button
              onClick={() => { setShowUserMenu(false); handleLogout(); }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/10 transition text-sm font-bold text-red-600 dark:text-red-400"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Đăng xuất
            </button>
          </div>
        </>
      )}

      {/* Search Overlay */}
      {showSearch && (
        <>
            <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowSearch(false)} />
            <div className="absolute top-16 md:top-[76px] left-0 right-0 p-4 md:p-6 glass-premium z-[70] animate-fade-in-up border-y border-stone-200 dark:border-white/10 shadow-2xl">
              <form onSubmit={handleSearch} className="max-w-3xl mx-auto relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm học sinh, lớp học..."
                  className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-white/10 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all text-lg"
                  autoFocus
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <svg className="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <button type="submit" className="hidden">Search</button>
              </form>
            </div>
        </>
      )}
    </header>
  );
}
