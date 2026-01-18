"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, BookOpen, CalendarCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MobileBottomNav() {
    const pathname = usePathname();

    const navItems = [
        {
            name: "Trang chủ",
            href: "/dashboard",
            icon: Home,
            activePattern: /^\/dashboard$/, // Strict match for home
        },
        {
            name: "Lớp học",
            href: "/dashboard/classes",
            icon: BookOpen,
            activePattern: /^\/dashboard\/classes/,
        },
        {
            name: "Học sinh",
            href: "/dashboard/students",
            icon: Users,
            activePattern: /^\/dashboard\/students/,
        },
        {
            name: "Điểm danh",
            href: "/dashboard/attendance",
            icon: CalendarCheck,
            activePattern: /^\/dashboard\/attendance/,
        },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-950/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 pb-safe">
            <div className="flex items-center justify-around h-16">
                {navItems.map((item) => {
                    // Check active state
                    const isActive =
                        item.href === "/dashboard"
                            ? pathname === "/dashboard"
                            : pathname?.startsWith(item.href);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full space-y-1",
                                isActive
                                    ? "text-indigo-600 dark:text-indigo-400"
                                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                            )}
                        >
                            <item.icon
                                className={cn("w-6 h-6", isActive && "fill-current/20")}
                                strokeWidth={isActive ? 2.5 : 2}
                            />
                            <span className="text-[10px] font-medium">{item.name}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
