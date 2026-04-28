"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, CheckCheck, AlertTriangle, Info, AlertCircle, ExternalLink, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

interface Notification {
    id: string;
    title: string;
    message: string | null;
    type: "info" | "success" | "warning" | "error";
    category: string;
    link: string | null;
    is_read: boolean;
    created_at: string;
}

// Shimmer skeleton for loading state
const NotificationSkeleton = () => (
    <div className="p-4 border-b border-gray-100 dark:border-gray-700/50">
        <div className="flex gap-3">
            <div className="w-2 h-2 rounded-full mt-2 animate-notification-shimmer bg-gray-200 dark:bg-gray-700" />
            <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded animate-notification-shimmer bg-gray-200 dark:bg-gray-700" />
                <div className="h-3 w-full rounded animate-notification-shimmer bg-gray-200 dark:bg-gray-700" />
                <div className="flex gap-2">
                    <div className="h-5 w-16 rounded-full animate-notification-shimmer bg-gray-200 dark:bg-gray-700" />
                    <div className="h-5 w-20 rounded animate-notification-shimmer bg-gray-200 dark:bg-gray-700" />
                </div>
            </div>
        </div>
    </div>
);

// Empty state illustration
const EmptyStateIllustration = () => (
    <div className="p-8 text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-emerald-100 dark:from-amber-900/30 dark:to-emerald-900/30 rounded-2xl" />
            <div className="absolute inset-0 flex items-center justify-center">
                <Bell className="w-8 h-8 text-amber-500 dark:text-amber-600" />
            </div>
            <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-amber-400" />
        </div>
        <p className="text-gray-600 dark:text-gray-300 font-medium">Không có thông báo mới</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Bạn đã cập nhật mọi thứ!</p>
    </div>
);

// Type icon component
const TypeIcon = ({ type }: { type: Notification["type"] }) => {
    const iconProps = { className: "w-4 h-4" };

    switch (type) {
        case "success":
            return <CheckCheck {...iconProps} className="w-4 h-4 text-emerald-500" />;
        case "warning":
            return <AlertTriangle {...iconProps} className="w-4 h-4 text-amber-500" />;
        case "error":
            return <AlertCircle {...iconProps} className="w-4 h-4 text-red-500" />;
        case "info":
        default:
            return <Info {...iconProps} className="w-4 h-4 text-blue-500" />;
    }
};

export default function NotificationsCenter() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [hasNewNotification, setHasNewNotification] = useState(false);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch notifications
    useEffect(() => {
        const fetchNotifications = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from("notifications")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(20);

            if (!error && data) {
                setNotifications(data);
                setUnreadCount(data.filter((n) => !n.is_read).length);
            }
            setLoading(false);
        };

        fetchNotifications();

        // Subscribe to real-time updates
        const channel = supabase
            .channel("notifications")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "notifications",
                },
                (payload) => {
                    const newNotification = payload.new as Notification;
                    setNotifications((prev) => [newNotification, ...prev]);
                    setUnreadCount((prev) => prev + 1);
                    // Trigger bell animation
                    setHasNewNotification(true);
                    setTimeout(() => setHasNewNotification(false), 1000);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                handleClose();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsOpen(false);
            setIsClosing(false);
        }, 150);
    };

    const handleToggle = () => {
        if (isOpen) {
            handleClose();
        } else {
            setIsOpen(true);
        }
    };

    const markAsRead = async (id: string) => {
        await supabase.from("notifications").update({ is_read: true }).eq("id", id);
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
    };

    const markAllAsRead = async () => {
        const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
        if (unreadIds.length === 0) return;

        await supabase.from("notifications").update({ is_read: true }).in("id", unreadIds);
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.is_read) {
            markAsRead(notification.id);
        }
        if (notification.link) {
            router.push(notification.link);
            handleClose();
        }
    };

    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Vừa xong";
        if (diffMins < 60) return `${diffMins} phút trước`;
        if (diffHours < 24) return `${diffHours} giờ trước`;
        if (diffDays < 7) return `${diffDays} ngày trước`;
        return date.toLocaleDateString("vi-VN");
    };

    const typeStyles = {
        info: {
            bg: "bg-blue-50 dark:bg-blue-900/30",
            text: "text-blue-700 dark:text-blue-300",
            border: "border-blue-100 dark:border-blue-800/50"
        },
        success: {
            bg: "bg-emerald-50 dark:bg-emerald-900/30",
            text: "text-emerald-700 dark:text-emerald-300",
            border: "border-emerald-100 dark:border-emerald-800/50"
        },
        warning: {
            bg: "bg-amber-50 dark:bg-amber-900/30",
            text: "text-amber-700 dark:text-amber-300",
            border: "border-amber-100 dark:border-amber-800/50"
        },
        error: {
            bg: "bg-red-50 dark:bg-red-900/30",
            text: "text-red-700 dark:text-red-300",
            border: "border-red-100 dark:border-red-800/50"
        },
    };

    const categoryLabels: Record<string, string> = {
        grade: "Điểm",
        attendance: "Điểm danh",
        class: "Lớp học",
        system: "Hệ thống"
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={handleToggle}
                className={`
                    relative p-2.5 rounded-xl transition-all cursor-pointer
                    bg-stone-100 text-stone-700 border border-stone-200 hover:bg-stone-200
                    dark:bg-stone-800 dark:text-stone-200 dark:border-stone-600 dark:hover:bg-stone-700
                    ${hasNewNotification ? 'animate-bell-pulse' : ''}
                `}
                aria-label="Thông báo"
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                <Bell className={`w-5 h-5 transition-transform ${unreadCount > 0 ? 'animate-bell-continuous' : ''}`} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-unread-pulse shadow-lg shadow-red-500/30">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div
                    className={`
                        absolute right-0 mt-2 w-80 sm:w-96 
                        bg-white dark:bg-gray-800 
                        rounded-2xl shadow-2xl 
                        border border-gray-200 dark:border-gray-700 
                        overflow-hidden z-50
                        ${isClosing ? 'animate-dropdown-exit' : 'animate-dropdown-enter'}
                    `}
                    role="menu"
                    aria-orientation="vertical"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-750">
                        <div className="flex items-center gap-2">
                            <Bell className="w-5 h-5 text-amber-500" />
                            <h3 className="font-semibold text-gray-900 dark:text-white">Thông báo</h3>
                            {unreadCount > 0 && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 rounded-full">
                                    {unreadCount} mới
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 transition-colors cursor-pointer"
                            >
                                <CheckCheck className="w-3.5 h-3.5" />
                                Đọc tất cả
                            </button>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-[400px] overflow-y-auto">
                        {loading ? (
                            <>
                                <NotificationSkeleton />
                                <NotificationSkeleton />
                                <NotificationSkeleton />
                            </>
                        ) : notifications.length === 0 ? (
                            <EmptyStateIllustration />
                        ) : (
                            notifications.map((notification, index) => (
                                <button
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`
                                        w-full p-4 text-left border-b border-gray-50 dark:border-gray-700/50 
                                        hover:bg-gray-50 dark:hover:bg-gray-700/50 
                                        transition-all duration-200 cursor-pointer
                                        ${!notification.is_read ? "bg-amber-50/50 dark:bg-amber-900/10" : ""}
                                        animate-list-item-enter
                                    `}
                                    style={{ animationDelay: `${Math.min(index, 5) * 0.05}s`, opacity: 0 }}
                                    role="menuitem"
                                >
                                    <div className="flex gap-3">
                                        {/* Unread indicator */}
                                        <div className={`
                                            w-2 h-2 rounded-full mt-2 flex-shrink-0 transition-all
                                            ${!notification.is_read
                                                ? "bg-amber-500 shadow-md shadow-amber-500/50"
                                                : "bg-transparent"
                                            }
                                        `} />

                                        <div className="flex-1 min-w-0">
                                            <p className={`
                                                font-medium text-sm leading-tight
                                                ${!notification.is_read
                                                    ? "text-gray-900 dark:text-white"
                                                    : "text-gray-700 dark:text-gray-300"
                                                }
                                            `}>
                                                {notification.title}
                                            </p>

                                            {notification.message && (
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-snug">
                                                    {notification.message}
                                                </p>
                                            )}

                                            <div className="flex items-center gap-2 mt-2">
                                                {/* Type badge with icon */}
                                                <span className={`
                                                    inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md border
                                                    ${typeStyles[notification.type].bg}
                                                    ${typeStyles[notification.type].text}
                                                    ${typeStyles[notification.type].border}
                                                `}>
                                                    <TypeIcon type={notification.type} />
                                                    {categoryLabels[notification.category] || "Thông báo"}
                                                </span>

                                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                                    {getTimeAgo(notification.created_at)}
                                                </span>
                                            </div>
                                        </div>

                                        {notification.link && (
                                            <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                                        )}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="p-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                            <button
                                onClick={() => {
                                    router.push("/dashboard/notifications");
                                    handleClose();
                                }}
                                className="w-full text-center text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 transition-colors cursor-pointer py-1 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20"
                            >
                                Xem tất cả thông báo
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
