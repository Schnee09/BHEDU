"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Home,
    Users,
    BookOpen,
    CalendarCheck,
    MoreHorizontal,
    X,
    DollarSign,
    GraduationCap,
    ClipboardList,
    Settings,
    Bell,
    Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProfile } from "@/hooks/useProfile";
import { useCustomization } from "@/contexts/CustomizationContext";

export default function MobileBottomNav() {
    const pathname = usePathname();
    const { profile } = useProfile();
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const { accentColor } = useCustomization();

    const role = profile?.role as string;

    // Define navigation items based on role
    const mainNavItems = [
        { name: "Trang chủ", href: "/dashboard", icon: Home, color: "var(--color-primary)" },
    ];

    if (role === 'parent') {
        mainNavItems.push(
            { name: "Của tôi", href: "/dashboard/parent", icon: GraduationCap, color: "orange" },

            { name: "Lịch học", href: "/dashboard/timetable", icon: CalendarCheck, color: "blue" }
        );
    } else if (role === 'student') {
        mainNavItems.push(
            { name: "Điểm số", href: "/dashboard/grades", icon: GraduationCap, color: "orange" },
            { name: "Lịch học", href: "/dashboard/timetable", icon: CalendarCheck, color: "blue" },
            { name: "Thông báo", href: "/dashboard/notifications", icon: Bell, color: "orange" }
        );
    } else if (role === 'teacher' || role === 'tutor') {
        mainNavItems.push(
            { name: "Lịch dạy", href: "/dashboard/timetable", icon: CalendarCheck, color: "blue" },
            { name: "Lớp học", href: "/dashboard/classes", icon: BookOpen, color: "orange" },
            { name: "Điểm danh", href: "/dashboard/attendance", icon: Users, color: "green" }
        );
    } else {
        // Admin/Staff/Super_admin default
        mainNavItems.push(
            { name: "Lớp", href: "/dashboard/classes", icon: BookOpen, color: "blue" },
            { name: "Học sinh", href: "/dashboard/students", icon: Users, color: "orange" },
            { name: "Điểm danh", href: "/dashboard/attendance", icon: CalendarCheck, color: "green" }
        );
    }

    const moreMenuItems = [

        { name: "Điểm số", href: "/dashboard/grades", icon: GraduationCap, color: "orange" },
        { name: "Thời khóa biểu", href: "/dashboard/timetable", icon: ClipboardList, color: "blue" },
        { name: "Thông báo", href: "/dashboard/notifications", icon: Bell, color: "orange" },
        { name: "Tìm kiếm", href: "/dashboard/search", icon: Search, color: "slate" },
        { name: "Cài đặt", href: "/dashboard/settings", icon: Settings, color: "slate" },
    ];

    const isActive = (href: string) => {
        if (href === "/dashboard") return pathname === "/dashboard";
        return pathname?.startsWith(href);
    };

    return (
        <div className="lg:hidden">
            {/* More Menu Overlay */}
            {showMoreMenu && (
                <div
                    className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-md animate-fade-in"
                    onClick={() => setShowMoreMenu(false)}
                />
            )}

            {/* swipeable More Menu - Academic Refined */}
            <div className={cn(
                "fixed bottom-0 left-0 right-0 z-[110] transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] px-4 pb-12",
                showMoreMenu ? "translate-y-0" : "translate-y-full"
            )}>
                <div className="glass-premium rounded-t-[40px] rounded-b-[20px] shadow-2xl pb-safe overflow-hidden border border-white/20 dark:border-white/5 relative">
                    {/* Background Decorative Bloom */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2" />

                    <div className="flex justify-center pt-4 pb-2">
                        <div className="w-16 h-2 bg-stone-200 dark:bg-stone-800 rounded-full" />
                    </div>

                    <button
                        onClick={() => setShowMoreMenu(false)}
                        className="absolute top-6 right-6 p-2.5 rounded-2xl bg-stone-100 dark:bg-white/10 text-stone-500 press-effect shadow-sm"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <h3 className="text-[11px] font-black text-center text-stone-400 dark:text-stone-500 uppercase tracking-[0.4em] mb-10 mt-4 leading-none">Trung tâm dịch vụ</h3>

                    <div className="grid grid-cols-3 gap-4 px-8 pb-12">
                        {moreMenuItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setShowMoreMenu(false)}
                                className={cn(
                                    "group relative flex flex-col items-center justify-center p-6 rounded-[32px] transition-all press-effect overflow-hidden border",
                                    isActive(item.href)
                                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-500/20 shadow-lg"
                                        : "bg-stone-50/50 dark:bg-white/5 text-stone-600 dark:text-stone-400 border-stone-100 dark:border-white/5"
                                )}
                            >
                                {/* Item Glow */}
                                <div className={cn(
                                    "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity blur-xl rounded-full",
                                    item.color === 'orange' ? 'bg-orange-500' :
                                        item.color === 'blue' ? 'bg-blue-500' :
                                            item.color === 'emerald' ? 'bg-emerald-500' :
                                                item.color === 'green' ? 'bg-green-500' : 'bg-stone-500'
                                )} />

                                <div className={cn(
                                    "p-3 rounded-2xl mb-2 transition-all group-hover:scale-110",
                                    item.color === 'orange' ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400' :
                                        item.color === 'blue' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                                            item.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                                item.color === 'green' ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-stone-500/10 text-stone-500'
                                )}>
                                    <item.icon className="w-6 h-6" strokeWidth={2} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-tighter text-center">{item.name}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Bottom Navigation - Dashboard Floating Pill */}
            <div className="fixed bottom-6 left-6 right-6 h-20 z-[100] animate-fade-in-up">
                <nav className="glass-premium h-full w-full rounded-[28px] shadow-2xl shadow-black/10 flex items-center justify-around px-2 border-t border-white/20 dark:border-white/5">
                    {mainNavItems.map((item) => {
                        const active = isActive(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "relative flex flex-col items-center justify-center flex-1 h-full py-1 transition-all press-effect z-10",
                                    active ? "text-stone-900 dark:text-white" : "text-stone-400 dark:text-stone-600"
                                )}
                                style={active ? { color: 'var(--color-primary)' } : {}}
                            >
                                <div className={cn(
                                    "p-2.5 rounded-[18px] transition-all duration-500",
                                    active ? "scale-110 mb-1" : "bg-transparent mb-0.5"
                                )}
                                    style={active ? { backgroundColor: 'var(--color-primary-10)' } : {}}
                                >
                                    <item.icon
                                        className={cn("w-6 h-6", active ? "stroke-[2.5px]" : "stroke-[1.5px]")}
                                    />
                                </div>
                                <span className={cn(
                                    "text-[9px] font-black uppercase tracking-widest transition-all duration-300",
                                    active ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 h-0"
                                )}>
                                    {item.name}
                                </span>

                                {active && (
                                    <div className="absolute top-2 w-1 h-1 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,166,35,0.8)]" style={{ backgroundColor: 'var(--color-primary)', boxShadow: '0 0 10px var(--color-primary)' }} />
                                )}
                            </Link>
                        );
                    })}

                    {/* Dashboard More Button */}
                    <button
                        onClick={() => setShowMoreMenu(true)}
                        className={cn(
                            "flex flex-col items-center justify-center flex-1 h-full py-1 transition-all press-effect z-10",
                            showMoreMenu ? "" : "text-stone-400 dark:text-stone-600"
                        )}
                        style={showMoreMenu ? { color: 'var(--color-primary)' } : {}}
                    >
                        <div className={cn(
                            "p-2.5 rounded-[18px] transition-all duration-500",
                            showMoreMenu ? "scale-110 mb-1" : "bg-transparent mb-0.5"
                        )}
                            style={showMoreMenu ? { backgroundColor: 'var(--color-primary-10)' } : {}}
                        >
                            <MoreHorizontal className="w-6 h-6" strokeWidth={2.5} />
                        </div>
                        <span className={cn(
                            "text-[9px] font-black uppercase tracking-widest transition-all duration-300",
                            showMoreMenu ? "opacity-100" : "opacity-0 h-0"
                        )}>
                            Thêm
                        </span>
                    </button>
                </nav>
            </div>
        </div>
    );
}

