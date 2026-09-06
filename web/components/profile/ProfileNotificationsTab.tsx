'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Bell, CheckCheck, Loader2, BellOff, Inbox, Trash2, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  category?: string;
  link?: string;
}

const TYPE_STYLES: Record<string, { dot: string; label: string }> = {
  info: { dot: 'bg-blue-400 shadow-blue-400/50', label: 'Thông tin' },
  success: { dot: 'bg-emerald-400 shadow-emerald-400/50', label: 'Học vụ' },
  warning: { dot: 'bg-amber-400 shadow-amber-400/50', label: 'Cảnh báo' },
  error: { dot: 'bg-red-400 shadow-red-400/50', label: 'Lỗi' },
  system: { dot: 'bg-stone-400', label: 'Hệ thống' },
};

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function ProfileNotificationsTab() {
  const router = useRouter();
  const toast = useToast();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const PAGE_SIZE = 12;

  const load = useCallback(
    async (p = 1, f = filter) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: String(PAGE_SIZE), page: String(p) });
        if (f === 'unread') params.set('is_read', 'false');
        const res = await fetch(`/api/notifications?${params}`);
        if (!res.ok) throw new Error();
        const json = await res.json();
        setItems(json.notifications ?? []);
        setTotal(json.pagination?.total ?? 0);
        setPage(p);
      } catch {
        toast.error('Không thể tải', 'Danh sách thông báo tạm thời không khả dụng.');
      } finally {
        setLoading(false);
      }
    },
    [filter]
  );

  useEffect(() => {
    load(1, filter);
  }, [filter]);

  const markAll = async () => {
    setMarkingAll(true);
    try {
      const res = await fetch('/api/notifications', { method: 'PATCH' });
      if (!res.ok) throw new Error();
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success('Đã đánh dấu', 'Tất cả thông báo đã được đọc.');
    } catch {
      toast.error('Thất bại', 'Không thể đánh dấu đã đọc.');
    } finally {
      setMarkingAll(false);
    }
  };

  const markOne = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_read: true }),
      });
      if (!res.ok) throw new Error();
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch {
      // silent — non-critical
    }
  };

  const deleteOne = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setItems((prev) => prev.filter((n) => n.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
      toast.success('Đã xóa', 'Đã xóa thông báo khỏi danh sách.');
    } catch {
      toast.error('Lỗi', 'Không thể xóa thông báo.');
    }
  };

  const handleClickItem = (n: NotificationItem) => {
    if (!n.is_read) {
      markOne(n.id);
    }
    if (n.link) {
      router.push(n.link);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const unreadCount = items.filter((n) => !n.is_read).length;

  return (
    <motion.div
      key="notifications"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100 mb-1">
            Thông báo
          </h3>
          <p className="text-xs text-stone-400 dark:text-stone-500">
            {total > 0 ? `${total} thông báo · ${unreadCount} chưa đọc` : 'Không có thông báo nào'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Filter */}
          <div className="flex items-center border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
            {(['all', 'unread'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                  filter === f
                    ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                    : 'text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
                }`}
              >
                {f === 'all' ? 'Tất cả' : 'Chưa đọc'}
              </button>
            ))}
          </div>
          {/* Mark all read */}
          {unreadCount > 0 && (
            <button
              onClick={markAll}
              disabled={markingAll}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-stone-200 dark:border-stone-700 rounded-lg text-[11px] font-semibold text-stone-600 dark:text-stone-400 hover:border-stone-400 dark:hover:border-stone-500 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {markingAll ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <CheckCheck className="w-3 h-3" />
              )}
              Đọc hết
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center gap-2 py-8">
          <Loader2 className="w-4 h-4 text-stone-400 animate-spin" />
          <span className="text-xs text-stone-400">Đang tải thông báo...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-100 dark:border-stone-800">
          {filter === 'unread' ? (
            <>
              <CheckCheck className="w-8 h-8 text-emerald-400 mb-3" />
              <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                Không có thông báo chưa đọc
              </p>
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
                Bạn đã đọc tất cả thông báo rồi!
              </p>
            </>
          ) : (
            <>
              <Inbox className="w-8 h-8 text-stone-300 dark:text-stone-600 mb-3" />
              <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                Chưa có thông báo
              </p>
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
                Thông báo hệ thống sẽ xuất hiện tại đây
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden divide-y divide-stone-100 dark:divide-stone-800">
          {items.map((n) => {
            const style = TYPE_STYLES[n.type] ?? TYPE_STYLES['info']!;
            return (
              <div
                key={n.id}
                onClick={() => handleClickItem(n)}
                className={`group flex items-start gap-4 px-5 py-4 transition-colors cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800/50 ${
                  !n.is_read ? 'bg-amber-500/5 dark:bg-amber-500/10' : ''
                }`}
              >
                {/* Type dot */}
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${style.dot}`} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p
                      className={`text-sm leading-snug flex items-center gap-1.5 ${n.is_read ? 'text-stone-600 dark:text-stone-400 font-normal' : 'text-stone-900 dark:text-stone-100 font-semibold'}`}
                    >
                      {n.title}
                      {n.link && (
                        <ExternalLink className="w-3 h-3 text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </p>
                    <span className="text-[10px] text-stone-400 dark:text-stone-500 flex-shrink-0 font-mono">
                      {formatRelativeTime(n.created_at)}
                    </span>
                  </div>
                  {n.message && (
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 line-clamp-2">
                      {n.message}
                    </p>
                  )}
                </div>

                {/* Action controls */}
                <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                  {!n.is_read && (
                    <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                  )}
                  <button
                    onClick={(e) => deleteOne(e, n.id)}
                    title="Xóa thông báo"
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-400 hover:text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-[11px] text-stone-400 dark:text-stone-500">
            Trang {page}/{totalPages} · {total} thông báo
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => load(page - 1)}
              disabled={page <= 1 || loading}
              className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-[11px] font-medium text-stone-600 dark:text-stone-400 disabled:opacity-40 hover:border-stone-400 dark:hover:border-stone-500 transition-colors"
            >
              ← Trước
            </button>
            <button
              onClick={() => load(page + 1)}
              disabled={page >= totalPages || loading}
              className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-[11px] font-medium text-stone-600 dark:text-stone-400 disabled:opacity-40 hover:border-stone-400 dark:hover:border-stone-500 transition-colors"
            >
              Tiếp →
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
