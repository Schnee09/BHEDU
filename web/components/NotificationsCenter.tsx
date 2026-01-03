"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, Trash2, X, ExternalLink } from "lucide-react";
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

export default function NotificationsCenter() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef<HTMLDivElement>(null);

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
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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
            setIsOpen(false);
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

    const typeColors = {
        info: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",
        success: "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400",
        warning: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400",
        error: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400",
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2.5 rounded-xl transition-all cursor-pointer
          bg-stone-100 text-stone-700 border border-stone-200 hover:bg-stone-200
          dark:bg-stone-800 dark:text-stone-200 dark:border-stone-600 dark:hover:bg-stone-700"
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Thông báo</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                                Đánh dấu tất cả đã đọc
                            </button>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-[400px] overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center">
                                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>Không có thông báo</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <button
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`w-full p-4 text-left border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${!notification.is_read ? "bg-indigo-50/50 dark:bg-indigo-900/10" : ""
                                        }`}
                                >
                                    <div className="flex gap-3">
                                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!notification.is_read ? "bg-indigo-500" : "bg-transparent"
                                            }`} />
                                        <div className="flex-1 min-w-0">
                                            <p className={`font-medium text-sm ${!notification.is_read ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"
                                                }`}>
                                                {notification.title}
                                            </p>
                                            {notification.message && (
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[notification.type]}`}>
                                                    {notification.category === "grade" ? "Điểm" :
                                                        notification.category === "attendance" ? "Điểm danh" :
                                                            notification.category === "class" ? "Lớp học" : "Hệ thống"}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    {getTimeAgo(notification.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                        {notification.link && (
                                            <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                        )}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="p-3 border-t border-gray-100 dark:border-gray-700">
                            <button
                                onClick={() => {
                                    router.push("/dashboard/notifications");
                                    setIsOpen(false);
                                }}
                                className="w-full text-center text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
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
