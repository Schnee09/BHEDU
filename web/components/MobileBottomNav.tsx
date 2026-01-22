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

export default function MobileBottomNav() {
    const pathname = usePathname();
    const [showMoreMenu, setShowMoreMenu] = useState(false);

    const mainNavItems = [
        { name: "Trang chủ", href: "/dashboard", icon: Home },
        { name: "Lớp", href: "/dashboard/classes", icon: BookOpen },
        { name: "Học sinh", href: "/dashboard/students", icon: Users },
        { name: "Điểm danh", href: "/dashboard/attendance", icon: CalendarCheck },
    ];

    const moreMenuItems = [
        { name: "Tài chính", href: "/dashboard/finance", icon: DollarSign },
        { name: "Điểm số", href: "/dashboard/grades", icon: GraduationCap },
        { name: "Thời khóa biểu", href: "/dashboard/timetable", icon: ClipboardList },
        { name: "Thông báo", href: "/dashboard/notifications", icon: Bell },
        { name: "Tìm kiếm", href: "/dashboard/search", icon: Search },
        { name: "Cài đặt", href: "/dashboard/settings", icon: Settings },
    ];

    const isActive = (href: string) => {
        if (href === "/dashboard") return pathname === "/dashboard";
        return pathname?.startsWith(href);
    };

    return (
        <div className="lg:hidden"> {/* Wrapper ensuring everything hides on desktop */}
            {/* More Menu Overlay */}
            {showMoreMenu && (
                <div 
                    className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md animate-fade-in"
                    onClick={() => setShowMoreMenu(false)}
                />
            )}

            {/* Swipeable More Menu */}
            <div className={cn(
                "fixed bottom-1 left-0 right-0 z-[110] transition-transform duration-500 ease-out px-4 pb-20",
                showMoreMenu ? "translate-y-0" : "translate-y-full"
            )}>
                <div className="glass-premium rounded-[32px] shadow-2xl pb-safe overflow-hidden border border-white/20 dark:border-white/5">
                    <div className="flex justify-center pt-3 pb-2">
                        <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full" />
                    </div>

                    <button 
                        onClick={() => setShowMoreMenu(false)}
                        className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <h3 className="text-lg font-bold text-center text-gray-900 dark:text-white mb-4">Thêm</h3>

                    <div className="grid grid-cols-3 gap-4 px-6 pb-6">
                        {moreMenuItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setShowMoreMenu(false)}
                                className={cn(
                                    "flex flex-col items-center justify-center p-4 rounded-2xl transition-all active:scale-95",
                                    isActive(item.href)
                                        ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                                        : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                                )}
                            >
                                <item.icon className="w-7 h-7 mb-2" strokeWidth={1.5} />
                                <span className="text-xs font-medium text-center">{item.name}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Bottom Navigation - Floating Pill */}
            <div className="nav-pill glass-premium shadow-lg shadow-black/10 transition-all duration-300 z-[100]">
                <div className="flex items-center justify-around w-full h-full relative">
                    {mainNavItems.map((item) => {
                        const active = isActive(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex flex-col items-center justify-center flex-1 h-full py-1 transition-all active:scale-90 z-10",
                                    active ? "text-amber-600 dark:text-amber-500" : "text-stone-500 dark:text-stone-400"
                                )}
                            >
                                <item.icon 
                                    className={cn("w-6 h-6 mb-0.5", active ? "scale-110" : "opacity-80")} 
                                    strokeWidth={active ? 2.5 : 2}
                                />
                                <span className={cn(
                                    "text-[10px] font-bold transition-all",
                                    active ? "opacity-100 translate-y-0" : "opacity-0 scale-75 -translate-y-1 h-0"
                                )}>
                                    {item.name}
                                </span>
                            </Link>
                        );
                    })}

                    {/* More Button */}
                    <button
                        onClick={() => setShowMoreMenu(true)}
                        className={cn(
                            "flex flex-col items-center justify-center flex-1 h-full py-1 transition-all active:scale-90 z-10",
                            showMoreMenu ? "text-amber-600 dark:text-amber-500" : "text-stone-500 dark:text-stone-400"
                        )}
                    >
                        <MoreHorizontal className={cn("w-6 h-6 mb-0.5", showMoreMenu ? "scale-110" : "opacity-80")} strokeWidth={2.5} />
                        <span className={cn(
                            "text-[10px] font-bold transition-all",
                            showMoreMenu ? "opacity-100" : "opacity-0 h-0"
                        )}>
                            Thêm
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}
