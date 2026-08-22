'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Bell,
  Check,
  CheckCheck,
  Info,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Trash2,
  X,
  ArrowRight,
  Filter,
} from 'lucide-react';
import Link from 'next/link';

interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  type?: 'info' | 'success' | 'warning' | 'error';
  created_at: string;
}

function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  unreadCount: number;
  markAllAsRead: () => void;
  markAsRead: (id: string) => void;
  deleteNotification?: (id: string) => void;
}

function NotifIcon({ type, isRead }: { type?: string; isRead: boolean }) {
  if (isRead) {
    return (
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-stone-100 dark:bg-white/5 text-stone-400">
        <Check className="w-3.5 h-3.5" />
      </div>
    );
  }
  const map: Record<string, { icon: React.ReactNode; cls: string }> = {
    success: {
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      cls: 'bg-emerald-500/10 text-emerald-500',
    },
    warning: {
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
      cls: 'bg-amber-500/10 text-amber-500',
    },
    error: {
      icon: <XCircle className="w-3.5 h-3.5" />,
      cls: 'bg-rose-500/10 text-rose-500',
    },
    info: {
      icon: <Info className="w-3.5 h-3.5" />,
      cls: 'bg-blue-500/10 text-blue-500',
    },
  };
  const config = (map[type ?? 'info'] ?? map['info'])!;
  return (
    <div
      className={cn(
        'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105',
        config.cls
      )}
    >
      {config.icon}
    </div>
  );
}

export function NotificationsPanel({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  markAllAsRead,
  markAsRead,
  deleteNotification,
}: NotificationsPanelProps) {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter((n) => (filter === 'unread' ? !n.is_read : true));

  return (
    <>
      <div
        className="fixed inset-0 z-[100] bg-black/60 md:bg-transparent"
        onClick={onClose}
      />
      <div
        className={cn(
          'fixed inset-x-4 bottom-4 z-[110] md:absolute md:inset-auto md:right-0 md:top-full md:mt-3 md:w-[420px] md:max-h-[600px]',
          'bg-white dark:bg-[#14120E] border-2 border-stone-200 dark:border-stone-800 shadow-2xl',
          'rounded-3xl transition-all duration-200 animate-scale-in origin-top-right flex flex-col overflow-hidden font-["Be_Vietnam_Pro"]',
          'pb-safe md:pb-0'
        )}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-[#1A1814]">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-black text-sm text-stone-900 dark:text-white tracking-tight">
                Thông báo
              </span>
              {unreadCount > 0 && (
                <div className="px-2 py-0.5 rounded-full bg-amber-500 text-[10px] font-black text-white">
                  {unreadCount} mới
                </div>
              )}
            </div>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
              Trung tâm cập nhật hệ thống
            </p>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500 hover:text-white text-[10px] font-black uppercase transition-all flex items-center gap-1"
                title="Đánh dấu tất cả đã đọc"
              >
                <CheckCheck className="w-3 h-3" />
                Đã đọc hết
              </button>
            )}
            <button
              onClick={onClose}
              className="md:hidden p-1.5 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-[#1A1814]">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              'px-3 py-1 rounded-lg text-xs font-bold transition-all',
              filter === 'all'
                ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-sm'
                : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white'
            )}
          >
            Tất cả ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={cn(
              'px-3 py-1 rounded-lg text-xs font-bold transition-all',
              filter === 'unread'
                ? 'bg-white dark:bg-stone-800 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white'
            )}
          >
            Chưa đọc ({unreadCount})
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto max-h-[60vh] md:max-h-[420px] divide-y divide-stone-100 dark:divide-stone-800/60 custom-scrollbar bg-white dark:bg-[#14120E]">
          {filteredNotifications.length === 0 ? (
            <div className="px-6 py-16 text-center space-y-2">
              <div className="w-12 h-12 bg-stone-100 dark:bg-stone-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Bell className="w-6 h-6 text-stone-400" />
              </div>
              <p className="font-bold text-xs text-stone-900 dark:text-white">
                {filter === 'unread' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào'}
              </p>
              <p className="text-[11px] text-stone-400">Bạn đã cập nhật hết mọi tin tức từ trung tâm.</p>
            </div>
          ) : (
            <div>
              {filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={cn(
                    'px-4 py-3.5 transition-all relative group',
                    !notif.is_read
                      ? 'bg-amber-500/5 hover:bg-amber-500/10'
                      : 'hover:bg-stone-50 dark:hover:bg-[#1C1A16]'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="cursor-pointer" onClick={() => markAsRead(notif.id)}>
                      <NotifIcon type={notif.type} isRead={notif.is_read} />
                    </div>

                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center justify-between mb-0.5">
                        <p
                          className={cn(
                            'font-bold text-xs truncate',
                            !notif.is_read
                              ? 'text-stone-950 dark:text-white'
                              : 'text-stone-600 dark:text-stone-400'
                          )}
                          onClick={() => markAsRead(notif.id)}
                        >
                          {notif.title}
                        </p>
                        <span className="text-[9px] font-bold text-stone-400">
                          {getRelativeTime(notif.created_at)}
                        </span>
                      </div>
                      <p
                        className={cn(
                          'text-[11px] line-clamp-2 leading-relaxed cursor-pointer',
                          !notif.is_read
                            ? 'text-stone-700 dark:text-stone-300 font-medium'
                            : 'text-stone-400'
                        )}
                        onClick={() => markAsRead(notif.id)}
                      >
                        {notif.message}
                      </p>
                    </div>

                    {/* Delete button on hover */}
                    {deleteNotification && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notif.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-stone-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all absolute right-2 top-3"
                        title="Xóa thông báo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-[#1A1814]">
          <Link
            href="/dashboard/notifications"
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl bg-stone-900 hover:bg-stone-800 dark:bg-amber-500 dark:hover:bg-amber-600 text-white font-bold text-xs transition-all active:scale-95 shadow-sm"
          >
            Xem tất cả thông báo
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </>
  );
}
