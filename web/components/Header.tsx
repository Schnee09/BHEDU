"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import {
  CheckIcon,
  UserPlusIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  ArrowDownTrayIcon,
  BellIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { Icons } from "./ui/Icons";
import { usePermissions } from "@/hooks/usePermissions";
import { useCustomization } from "@/contexts/CustomizationContext";
import { useNotifications } from "@/hooks/useNotifications";


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
  const { accentColor } = useCustomization();
  const { can, isAdmin, isStaff, isTeacher, isStudent, isParent } = usePermissions();
  const { notifications, unreadCount, markAllAsRead, markAsRead } = useNotifications(profile?.id);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Dynamic Portal Title & Greetings
  const portalTitle = useMemo(() => {
    if (isAdmin) return { main: "Hệ thống", sub: "QUẢN TRỊ" };
    if (isStaff) return { main: "Cổng nội bộ", sub: "NHÂN SỰ" };
    if (isTeacher) return { main: "Cổng công cụ", sub: "GIÁO VIÊN" };
    if (isParent) return { main: "Cổng kết nối", sub: "PHỤ HUYNH" };
    return { main: "Cổng học tập", sub: "HỌC SINH" };
  }, [isAdmin, isStaff, isTeacher, isParent]);


  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowSearch(false);
        setShowNotifications(false);
        setShowQuickActions(false);
        setShowUserMenu(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setShowSearch(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/dashboard/search?q=${encodeURIComponent(searchQuery)}`);
      setShowSearch(false);
      setSearchQuery("");
    }
  };

  // Feature mapping for search
  const appFeatures = useMemo(() => [
    { name: "Thời khóa biểu", href: routes.timetable.manage(), keywords: ["schedule", "lich hoc", "thoi khoa bieu"] },
    { name: "Điểm danh", href: routes.attendance.list(), keywords: ["attendance", "diem danh"] },

    { name: "Học sinh", href: routes.students.list(), keywords: ["students", "hoc sinh"] },
    { name: "Lớp học", href: routes.classes.list(), keywords: ["classes", "lop hoc"] },
    { name: "Nhập điểm", href: routes.grades.entry(), keywords: ["grades", "nhap diem"] },
    { name: "Hồ sơ cá nhân", href: routes.profile(), keywords: ["profile", "ca nhan", "ho so"] },
    { name: "Cài đặt", href: "/dashboard/settings", keywords: ["settings", "cai dat"] },
  ], []);

  const [searchResults, setSearchResults] = useState<{ type: 'feature' | 'data', name: string, sub?: string, href: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      const results: any[] = [];
      const q = searchQuery.toLowerCase();

      // 1. Match features
      appFeatures.forEach(f => {
        if (f.name.toLowerCase().includes(q) || f.keywords.some(k => k.includes(q))) {
          results.push({ type: 'feature', name: f.name, href: f.href });
        }
      });

      // 2. Async data search (subset for preview)
      try {
        if (q.length > 1) {
          const [studentsRes, classesRes] = await Promise.all([
            supabase.from('profiles').select('id, full_name, role').eq('role', 'student').ilike('full_name', `%${q}%`).limit(3),
            supabase.from('classes').select('id, name').ilike('name', `%${q}%`).limit(2)
          ]);

          studentsRes.data?.forEach((s: any) => results.push({ type: 'data', name: s.full_name, sub: 'Học sinh', href: `/dashboard/students/${s.id}` }));
          classesRes.data?.forEach((c: any) => results.push({ type: 'data', name: c.name, sub: 'Lớp học', href: `/dashboard/classes/${c.id}` }));
        }
      } catch (e) {
        console.error("Search preview error:", e);
      }

      setSearchResults(results.slice(0, 8));
      setSelectedIndex(0);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, appFeatures, supabase]);

  // Handle keyboard navigation for search results
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSearch || searchResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % searchResults.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      const selected = searchResults[selectedIndex];
      if (selected) {
        router.push(selected.href);
        setShowSearch(false);
        setSearchQuery("");
      }
    }
  };

  // Auto-scroll into view when selectedIndex changes
  useEffect(() => {
    if (showSearch && selectedRef.current) {
      selectedRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex, showSearch]);

  const getInitials = () => {
    if (profile?.email?.startsWith('bulktest') || profile?.full_name === 'Bulk Test') {
      return "BU";
    }

    if (profile?.last_name && profile?.first_name) {
      // Vietnamese initials: Surname[0] + GivenName[0]
      return `${profile.last_name[0]}${profile.first_name[0]}`.toUpperCase();
    }

    if (profile?.full_name) {
      const parts = profile.full_name.trim().split(/\s+/);
      if (parts.length >= 2) {
        // Fallback for full_name: First word[0] + Last word[0]
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return profile.full_name.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const quickActions = [
    { label: 'Điểm danh', icon: CheckIcon, href: routes.attendance.list(), show: true },
    { label: 'Điểm của tôi', icon: ChartBarIcon, href: '/dashboard/scores', show: isStudent },
    { label: 'Thêm học sinh', icon: UserPlusIcon, href: `${routes.students.list()}?action=add`, show: can("students.create") },
    { label: 'Tạo bài tập', icon: ClipboardDocumentListIcon, href: '/dashboard/assignments?action=add', show: can("grades.entry") },
    { label: 'Xem báo cáo', icon: ChartBarIcon, href: '/dashboard/reports', show: can("reports.view") },
    { label: 'Nhập học sinh', icon: ArrowDownTrayIcon, href: routes.students.import(), show: can("users.bulk_import") },
    { label: 'Kết nối con em', icon: UserPlusIcon, href: '/dashboard/parent/link-student', show: isParent },
  ].filter((action) => action.show);

  return (
    <header className="sticky top-0 h-20 md:h-24 flex items-center justify-between px-4 md:px-10 z-40 glass-premium border-b border-white/10 shrink-0">
      <div className="flex items-center gap-6 relative z-10 flex-1 min-w-0">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-3 rounded-2xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-white/10 transition-all active:scale-90"
        >
          {isMenuOpen ? (
            <XMarkIcon className="w-6 h-6" />
          ) : (
            <Bars3Icon className="w-6 h-6" />
          )}
        </button>

        <div className="flex flex-col group cursor-pointer shrink-0" onClick={() => router.push('/dashboard')}>
          <h1 className="text-lg md:text-xl font-black tracking-tighter leading-none flex items-center gap-2 whitespace-nowrap">
            <span className="text-stone-800 dark:text-white transition-colors group-hover:text-amber-600 drop-shadow-sm">{portalTitle.main}</span>
            <span className="text-amber-600 dark:text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-lg text-[10px] md:text-[11px] border border-amber-500/20 font-bold tracking-widest uppercase shadow-sm">{portalTitle.sub}</span>
          </h1>
          <div className="flex items-center gap-1.5 mt-2 opacity-40 group-hover:opacity-100 transition-opacity">
            <div className="h-px w-8 bg-gradient-to-r from-amber-500 to-transparent rounded-full"></div>
            <p className="text-[7px] font-black uppercase tracking-[0.4em] text-stone-500 dark:text-stone-400">
              BH-EDU SYSTEM
            </p>
          </div>
        </div>
      </div>

      {/* Central Search Bar - Desktop */}
      <div className="hidden lg:flex flex-1 justify-center px-8">
        <div className="relative group w-full max-w-[480px]">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="flex items-center gap-3 px-5 h-11 w-full rounded-2xl transition-all cursor-pointer relative overflow-hidden
              bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10
              hover:border-amber-500/50 hover:bg-white/60 dark:hover:bg-white/10 hover:shadow-[0_0_20px_rgba(245,166,35,0.15)]
              text-stone-500 dark:text-stone-400 group-hover:text-amber-600 shadow-sm backdrop-blur-md"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:animate-shimmer" />
            <MagnifyingGlassIcon className="w-4 h-4 text-stone-400 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-sm font-bold tracking-tight opacity-80 group-hover:opacity-100 transition-opacity">Tìm kiếm mọi thứ...</span>
            <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-300">
              <span className="text-[10px] bg-stone-100 dark:bg-white/20 px-1.5 py-0.5 rounded font-mono text-stone-500 dark:text-stone-300 font-bold">Ctrl K</span>
            </div>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 md:gap-4 shrink-0 flex-1">
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="lg:hidden p-3 rounded-2xl bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-300 active:scale-90 transition-all border border-transparent hover:border-amber-500/20"
        >
          <MagnifyingGlassIcon className="w-6 h-6" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={cn(
              "w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer relative border group",
              showNotifications
                ? "bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20"
                : "bg-stone-100/40 dark:bg-white/5 text-stone-600 dark:text-stone-300 border-transparent hover:border-amber-500/30"
            )}
          >
            <BellIcon className={cn("w-5 h-5 group-hover:animate-swing", unreadCount > 0 && "animate-subtle-pulse")} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 border-2 border-white dark:border-[#1A1410] rounded-full w-4 h-4 bg-red-500 text-[9px] font-black text-white flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowNotifications(false)} />
              <div className={cn(
                "fixed inset-x-0 bottom-0 z-[110] md:absolute md:inset-auto md:right-0 md:top-full md:mt-4 md:w-[420px] md:max-h-[600px]",
                "bg-white dark:bg-[#1C1A16] border-t md:border border-white/10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)]",
                "rounded-t-[32px] md:rounded-[24px] transition-all duration-500 ease-out animate-fade-in-up flex flex-col overflow-hidden",
                "pb-safe md:pb-0"
              )}>
                <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-stone-50/50 dark:bg-white/5">
                  <div>
                    <p className="font-black text-xl text-stone-900 dark:text-white tracking-tight">Thông báo</p>
                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mt-0.5">Bạn có {unreadCount} tin mới</p>
                  </div>
                  <button
                    onClick={() => { markAllAsRead(); setShowNotifications(false); }}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 hover:bg-amber-500 text-[10px] font-black uppercase tracking-wider transition-colors hover:text-white"
                  >
                    ĐỌC TẤT CẢ
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto max-h-[70vh] md:max-h-[500px] overscroll-contain px-2">
                  {notifications.length === 0 ? (
                    <div className="px-6 py-20 text-center">
                      <div className="w-20 h-20 bg-stone-100 dark:bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 transform -rotate-12">
                        <BellIcon className="w-10 h-10 text-stone-300 dark:text-stone-600" />
                      </div>
                      <p className="font-bold text-stone-900 dark:text-white">Chưa có thông báo nào</p>
                      <p className="text-xs text-stone-500 mt-2">Chúng tôi sẽ thông báo cho bạn khi có tin mới.</p>
                    </div>
                  ) : (
                    <div className="py-2 space-y-1">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => markAsRead(notif.id)}
                          className={cn(
                            "mx-2 px-4 py-5 rounded-2xl transition-all cursor-pointer relative group border border-transparent",
                            !notif.is_read
                              ? 'bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/10'
                              : 'hover:bg-stone-50 dark:hover:bg-white/5'
                          )}
                        >
                          {!notif.is_read && (
                            <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,166,35,0.8)]" />
                          )}
                          <div className="flex items-start gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className={cn(
                                  "font-black text-sm tracking-tight",
                                  !notif.is_read ? "text-stone-900 dark:text-white" : "text-stone-600 dark:text-stone-400"
                                )}>
                                  {notif.title}
                                </p>
                                <span className="text-[9px] font-bold text-stone-400 uppercase">
                                  {new Date(notif.created_at).toLocaleDateString('vi-VN')}
                                </span>
                              </div>
                              <p className="text-sm text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">{notif.message}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-white/5 md:hidden">
                  <button onClick={() => setShowNotifications(false)} className="w-full py-4 rounded-2xl bg-stone-100 dark:bg-white/5 font-black text-stone-900 dark:text-white uppercase tracking-widest text-xs">ĐÓNG</button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="hidden sm:block">
          <div className="w-11 h-11 rounded-2xl bg-stone-100 dark:bg-white/5 border border-stone-100 dark:border-white/5 flex items-center justify-center hover:border-amber-500/30 transition-all">
            <ThemeToggle />
          </div>
        </div>

        <div className="hidden md:block relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 p-1 pr-4 rounded-2xl transition-all cursor-pointer group
              bg-stone-100/40 dark:bg-white/5 border border-transparent hover:border-amber-500/30 shadow-sm"
          >
            <div className="relative p-0.5">
              {/* Metric Ring */}
              <svg className="absolute inset-0 w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                <circle
                  cx="50" cy="50" r="46"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-stone-200 dark:text-white/10"
                />
                <circle
                  cx="50" cy="50" r="46"
                  fill="none"
                  stroke="url(#avatar-gradient)"
                  strokeWidth="6"
                  strokeDasharray="289"
                  strokeDashoffset={289 * (1 - 0.75)}
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
              <div className="w-8 h-8 md:w-8 md:h-8 rounded-xl flex items-center justify-center text-white font-black text-xs md:text-sm relative z-10 shadow-sm overflow-hidden"
                style={{ backgroundImage: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
                {getInitials()}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#1C1A16] bg-green-500 z-20" />
            </div>
            <div className="text-left">
              <p className="text-sm font-black text-stone-900 dark:text-white leading-none mb-1 group-hover:text-amber-600 transition-colors">
                {profile?.first_name || profile?.full_name?.split(/\s+/).pop() || "User"}
              </p>
              <div className="flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse"></span>
                <p className="text-[8px] text-stone-500 dark:text-stone-400 font-black uppercase tracking-widest">
                  {profile?.role || "ADMIN"}
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {showUserMenu && (
        <>
          <div className="fixed inset-0" onClick={() => setShowUserMenu(false)} />
          <div className="absolute top-24 right-10 w-72 py-3 z-50 overflow-hidden rounded-[24px] animate-scale-in origin-top-right
            bg-white dark:bg-[#1C1A16] border border-stone-200 dark:border-white/10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)]">
            <div className="px-6 py-5 border-b border-stone-100 dark:border-white/5 bg-stone-50/50 dark:bg-white/5">
              <p className="font-black text-stone-900 dark:text-white tracking-tight">{profile?.full_name || "Hồ sơ"}</p>
              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mt-1">{profile?.email}</p>
            </div>

            <Link
              href="/dashboard/profile"
              onClick={() => setShowUserMenu(false)}
              className="flex items-center gap-4 px-6 py-4 hover:bg-stone-50 dark:hover:bg-white/5 transition-all text-sm font-black text-stone-700 dark:text-stone-300 group"
            >
              <div className="p-2 rounded-xl bg-stone-100 dark:bg-white/5 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <Icons.User className="w-4 h-4" />
              </div>
              Hồ sơ của tôi
            </Link>

            <Link
              href="/dashboard/settings"
              onClick={() => setShowUserMenu(false)}
              className="flex items-center gap-4 px-6 py-4 hover:bg-stone-50 dark:hover:bg-white/5 transition-all text-sm font-black text-stone-700 dark:text-stone-300 group"
            >
              <div className="p-2 rounded-xl bg-stone-100 dark:bg-white/5 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <Icons.Settings className="w-4 h-4" />
              </div>
              Cài đặt
            </Link>

            <div className="border-t border-stone-100 dark:border-white/5 my-1" />

            <button
              onClick={() => { setShowUserMenu(false); handleLogout(); }}
              className="w-full flex items-center gap-4 px-6 py-4 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-sm font-black text-red-600 dark:text-red-400 group"
            >
              <div className="p-2 rounded-xl bg-red-50 dark:bg-red-900/10 group-hover:bg-red-600 group-hover:text-white transition-colors">
                <Icons.Logout className="w-4 h-4" />
              </div>
              Đăng xuất
            </button>
          </div>
        </>
      )
      }

      {
        showSearch && (
          <>
            <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-2xl animate-fade-in" onClick={() => setShowSearch(false)} />
            <div className="fixed inset-0 md:inset-auto md:top-24 md:left-1/2 md:-translate-x-1/2 md:w-[700px] md:max-h-[80vh] bg-white dark:bg-[#1C1A16] md:rounded-[32px] z-[110] animate-scale-in flex flex-col overflow-hidden shadow-[0_64px_128px_-24px_rgba(0,0,0,0.6)] border border-white/5">
              <div className="flex items-center justify-between p-6 border-b border-white/5 bg-stone-50/50 dark:bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/20">
                    <MagnifyingGlassIcon className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-black text-stone-900 dark:text-white tracking-tighter uppercase whitespace-nowrap">Tìm kiếm nhanh</h2>
                </div>
                <button
                  onClick={() => setShowSearch(false)}
                  className="p-3 rounded-2xl bg-stone-100 dark:bg-white/5 text-stone-500 hover:bg-red-500 hover:text-white transition-all active:scale-90"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 md:p-10">
                <form onSubmit={handleSearch} className="relative group">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm học sinh, lớp học, tính năng..."
                    className="w-full h-20 pl-16 pr-6 rounded-[28px] bg-stone-100/80 dark:bg-white/5 border-2 border-transparent focus:border-amber-500 transition-all text-xl md:text-2xl font-black tracking-tight placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:bg-white dark:focus:bg-stone-900 shadow-inner"
                    onKeyDown={handleKeyDown}
                    autoFocus
                  />
                  <div className="absolute left-6 top-1/2 -translate-y-1/2">
                    <MagnifyingGlassIcon className="w-8 h-8 text-amber-500" />
                  </div>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden md:block">
                    {/* Hotkey hint removed per user request */}
                  </div>
                </form>

                <div className="mt-8 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar" ref={scrollContainerRef}>
                  {isSearching ? (
                    <div className="flex flex-col items-center justify-center py-10 opacity-50">
                      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
                      <p className="text-sm font-black text-stone-400 uppercase tracking-widest">Đang tìm kiếm...</p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2" ref={scrollContainerRef}>
                      {searchResults.map((result, idx) => {
                        const showHeader = idx === 0 || searchResults[idx - 1].type !== result.type;
                        const isSelected = selectedIndex === idx;

                        return (
                          <React.Fragment key={idx}>
                            {showHeader && (
                              <div className={cn("px-4 py-3", idx > 0 && "mt-4")}>
                                <p className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em]">
                                  {result.type === 'feature' ? "Phím tắt hệ thống" : "Hồ sơ dữ liệu"}
                                </p>
                              </div>
                            )}
                            <button
                              ref={isSelected ? selectedRef : null}
                              onMouseEnter={() => setSelectedIndex(idx)}
                              onClick={() => {
                                router.push(result.href);
                                setShowSearch(false);
                                setSearchQuery("");
                              }}
                              className={cn(
                                "flex items-center gap-4 p-4 rounded-2xl transition-all text-left group border border-transparent",
                                isSelected
                                  ? "bg-amber-100/50 dark:bg-amber-500/10 border-amber-500/30 scale-[1.02] shadow-sm ml-2"
                                  : "bg-stone-50/50 dark:bg-white/5"
                              )}
                            >
                              <div className={cn(
                                "p-2.5 rounded-xl transition-colors",
                                isSelected ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20" : "bg-amber-500/10 text-amber-600"
                              )}>
                                {result.type === 'feature' ? <Icons.Settings className="w-5 h-5" /> : <Icons.User className="w-5 h-5" />}
                              </div>
                              <div className="flex-1">
                                <p className={cn(
                                  "text-sm font-black transition-colors uppercase tracking-tight",
                                  isSelected ? "text-amber-600 dark:text-amber-500" : "text-stone-900 dark:text-white"
                                )}>
                                  {result.name}
                                </p>
                                {result.sub ? (
                                  <p className="text-[10px] font-bold text-stone-500 dark:text-stone-400 mt-0.5">{result.sub}</p>
                                ) : (
                                  <p className="text-[10px] font-bold text-stone-500 dark:text-stone-400 mt-0.5">Mô-đun hệ thống</p>
                                )}
                              </div>
                              <Icons.ChevronRight className={cn(
                                "w-4 h-4 transition-all",
                                isSelected ? "text-amber-500 translate-x-1" : "text-stone-300"
                              )} />
                            </button>
                          </React.Fragment>
                        );
                      })}

                      <button
                        onClick={handleSearch}
                        className="mt-6 py-4 text-center text-[10px] font-black text-amber-600 uppercase tracking-[0.3em] hover:opacity-80 transition-opacity border-t border-white/5 mx-4"
                      >
                        Bấm ENTER để xem tất cả kết quả →
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="h-px flex-1 bg-white/5"></div>
                        <p className="text-[10px] font-black text-stone-400 dark:text-stone-600 uppercase tracking-[0.4em]">Truy cập nhanh</p>
                        <div className="h-px flex-1 bg-white/5"></div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { name: 'Thời khóa biểu', icon: Icons.Calendar, href: routes.timetable.manage() },
                          { name: 'Điểm danh', icon: Icons.Clipboard, href: routes.attendance.list() },

                          { name: 'Học sinh', icon: Icons.User, href: routes.students.list() }
                        ].map((item, i) => (
                          <button
                            key={i}
                            onClick={() => { router.push(item.href); setShowSearch(false); }}
                            className="flex items-center gap-4 p-4 rounded-2xl border border-stone-100 dark:border-white/5 bg-white dark:bg-white/5 hover:border-amber-500 hover:bg-amber-500/10 transition-all group"
                          >
                            <div className="p-2 rounded-xl bg-stone-100 dark:bg-white/5 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                              <item.icon className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-black text-stone-600 dark:text-stone-300 group-hover:text-amber-600 transition-colors uppercase tracking-tight">{item.name}</span>
                          </button>
                        ))}
                      </div>

                      <div className="mt-10 flex items-center gap-3 mb-6">
                        <div className="h-px flex-1 bg-white/5"></div>
                        <p className="text-[10px] font-black text-stone-400 dark:text-stone-600 uppercase tracking-[0.4em]">Tìm kiếm phổ biến</p>
                        <div className="h-px flex-1 bg-white/5"></div>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {['HS2024', 'Lớp 10A1', 'Học phí qúy 1', 'Nguyễn Văn A'].map(tag => (
                          <button
                            key={tag}
                            onClick={() => { setSearchQuery(tag); }}
                            className="px-5 py-2.5 rounded-xl border border-stone-100 dark:border-white/5 bg-white dark:bg-white/5 hover:border-amber-500 hover:bg-amber-500/10 hover:text-amber-600 transition-all text-xs font-black text-stone-500 dark:text-stone-400"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </>
        )
      }
    </header >
  );
}
