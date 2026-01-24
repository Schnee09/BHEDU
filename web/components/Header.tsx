"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import { CheckIcon, UserPlusIcon, ClipboardDocumentListIcon, ChartBarIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { Icons } from "./ui/Icons";

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
            <span className="bg-gradient-to-br from-amber-400 via-amber-600 to-amber-800 bg-clip-text text-transparent filter drop-shadow-[0_2px_4px_rgba(245,166,35,0.2)] animate-pulse-slow">
              {profile?.role === 'admin' ? 'Hệ Thống' :
                profile?.role === 'teacher' ? 'Học Thuật' :
                  'Sinh Viên'}
            </span>
          </h1>
          <div className="flex items-center gap-2 mt-1">
             <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                <div className="w-1.5 h-1.5 bg-amber-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-1.5 h-1.5 bg-amber-700 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
             </div>
             <p className="text-[9px] md:text-[10px] text-stone-500 dark:text-stone-400 font-black uppercase tracking-[0.4em] opacity-60 italic">
                PRO MAX PREMIUM
             </p>
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
              {/* Overlay Backdrop */}
              <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-md animate-fade-in" onClick={() => setShowNotifications(false)} />
              
              {/* Notification Drawer (Mobile) / Dropdown (Desktop) */}
              <div className={cn(
                "fixed inset-x-0 bottom-0 z-[110] md:absolute md:inset-auto md:right-0 md:top-full md:mt-3 md:w-96 md:max-h-[500px]",
                "bg-white dark:bg-[#241E18] border-t md:border border-stone-200 dark:border-white/10 shadow-2xl",
                "rounded-t-[32px] md:rounded-2xl transition-all duration-500 ease-out animate-fade-in-up flex flex-col overflow-hidden",
                "pb-safe md:pb-0"
              )}>
                {/* Drawer Header for Mobile */}
                <div className="md:hidden flex justify-center pt-3 pb-1">
                   <div className="w-12 h-1 bg-stone-200 dark:bg-stone-800 rounded-full" />
                </div>

                <div className="px-6 py-5 border-b border-stone-100 dark:border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-amber-500/10 rounded-lg">
                       <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                    </span>
                    <p className="font-black text-stone-900 dark:text-stone-100 uppercase tracking-[0.2em] text-[11px]">Thông báo ({unreadCount})</p>
                  </div>
                  <button onClick={markAllAsRead} className="text-[10px] font-black text-amber-600 hover:text-amber-700 uppercase tracking-widest transition-all">Đánh dấu đã đọc</button>
                </div>

                <div className="flex-1 overflow-y-auto max-h-[60vh] md:max-h-[400px]">
                  {notifications.length === 0 ? (
                    <div className="px-6 py-16 text-center">
                      <div className="w-16 h-16 bg-stone-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                         <svg className="w-8 h-8 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                      </div>
                      <p className="text-sm font-bold text-stone-400">Không có thông báo mới</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-stone-50 dark:divide-white/5">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={cn(
                            "px-6 py-5 transition-all cursor-pointer relative group",
                            !notif.is_read ? 'bg-amber-500/[0.03] dark:bg-amber-500/5' : 'hover:bg-stone-50 dark:hover:bg-white/5'
                          )}
                        >
                          {!notif.is_read && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
                          )}
                          <div className="flex items-start gap-4">
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-[14px] text-stone-900 dark:text-stone-100 group-hover:text-amber-600 transition-colors">{notif.title}</p>
                                <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 line-clamp-3 leading-relaxed">{notif.message}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Footer Link for notifications page if any */}
                <div className="p-4 border-t border-stone-100 dark:border-white/5 bg-stone-50/50 dark:bg-white/2">
                   <Link 
                     href="/dashboard/notifications" 
                     className="block w-full text-center py-3 rounded-xl bg-stone-900 dark:bg-amber-600 text-white text-xs font-black uppercase tracking-widest press-effect"
                     onClick={() => setShowNotifications(false)}
                   >
                     Xem tất cả thông báo
                   </Link>
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

      {/* Search Overlay - Full Screen Pro Max for Mobile */}
      {showSearch && (
        <>
            <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-3xl animate-fade-in" onClick={() => setShowSearch(false)} />
            <div className="fixed inset-0 md:inset-auto md:top-20 md:left-auto md:right-8 md:w-[500px] md:max-h-[80vh] bg-white/95 dark:bg-[#1A1410]/95 md:rounded-[32px] z-[110] animate-fade-in-up flex flex-col overflow-hidden">
              {/* Mobile Header for Search */}
              <div className="md:hidden flex items-center justify-between p-6 border-b border-stone-100 dark:border-white/5">
                 <h2 className="text-xl font-black text-stone-900 dark:text-stone-100 uppercase tracking-tighter">Tìm kiếm</h2>
                 <button onClick={() => setShowSearch(false)} className="p-2 rounded-xl bg-stone-100 dark:bg-white/5">
                    <svg className="w-6 h-6 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
              </div>

              <div className="p-6">
                <form onSubmit={handleSearch} className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm học sinh, lớp học..."
                    className="w-full h-16 pl-14 pr-4 rounded-[24px] bg-stone-100 dark:bg-stone-900/50 border border-stone-200 dark:border-white/10 focus:border-amber-500 transition-all text-lg font-bold"
                    autoFocus
                  />
                  <div className="absolute left-5 top-1/2 -translate-y-1/2">
                      <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                </form>

                {/* Quick Shortcuts / Recent */}
                <div className="mt-8">
                   <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-4">Gợi ý tìm kiếm</p>
                   <div className="flex flex-wrap gap-2">
                      {['Học sinh mới', 'Thời khóa biểu', 'Điểm danh', 'Tài chính'].map(tag => (
                        <button 
                          key={tag}
                          onClick={() => {setSearchQuery(tag);}}
                          className="px-4 py-2 rounded-full bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/10 text-xs font-bold text-amber-600 dark:text-amber-500 transition-all"
                        >
                          {tag}
                        </button>
                      ))}
                   </div>
                </div>
              </div>
              
              <div className="flex-1" />
              
              {/* Bottom Decoration for Mobile */}
              <div className="md:hidden h-20 bg-gradient-to-t from-stone-100/50 dark:from-stone-900/20 to-transparent" />
            </div>
        </>
      )}
    </header>
  );
}
