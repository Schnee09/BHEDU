'use client';

import React from 'react';
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
  Mail,
  X,
  ArrowRight,
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
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-stone-100 dark:bg-white/5 text-stone-400">
        <Check className="w-4 h-4" />
      </div>
    );
  }
  const map: Record<string, { icon: React.ReactNode; cls: string }> = {
    success: {
      icon: <CheckCircle2 className="w-4 h-4" />,
      cls: 'bg-emerald-500/10 text-emerald-500',
    },
    warning: {
      icon: <AlertTriangle className="w-4 h-4" />,
      cls: 'bg-amber-500/10 text-amber-500',
    },
    error: {
      icon: <XCircle className="w-4 h-4" />,
      cls: 'bg-red-500/10 text-red-500',
    },
    info: {
      icon: <Info className="w-4 h-4" />,
      cls: 'bg-blue-500/10 text-blue-500',
    },
  };
  const config = (map[type ?? 'info'] ?? map['info'])!;
  return (
    <div
      className={cn(
        'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:rotate-3',
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
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm animate-fade-in md:bg-transparent md:backdrop-blur-none"
        onClick={onClose}
      />
      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-[110] md:absolute md:inset-auto md:right-0 md:top-full md:mt-4 md:w-[420px] md:max-h-[600px]',
          'bg-white dark:bg-[#1C1A16] border-t md:border border-white/10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)]',
          'rounded-t-[32px] md:rounded-[24px] transition-all duration-500 ease-out animate-fade-in-up flex flex-col overflow-hidden',
          'pb-safe md:pb-0'
        )}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-stone-50/50 dark:bg-white/5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-black text-xl text-stone-900 dark:text-white tracking-tight">
                Thông báo
              </span>
              {unreadCount > 0 && (
                <div className="px-2 py-0.5 rounded-full bg-amber-500 text-[10px] font-black text-white shadow-amber-glow">
                  {unreadCount}
                </div>
              )}
            </div>
            <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">
              Trung tâm cập nhật hệ thống
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={() => {
                  markAllAsRead();
                }}
                className="p-2 rounded-xl bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white transition-all group"
                title="Đọc tất cả"
              >
                <CheckCheck className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="md:hidden p-2 rounded-xl bg-stone-100 dark:bg-white/5 text-stone-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto max-h-[70vh] md:max-h-[480px] overscroll-contain">
          {notifications.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <div className="w-16 h-16 bg-stone-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 transform -rotate-12">
                <Bell className="w-8 h-8 text-stone-300 dark:text-stone-600" />
              </div>
              <p className="font-black text-stone-900 dark:text-white uppercase tracking-tight">
                Hộp thư trống
              </p>
              <p className="text-[10px] font-bold text-stone-500 mt-2 uppercase tracking-widest">
                Bạn đã xử lý hết mọi thông báo.
              </p>
            </div>
          ) : (
            <div className="py-2">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={cn(
                    'px-4 py-4 transition-all relative group border-b border-white/5 last:border-0',
                    !notif.is_read
                      ? 'bg-amber-500/[0.03] hover:bg-amber-500/[0.06]'
                      : 'hover:bg-stone-50 dark:hover:bg-white/5'
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="cursor-pointer" onClick={() => markAsRead(notif.id)}>
                      <NotifIcon type={notif.type} isRead={notif.is_read} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p
                          className={cn(
                            'font-black text-sm tracking-tight truncate pr-8',
                            !notif.is_read
                              ? 'text-stone-900 dark:text-white'
                              : 'text-stone-600 dark:text-stone-400'
                          )}
                          onClick={() => markAsRead(notif.id)}
                        >
                          {notif.title}
                        </p>
                        <span className="text-[9px] font-bold text-stone-400 absolute right-4 top-4">
                          {getRelativeTime(notif.created_at)}
                        </span>
                      </div>
                      <p
                        className={cn(
                          'text-xs line-clamp-2 leading-relaxed cursor-pointer',
                          !notif.is_read
                            ? 'text-stone-600 dark:text-stone-300 font-semibold'
                            : 'text-stone-500 dark:text-stone-500'
                        )}
                        onClick={() => markAsRead(notif.id)}
                      >
                        {notif.message}
                      </p>
                    </div>

                    {/* Delete button (visible on hover) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification?.(notif.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-2 rounded-xl text-stone-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all absolute right-2 bottom-2"
                      title="Xóa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-stone-50/50 dark:bg-white/5">
          <Link
            href="/dashboard/notifications"
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] transition-all shadow-lg active:scale-95"
          >
            Xem tất cả thông báo
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </>
  );
}
