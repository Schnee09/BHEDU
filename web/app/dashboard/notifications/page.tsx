'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  Calendar,
  Check,
  CheckCheck,
  Info,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Trash2,
  Loader2,
  RefreshCw,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  type?: 'info' | 'success' | 'warning' | 'error';
  created_at: string;
}

type FilterTab = 'all' | 'unread' | 'read';

// ─── Icon helpers ─────────────────────────────────────────────────────────────
function NotifIcon({ type, isRead }: { type?: string; isRead: boolean }) {
  if (isRead) {
    return (
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-stone-100 dark:bg-white/5 text-stone-400">
        <Check className="w-5 h-5" />
      </div>
    );
  }
  const map: Record<string, { icon: React.ReactNode; cls: string }> = {
    success: {
      icon: <CheckCircle2 className="w-5 h-5" />,
      cls: 'bg-emerald-500/10 text-emerald-500',
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5" />,
      cls: 'bg-amber-500/10 text-amber-500',
    },
    error: {
      icon: <XCircle className="w-5 h-5" />,
      cls: 'bg-red-500/10 text-red-500',
    },
    info: {
      icon: <Info className="w-5 h-5" />,
      cls: 'bg-blue-500/10 text-blue-500',
    },
  };
  const config = (map[type ?? 'info'] ?? map['info'])!;
  return (
    <div
      className={cn(
        'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:rotate-3',
        config.cls
      )}
    >
      {config.icon}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const supabase = createClient();

  // ── Fetch from API ──────────────────────────────────────────────────────────
  const loadNotifications = useCallback(
    async (showRefreshing = false) => {
      if (showRefreshing) setRefreshing(true);
      try {
        const params = new URLSearchParams({ limit: '50' });
        if (filter === 'unread') params.set('is_read', 'false');
        if (filter === 'read') params.set('is_read', 'true');

        const res = await fetch(`/api/notifications?${params}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();
        setNotifications(json.notifications ?? []);
      } catch (err) {
        console.error('Failed to load notifications:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filter]
  );

  useEffect(() => {
    setLoading(true);
    loadNotifications();
  }, [loadNotifications]);

  // ── Realtime subscription ───────────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('notifications-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () =>
        loadNotifications()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  // ── Mark one as read ────────────────────────────────────────────────────────
  const markAsRead = async (id: string) => {
    const n = notifications.find((x) => x.id === id);
    if (!n || n.is_read) return;

    // Optimistic update
    setNotifications((prev) => prev.map((x) => (x.id === id ? { ...x, is_read: true } : x)));

    try {
      await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
    } catch {
      // revert on failure
      setNotifications((prev) => prev.map((x) => (x.id === id ? { ...x, is_read: false } : x)));
    }
  };

  // ── Mark all as read ────────────────────────────────────────────────────────
  const markAllAsRead = async () => {
    setMarkingAll(true);
    const prev = [...notifications];
    setNotifications((ns) => ns.map((n) => ({ ...n, is_read: true })));

    try {
      const res = await fetch('/api/notifications', { method: 'PATCH' });
      if (!res.ok) throw new Error();
    } catch {
      setNotifications(prev);
    } finally {
      setMarkingAll(false);
    }
  };

  // ── Delete one ──────────────────────────────────────────────────────────────
  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
    const prev = [...notifications];
    setNotifications((ns) => ns.filter((n) => n.id !== id));

    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
    } catch {
      setNotifications(prev);
    } finally {
      setDeletingId(null);
    }
  };

  // ── Derived ─────────────────────────────────────────────────────────────────
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const TABS: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'Tất cả' },
    { key: 'unread', label: 'Chưa đọc' },
    { key: 'read', label: 'Đã đọc' },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500 mx-auto" />
        <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.3em]">
          Đang tải thông báo...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-stone-200/50 dark:border-white/5">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-amber-500 rounded-full" />
            <h1 className="text-3xl md:text-5xl font-serif font-black text-stone-900 dark:text-stone-100 uppercase tracking-tight">
              Trung tâm <span className="text-amber-500">Thông báo</span>
            </h1>
          </div>
          <p className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em] pl-4">
            Cập nhật những diễn biến quan trọng từ hệ thống
          </p>
        </div>

        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <Badge
              variant="default"
              className="px-3 py-1 bg-amber-500/10 text-amber-600 font-bold uppercase tracking-widest text-[9px] border-none"
            >
              {unreadCount} chưa đọc
            </Badge>
          )}
          <button
            onClick={() => loadNotifications(true)}
            disabled={refreshing}
            className="p-2 rounded-xl bg-stone-100 dark:bg-white/5 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-white/10 transition-all"
            title="Làm mới"
          >
            <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* ── Filter Tabs + Mark All ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-1 bg-stone-100 dark:bg-white/5 p-1 rounded-2xl">
          <Filter className="w-3.5 h-3.5 text-stone-400 ml-2" />
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={cn(
                'px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
                filter === tab.key
                  ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-sm'
                  : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            disabled={markingAll}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all"
          >
            {markingAll ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCheck className="w-3.5 h-3.5" />
            )}
            Đọc tất cả
          </button>
        )}
      </div>

      {/* ── List ── */}
      {notifications.length === 0 ? (
        <div className="py-24 text-center space-y-6">
          <div className="w-20 h-20 bg-stone-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto border border-dashed border-stone-200 dark:border-white/10">
            <Bell className="w-10 h-10 text-stone-300" />
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-serif font-black text-stone-900 dark:text-white uppercase tracking-tight">
              Hộp thư trống
            </p>
            <p className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.3em]">
              {filter === 'unread'
                ? 'Bạn đã đọc tất cả thông báo'
                : 'Hiện tại không có thông báo nào'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => markAsRead(notification.id)}
              className={cn(
                'group relative overflow-hidden transition-all duration-300 cursor-pointer rounded-2xl border',
                notification.is_read
                  ? 'bg-white/40 dark:bg-stone-900/40 border-stone-100 dark:border-white/5 opacity-75'
                  : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-white/10 shadow-sm hover:border-amber-500/40 hover:shadow-md'
              )}
            >
              {/* Unread stripe */}
              {!notification.is_read && (
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 rounded-l-2xl" />
              )}

              <div className="p-5 flex items-start gap-4">
                <NotifIcon type={notification.type} isRead={notification.is_read} />

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-4">
                    <h3
                      className={cn(
                        'font-black uppercase tracking-tight truncate transition-colors',
                        notification.is_read
                          ? 'text-stone-500 dark:text-stone-400 text-sm'
                          : 'text-stone-900 dark:text-white text-base group-hover:text-amber-600'
                      )}
                    >
                      {notification.title}
                    </h3>
                    {!notification.is_read && (
                      <Badge
                        variant="warning"
                        className="text-[8px] px-1.5 py-0 animate-pulse flex-shrink-0"
                      >
                        MỚI
                      </Badge>
                    )}
                  </div>

                  <p
                    className={cn(
                      'text-xs leading-relaxed',
                      notification.is_read
                        ? 'text-stone-400 dark:text-stone-500 font-medium'
                        : 'text-stone-600 dark:text-stone-300 font-semibold'
                    )}
                  >
                    {notification.message}
                  </p>

                  <div className="flex items-center gap-3 pt-2">
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(notification.created_at).toLocaleString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    {notification.is_read && (
                      <div className="flex items-center gap-1 text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                        <Check className="w-3 h-3" /> Đã đọc
                      </div>
                    )}
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => deleteNotification(notification.id, e)}
                  disabled={deletingId === notification.id}
                  className="flex-shrink-0 self-center p-2 rounded-xl text-stone-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all duration-200"
                  title="Xóa thông báo"
                >
                  {deletingId === notification.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
