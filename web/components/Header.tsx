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
    full_name?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    role?: string;
  } | null;
}

export default function Header({ profile }: HeaderProps) {
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
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Show fallback when not logged in
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      // TODO: Enable when notifications table is created in database
      // For now, use fallback to avoid 400 errors
      const fallbackNotifications: Notification[] = [{
        id: 'welcome',
        user_id: user.id,
        title: 'Welcome!',
        message: 'Welcome to BH-EDU Management System',
        type: 'info',
        is_read: false,
        created_at: new Date().toISOString()
      }];
      setNotifications(fallbackNotifications);
      setUnreadCount(1);

      /* Uncomment when notifications table is ready:
      const { data, error } = await supabase
        .from('notifications')
        .select('id, title, message, is_read, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;

      interface NotificationRecord {
        id: string;
        title?: string;
        message?: string;
        is_read?: boolean;
        created_at: string;
      }

      const mappedNotifications: Notification[] = (data || []).map((n: NotificationRecord) => ({
        id: n.id,
        user_id: user.id,
        title: n.title || 'Notification',
        message: n.message || '',
        type: 'info' as const,
        is_read: n.is_read ?? false,
        created_at: n.created_at
      }));

      setNotifications(mappedNotifications);
      setUnreadCount(mappedNotifications.filter(n => !n.is_read).length);
      */
    } catch (_error) {
      // Auth error or other top-level error - fail silently
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [supabase]);

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
    { label: 'Tạo bài tập', icon: ClipboardDocumentListIcon, href: '/dashboard/assignments?action=add', show: profile?.role === 'teacher' || profile?.role === 'admin' },
    { label: 'Xem báo cáo', icon: ChartBarIcon, href: '/dashboard/reports', show: profile?.role === 'admin' || profile?.role === 'staff' },
    { label: 'Nhập học sinh', icon: ArrowDownTrayIcon, href: routes.students.import(), show: profile?.role === 'admin' || profile?.role === 'staff' },
  ].filter((action) => action.show);

  return (
    <header className="relative h-[72px] flex items-center justify-between px-6 sticky top-0 z-30
     bg-white/70 dark:bg-[#1A1410]/80 backdrop-blur-xl shadow-sm dark:shadow-none transition-all duration-300">
      {/* Top Golden Shine */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
      {/* Bottom Gradient Divider */}
      <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-gray-300/50 dark:via-white/10 to-transparent" />
      {/* Left Section - Title */}
      <div className="flex items-center gap-4 relative z-10">
        {/* Mobile menu trigger spacing */}
        <div className="w-8 lg:hidden" />

        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <h1 className="font-bold text-xl leading-tight tracking-tight">
              <span className="text-foreground">
                {profile?.role === 'admin' ? 'Cổng ' :
                  profile?.role === 'teacher' ? 'Cổng ' :
                    'Cổng '}
              </span>
              <span className="bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">
                {profile?.role === 'admin' ? 'Quản Trị' :
                  profile?.role === 'teacher' ? 'Giáo Viên' :
                    'Học Sinh'}
              </span>
            </h1>
            <p className="text-sm text-muted-foreground font-medium">Bui Hoang Education</p>
          </div>
        </div>
      </div>

      {/* Right Section - Actions & User */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Search Button with Keyboard Shortcut */}
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl transition-all cursor-pointer
           bg-surface-secondary/50 hover:bg-surface-secondary border border-border/50
           text-muted hover:text-foreground"
          title="Search (Ctrl+K)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="text-sm">Tìm kiếm...</span>
          <kbd className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-mono rounded bg-white/10 border border-white/10 text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>

        {/* Mobile Search Button */}
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="sm:hidden p-2.5 rounded-xl transition-all cursor-pointer
           bg-surface-secondary text-primary shadow-neumorphic-xs hover:shadow-neumorphic-sm
           dark:bg-white/5 dark:text-primary dark:border dark:border-white/10 dark:hover:bg-white/10 dark:shadow-none"
          title="Search"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>

        {/* Quick Actions */}
        <div className="relative">
          <button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className="p-2.5 rounded-xl transition-all cursor-pointer
             bg-success/20 text-success shadow-neumorphic-xs hover:shadow-neumorphic-sm
             dark:bg-success/20 dark:text-success dark:border dark:border-success/30 dark:hover:bg-success/30 dark:shadow-none"
            title="Quick Actions"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>

          {showQuickActions && (
            <>
              <div className="fixed inset-0" onClick={() => setShowQuickActions(false)} />
              <div className="absolute right-0 mt-3 w-60 py-2 z-50 overflow-hidden rounded-2xl animate-scale-in origin-top-right
               bg-surface border border-border shadow-neumorphic
               dark:bg-glass-bg dark:backdrop-blur-2xl dark:border-white/10 dark:shadow-glow">
                <div className="px-4 py-3 border-b border-border dark:border-white/10 bg-surface-secondary dark:bg-white/5">
                  <p className="text-sm font-semibold text-foreground uppercase tracking-wider">Hành động nhanh</p>
                </div>
                {quickActions.map((action, idx) => (
                  <Link
                    key={idx}
                    href={action.href}
                    onClick={() => setShowQuickActions(false)}
                    className="group flex items-center gap-3 px-4 py-3 hover:bg-surface-secondary dark:hover:bg-white/5 transition text-sm font-medium text-foreground cursor-pointer"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <action.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                    <span className="group-hover:translate-x-1 transition-transform">{action.label}</span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 rounded-xl transition-all cursor-pointer relative
             bg-accent/20 text-accent shadow-neumorphic-xs hover:shadow-neumorphic-sm
             dark:bg-accent/20 dark:text-accent dark:border dark:border-accent/30 dark:hover:bg-accent/30 dark:shadow-none"
            title="Notifications"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-error text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 mt-3 w-80 z-50 overflow-hidden rounded-2xl animate-scale-in origin-top-right
               bg-surface border border-border shadow-neumorphic
               dark:bg-glass-bg dark:backdrop-blur-2xl dark:border-white/10 dark:shadow-glow">
                <div className="px-4 py-3 border-b border-border dark:border-white/10 bg-surface-secondary dark:bg-white/5 flex items-center justify-between">
                  <p className="font-semibold text-foreground">Thông báo</p>
                  <button onClick={markAllAsRead} className="text-xs font-medium text-primary hover:text-primary/80 px-2 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 transition-all cursor-pointer active:scale-95">Đánh dấu đã đọc</button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-muted">
                      <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      <p className="font-medium">Không có thông báo</p>
                    </div>
                  ) : (
                    notifications.map((notif, idx) => (
                      <div
                        key={notif.id}
                        className={`px-4 py-3 border-b border-border/50 dark:border-white/5 hover:bg-surface-secondary dark:hover:bg-white/5 cursor-pointer transition-all animate-fade-in hover:translate-x-1 ${!notif.is_read ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!notif.is_read ? 'bg-primary animate-pulse-soft' : 'bg-muted/30'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-foreground">{notif.title}</p>
                            <p className="text-sm text-muted mt-1 line-clamp-2">{notif.message}</p>
                            <p className="text-xs text-muted/70 mt-1">
                              {new Date(notif.created_at).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="px-4 py-3 border-t border-border dark:border-white/10 bg-surface-secondary dark:bg-white/5">
                  <Link href="/dashboard/notifications" className="text-sm font-medium text-primary hover:text-primary/80">
                    Xem tất cả thông báo →
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-2 rounded-xl transition-all cursor-pointer
             bg-surface-secondary hover:bg-surface-hover"
          >
            <div className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center font-bold text-sm">
              {getInitials()}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold text-foreground leading-tight">
                {profile?.full_name || profile?.first_name || "User"}
              </p>
              <p className="text-xs text-muted capitalize">{profile?.role || "user"}</p>
            </div>
            <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 mt-3 w-60 py-2 z-50 overflow-hidden rounded-2xl origin-top-right
               bg-surface border border-border shadow-lg">
                <div className="px-4 py-3 border-b border-border bg-surface-secondary">
                  <p className="font-semibold text-foreground">{profile?.full_name || "User"}</p>
                  <p className="text-sm text-muted truncate">{profile?.email}</p>
                  <span className="inline-block mt-2 px-3 py-1 bg-surface text-secondary text-xs font-medium rounded-full capitalize border border-border">
                    {profile?.role || "user"}
                  </span>
                </div>
                <Link
                  href="/dashboard/profile"
                  onClick={() => setShowUserMenu(false)}
                  className="group flex items-center gap-3 px-4 py-3 hover:bg-surface-hover transition text-sm font-medium text-secondary hover:text-foreground cursor-pointer"
                >
                  <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="group-hover:translate-x-1 transition-transform">Hồ sơ của tôi</span>
                </Link>
                <Link
                  href="/dashboard/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="group flex items-center gap-3 px-4 py-3 hover:bg-surface-hover transition text-sm font-medium text-secondary hover:text-foreground cursor-pointer"
                >
                  <svg className="w-5 h-5 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="group-hover:translate-x-1 transition-transform">Cài đặt</span>
                </Link>
                <div className="border-t border-border my-2"></div>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    handleLogout();
                  }}
                  className="group w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition text-sm font-medium text-red-600 dark:text-red-400 cursor-pointer active:scale-[0.98]"
                >
                  <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="group-hover:translate-x-1 transition-transform">Đăng xuất</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Search Overlay */}
      {showSearch && (
        <div className="absolute top-full left-0 right-0 p-6 bg-surface border-b border-border shadow-lg">
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm học sinh, khóa học, lớp học..."
                className="w-full px-5 py-4 pr-14 rounded-xl text-foreground font-medium placeholder-muted transition-all
                 bg-surface border border-border shadow-sm focus:shadow-md focus:border-primary
                 focus:ring-2 focus:ring-primary/20"
                autoFocus
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-lg transition-all cursor-pointer active:scale-95
                 bg-primary text-white shadow-sm hover:shadow-md hover:bg-primary-hover"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
            <div className="mt-4 flex items-center gap-4 text-sm text-muted">
              <span className="flex items-center gap-1.5">
                <kbd className="px-2 py-1 rounded bg-surface-secondary border border-border font-mono text-xs">↵</kbd>
                để tìm kiếm
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-2 py-1 rounded bg-surface-secondary border border-border font-mono text-xs">Esc</kbd>
                để đóng
              </span>
            </div>
          </form>
        </div>
      )}
    </header>
  );
}
