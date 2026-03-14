"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { BellIcon } from "@heroicons/react/24/outline";

interface Notification {
    id: string;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
}

interface NotificationsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    notifications: Notification[];
    unreadCount: number;
    markAllAsRead: () => void;
    markAsRead: (id: string) => void;
}

export function NotificationsPanel({
    isOpen,
    onClose,
    notifications,
    unreadCount,
    markAllAsRead,
    markAsRead
}: NotificationsPanelProps) {
    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm animate-fade-in md:bg-transparent md:backdrop-blur-none" onClick={onClose} />
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
                        onClick={() => { markAllAsRead(); onClose(); }}
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
                    <button onClick={onClose} className="w-full py-4 rounded-2xl bg-stone-100 dark:bg-white/5 font-black text-stone-900 dark:text-white uppercase tracking-widest text-xs">ĐÓNG</button>
                </div>
            </div>
        </>
    );
}
