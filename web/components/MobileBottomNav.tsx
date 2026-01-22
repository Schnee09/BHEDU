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
        {
            name: "Trang chủ",
            href: "/dashboard",
            icon: Home,
        },
        {
            name: "Lớp",
            href: "/dashboard/classes",
            icon: BookOpen,
        },
        {
            name: "Học sinh",
            href: "/dashboard/students",
            icon: Users,
        },
        {
            name: "Điểm danh",
            href: "/dashboard/attendance",
            icon: CalendarCheck,
        },
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
        <>
            {/* More Menu Overlay */}
            {showMoreMenu && (
                <div 
                    className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-fade-in"
                    onClick={() => setShowMoreMenu(false)}
                />
            )}

            {/* Swipeable More Menu */}
            <div className={cn(
                "lg:hidden fixed bottom-1 left-0 right-0 z-50 transition-transform duration-500 ease-out px-4 pb-20",
                showMoreMenu ? "translate-y-0" : "translate-y-full"
            )}>
                <div className="glass-premium rounded-[32px] shadow-2xl pb-safe overflow-hidden border border-white/20 dark:border-white/5">
                    {/* Handle bar for swipe indication */}
                    <div className="flex justify-center pt-3 pb-2">
                        <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full" />
                    </div>

                    {/* Close button */}
                    <button 
                        onClick={() => setShowMoreMenu(false)}
                        className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Menu Title */}
                    <h3 className="text-lg font-bold text-center text-gray-900 dark:text-white mb-4">
                        Thêm
                    </h3>

                    {/* Menu Grid */}
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
                                        : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
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
            <div className="lg:hidden nav-pill glass-premium shadow-lg shadow-black/10 transition-all duration-300">
                <div className="flex items-center justify-around w-full h-full relative">
                    {/* Sliding Indicator Background */}
                    <div 
                        className="nav-indicator"
                        style={{ 
                            width: `${100 / (mainNavItems.length + 1)}%`,
                            left: showMoreMenu 
                                ? `${(mainNavItems.length / (mainNavItems.length + 1)) * 100}%` 
                                : `${(mainNavItems.findIndex(item => isActive(item.href)) / (mainNavItems.length + 1)) * 100}%`
                        }}
                    />

                    {mainNavItems.map((item) => {
                        const active = isActive(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex flex-col items-center justify-center flex-1 h-full py-1 transition-all active:scale-90 z-10",
                                    active
                                        ? "text-amber-600 dark:text-amber-500"
                                        : "text-stone-500 dark:text-stone-400 group-hover:text-stone-700"
                                )}
                            >
                                <div className="mb-0.5">
                                    <item.icon 
                                        className={cn(
                                            "w-6 h-6 transition-all duration-300",
                                            active ? "scale-110" : "scale-100 opacity-80"
                                        )} 
                                        strokeWidth={active ? 2.5 : 2}
                                    />
                                </div>
                                <span className={cn(
                                    "text-[9px] font-bold uppercase tracking-wider transition-all duration-300",
                                    active ? "opacity-100" : "opacity-0 scale-75 h-0"
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
                            showMoreMenu
                                ? "text-amber-600 dark:text-amber-500"
                                : "text-stone-500 dark:text-stone-400"
                        )}
                    >
                        <div className="mb-0.5">
                            <MoreHorizontal className={cn(
                                "w-6 h-6 transition-all duration-300",
                                showMoreMenu ? "scale-110" : "scale-100 opacity-80"
                            )} strokeWidth={2.5} />
                        </div>
                        <span className={cn(
                            "text-[9px] font-bold uppercase tracking-wider transition-all duration-300",
                            showMoreMenu ? "opacity-100" : "opacity-0 scale-75 h-0"
                        )}>
                            Thêm
                        </span>
                    </button>
                </div>
            </div>
        </>
    );
}
